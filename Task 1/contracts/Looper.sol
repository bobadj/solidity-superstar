// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Looper {
    function doStuff(uint256 i) private pure returns (uint256) {
        return i;
    }

    function loop() public pure {
        uint256 i;
        do {
            doStuff(i);
            unchecked { ++i; }
        } while (i < 100);
    }
}
