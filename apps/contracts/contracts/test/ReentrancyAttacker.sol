// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ITokenReceiver {
    function onTokenReceived() external;
}

interface ISavingsVault {
    function createVault(uint256 amount, uint256 lockDuration) external returns (uint256);
    function withdraw(uint256 vaultId) external;
}

/// @notice TEST ONLY. ERC-20 that calls back into the recipient on transfer,
/// giving a malicious recipient a chance to re-enter the vault.
contract ReentrantToken is ERC20 {
    address public hookTarget;

    constructor() ERC20("Reentrant Token", "REENT") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setHookTarget(address target) external {
        hookTarget = target;
    }

    function _update(address from, address to, uint256 amount) internal override {
        super._update(from, to, amount);
        if (to == hookTarget && from != address(0)) {
            ITokenReceiver(to).onTokenReceived();
        }
    }
}

/// @notice TEST ONLY. Owns vaults and, when it receives tokens during a
/// withdrawal, tries to re-enter the vault: either withdrawing another vault
/// or creating a new one in the same call.
contract ReentrancyAttacker is ITokenReceiver {
    ISavingsVault public immutable vault;
    IERC20 public reenterToken;
    uint256 public reenterVaultId;
    bool public reenterCreate;
    bool public armed;

    constructor(ISavingsVault vault_) {
        vault = vault_;
    }

    function deposit(IERC20 token, uint256 amount, uint256 lockDuration) external returns (uint256) {
        token.approve(address(vault), amount);
        return vault.createVault(amount, lockDuration);
    }

    function withdraw(uint256 vaultId) external {
        vault.withdraw(vaultId);
    }

    function arm(uint256 vaultId) external {
        reenterVaultId = vaultId;
        reenterCreate = false;
        armed = true;
    }

    function armCreate(IERC20 token) external {
        reenterToken = token;
        reenterCreate = true;
        armed = true;
    }

    function onTokenReceived() external override {
        if (!armed) return;
        armed = false;
        if (reenterCreate) {
            reenterToken.approve(address(vault), 1);
            vault.createVault(1, 1 days);
        } else {
            vault.withdraw(reenterVaultId);
        }
    }
}
