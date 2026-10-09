// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice TEST ONLY. Freely mintable stand-in for USD₮ with configurable decimals.
/// Used by automated tests and as the testnet token (the Celo Sepolia faucet
/// does not dispense USD₮). It has no value and must never be used on mainnet.
contract MockUSDT is ERC20 {
    uint8 private immutable _decimals;

    constructor(uint8 decimals_) ERC20("Test USDT (no value)", "tUSDT") {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
