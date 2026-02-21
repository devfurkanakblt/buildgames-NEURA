// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Simple test contract to verify Hardhat setup
contract TestContract {
    uint256 public value;
    
    constructor() {
        value = 42;
    }
    
    function setValue(uint256 _value) external {
        value = _value;
    }
}
