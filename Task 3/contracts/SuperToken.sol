// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract SuperToken is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("SuperToken", "SPT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }

    function assignTokens(address _to, uint256 _amount) public onlyRole(MINTER_ROLE) {
        require(_amount > 0, "0 as amount is not supported");
        require(address(0) != _to);

        if (balanceOf(address(this)) >= _amount) {
            _transfer(address(this), _to, _amount);
        } else {
            _mint(_to, _amount);
        }
    }

    function returnTokens(address _from, uint256 _amount) public onlyRole(MINTER_ROLE) {
        require(_amount > 0, "Amount can not be zero");
        require(address(0) != _from, "Address can not be zero");
        require(balanceOf(_from) >= _amount, "Insufficient amount");

        _transfer(_from, address(this), _amount);
    }
}

