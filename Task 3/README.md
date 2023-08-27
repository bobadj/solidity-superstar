## Instructions:
```bash
echo "ALCHEMY_API_KEY=" >> .env
npm install
npx hardhat test
```
##### Note: `ALCHEMY_API_KEY` is required in order to fork Sepolia network

## Deployment
```bash
npx hardhat run scripts/deploy.ts --network sepolia 
```
##### Note: `ALCHEMY_API_KEY` and `SEPOLIA_PRIVATE_KEY` are required

## Verify contracts on Etherscan
```bash
npx hardhat verify "CONTRACT_ADDRESS" --network sepolia
npx hardhat verify --constructor-args arguments.js "CONTRACT_ADDRESS" --network sepolia
```
##### Note: `ETHERSCHAN_API_KEY` is required
____
Goal: Using `hardhat` develop, deploy and verify a smart contract with staking and unstaking functionality.
The minimal staking period is 6 months and the investor should receive some ERC-20 token in return.
Token calculation should be done with ETH/USD Oracle, 1 token for 1$.
To unstake, a user should provide ERC-20 tokens in return.

## Contract addresses:
[Staking - 0xdD43f4356eae9345822D3CA18DE85FAC55e0a375](https://sepolia.etherscan.io/address/0xdD43f4356eae9345822D3CA18DE85FAC55e0a375)

[ERC20 - 0x3d6c5bf37e24f9D34C2a8876CC912582542E2E55](https://sepolia.etherscan.io/token/0x3d6c5bf37e24f9D34C2a8876CC912582542E2E55)

