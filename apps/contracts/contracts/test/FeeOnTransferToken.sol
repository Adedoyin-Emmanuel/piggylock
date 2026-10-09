// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice TEST ONLY. Burns 1% of every transfer, so recipients get less than
/// sent. The fee can be switched off/on to model an issuer enabling it later.
contract FeeOnTransferToken is ERC20 {
    bool public feeEnabled = true;

    constructor() ERC20("Fee On Transfer", "FOT") {}

    function setFeeEnabled(bool enabled) external {
        feeEnabled = enabled;
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 amount) internal override {
        if (feeEnabled && from != address(0) && to != address(0)) {
            uint256 burned = amount / 100;
            super._update(from, address(0), burned);
            amount -= burned;
        }
        super._update(from, to, amount);
    }
}
