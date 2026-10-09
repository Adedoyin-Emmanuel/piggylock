// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @title SavingsVault (Lockbox)
/// @notice Lock a single, pre-configured stablecoin until a chosen maturity date.
///
/// Trust model — there is deliberately no owner, admin, pause, upgrade or
/// emergency path. Every parameter is fixed at deployment:
///   - `token`, `treasury`, `feeBps` and `minLockDuration` are immutable.
///   - A vault's `maturity` is written once at creation and never modified.
///   - Only the vault owner can withdraw, only once, only at/after maturity.
///   - Fees are accrued, not pushed. `withdraw` only transfers to the vault
///     owner, so a problem with the treasury (e.g. the token issuer blocking
///     it) can never block anyone's principal. Anyone may call `claimFees`
///     to send accrued fees — and only accrued fees — to the fixed treasury.
///
/// Fee policy — `feeBps` (25 = 0.25%) of the principal is deducted at
/// withdrawal and accrued for `treasury`. Rounded down, so the user is never
/// charged more than the stated rate. Because `feeBps` is immutable, the fee a
/// user sees when depositing is the fee they will pay when withdrawing.
///
/// Decimals — all accounting is in the token's raw base units; the contract
/// never scales amounts, so it is correct for 6- or 18-decimal tokens alike.
/// `decimals()` is checked at deployment against what the deployer expects
/// to catch pointing the vault at the wrong token.
///
/// Unsupported tokens — deposits verify the exact amount arrived, so
/// fee-on-transfer tokens are rejected. Rebasing tokens are NOT supported
/// (a negative rebase could make later withdrawals fail); deploy only
/// against plain ERC-20 stablecoins such as USD₮.
contract SavingsVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Vault {
        address owner; // ─┐ packed into one slot
        uint64 maturity; //  │ unix seconds, immutable once set
        bool withdrawn; // ─┘
        uint256 amount; // principal in token base units
    }

    uint256 public constant BPS_DENOMINATOR = 10_000;
    /// @notice Hard cap so a typo at deployment can't create an abusive fee.
    uint256 public constant MAX_FEE_BPS = 100; // 1%
    /// @notice Hard cap so a typo in the UI can't lock funds for centuries.
    uint256 public constant MAX_LOCK_DURATION = 3650 days; // ~10 years

    IERC20 public immutable token;
    address public immutable treasury;
    uint256 public immutable feeBps;
    uint256 public immutable minLockDuration;

    uint256 public vaultCount;
    /// @notice Fees earned from completed withdrawals, not yet sent to `treasury`.
    uint256 public accruedFees;
    mapping(uint256 vaultId => Vault) private _vaults;
    mapping(address owner => uint256[]) private _vaultIdsByOwner;

    event VaultCreated(uint256 indexed vaultId, address indexed owner, uint256 amount, uint64 maturity);
    event VaultWithdrawn(uint256 indexed vaultId, address indexed owner, uint256 netAmount, uint256 fee);
    event FeesClaimed(address indexed treasury, uint256 amount);

    error ZeroAddress();
    error FeeTooHigh();
    error InvalidMinLockDuration();
    error UnexpectedDecimals(uint8 actual, uint8 expected);
    error ZeroAmount();
    error InvalidLockDuration();
    error UnsupportedTokenBehavior();
    error VaultNotFound();
    error NotVaultOwner();
    error VaultNotMatured(uint64 maturity);
    error AlreadyWithdrawn();
    error NoFeesToClaim();

    constructor(
        IERC20 token_,
        uint8 expectedDecimals,
        address treasury_,
        uint256 feeBps_,
        uint256 minLockDuration_
    ) {
        if (address(token_) == address(0) || treasury_ == address(0)) revert ZeroAddress();
        if (feeBps_ > MAX_FEE_BPS) revert FeeTooHigh();
        if (minLockDuration_ == 0 || minLockDuration_ > MAX_LOCK_DURATION) revert InvalidMinLockDuration();
        uint8 actual = IERC20Metadata(address(token_)).decimals();
        if (actual != expectedDecimals) revert UnexpectedDecimals(actual, expectedDecimals);

        token = token_;
        treasury = treasury_;
        feeBps = feeBps_;
        minLockDuration = minLockDuration_;
    }

    /// @notice Lock `amount` (token base units) for `lockDuration` seconds.
    /// @dev Caller must first `approve` this contract for `amount`.
    function createVault(uint256 amount, uint256 lockDuration) external nonReentrant returns (uint256 vaultId) {
        if (amount == 0) revert ZeroAmount();
        if (lockDuration < minLockDuration || lockDuration > MAX_LOCK_DURATION) revert InvalidLockDuration();

        // Pull funds and confirm exactly `amount` arrived (rejects fee-on-transfer).
        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        if (token.balanceOf(address(this)) - balanceBefore != amount) revert UnsupportedTokenBehavior();

        uint64 maturity = uint64(block.timestamp + lockDuration);
        vaultId = vaultCount++;
        _vaults[vaultId] = Vault({owner: msg.sender, maturity: maturity, withdrawn: false, amount: amount});
        _vaultIdsByOwner[msg.sender].push(vaultId);

        emit VaultCreated(vaultId, msg.sender, amount, maturity);
    }

    /// @notice Withdraw a matured vault. Sends principal minus fee to the owner;
    ///         the fee is accrued for the treasury (see `claimFees`).
    function withdraw(uint256 vaultId) external nonReentrant {
        Vault storage vault = _getVault(vaultId);
        if (msg.sender != vault.owner) revert NotVaultOwner();
        if (vault.withdrawn) revert AlreadyWithdrawn();
        if (block.timestamp < vault.maturity) revert VaultNotMatured(vault.maturity);

        // Effects before interactions.
        vault.withdrawn = true;
        (uint256 netAmount, uint256 fee) = _split(vault.amount);
        accruedFees += fee;

        token.safeTransfer(vault.owner, netAmount);

        emit VaultWithdrawn(vaultId, vault.owner, netAmount, fee);
    }

    /// @notice Send all accrued fees to the treasury. Callable by anyone; the
    ///         destination is fixed and the amount can never exceed fees earned
    ///         from completed withdrawals, so principal is never reachable.
    function claimFees() external nonReentrant {
        uint256 amount = accruedFees;
        if (amount == 0) revert NoFeesToClaim();
        accruedFees = 0;
        token.safeTransfer(treasury, amount);
        emit FeesClaimed(treasury, amount);
    }

    /// @notice What withdrawing `amount` of principal would pay out.
    function previewWithdrawal(uint256 amount) external view returns (uint256 netAmount, uint256 fee) {
        return _split(amount);
    }

    function getVault(uint256 vaultId) external view returns (Vault memory) {
        return _getVault(vaultId);
    }

    function getVaultIds(address owner) external view returns (uint256[] memory) {
        return _vaultIdsByOwner[owner];
    }

    /// @notice All vaults for `owner`, for single-call UI loading.
    function getVaults(address owner) external view returns (uint256[] memory ids, Vault[] memory vaults) {
        ids = _vaultIdsByOwner[owner];
        vaults = new Vault[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            vaults[i] = _vaults[ids[i]];
        }
    }

    function _getVault(uint256 vaultId) private view returns (Vault storage vault) {
        vault = _vaults[vaultId];
        if (vault.owner == address(0)) revert VaultNotFound();
    }

    function _split(uint256 amount) private view returns (uint256 netAmount, uint256 fee) {
        // mulDiv avoids overflow on (amount * feeBps) for any representable amount,
        // so a withdrawal can never be bricked by arithmetic.
        fee = Math.mulDiv(amount, feeBps, BPS_DENOMINATOR);
        netAmount = amount - fee;
    }
}
