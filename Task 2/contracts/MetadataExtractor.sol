// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract MetadataExtractor {
    function extractColor(bytes32 data) external pure returns (bytes3 result) {
        assembly {
            // 32 - ( 20 + 3 ) = 9 * 8 = 72
            result := shl(72, data)
        }
    }
}
