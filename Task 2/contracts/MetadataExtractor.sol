// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract MetadataExtractor {
    /*
    * Extract color from NFT metadata
    *
    * @param _metadata - NFT metadata
    *
    * @notice 32 - ( 20 + 3 ) = 9 * 8 = 72
    *
    * @return bytes3 - hexadecimal representation of color
    */
    function extractColor(bytes32 _metadata) external pure returns (bytes3 result) {
        assembly {
            result := shl(72, _metadata)
        }
    }
}
