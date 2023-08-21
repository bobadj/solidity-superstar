## Instructions:
```bash
npm install
npx hardhat test
```

Goal: Using YUL write a function to extract color from NFT metadata packed as `bytes32` variable.
Metadata uses the last `20` bytes for `address`, the next `3` for color, the following `1` for `isTransferable`, and the next 8 for `tokenId`.