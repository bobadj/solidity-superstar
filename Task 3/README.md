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
[Staking - 0xd890b347B589aa0C1aedEe13DEA4396B1d6c1074](https://sepolia.etherscan.io/address/0xd890b347B589aa0C1aedEe13DEA4396B1d6c1074)

[ERC20 - 0x48f028374023556B4FdBB7a60b8261623e3FE977](https://sepolia.etherscan.io/token/0x48f028374023556B4FdBB7a60b8261623e3FE977)

