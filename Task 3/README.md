## Instructions:

```bash
echo "ALCHEMY_API_KEY=" >> .env
npm install
npx hardhat test
```

Goal: Using `hardhat` develop a smart contract with staking and unstaking functionality.
The minimal staking period is 6 months and the investor should receive some ERC-20 token in return.
Token calculation should be done with ETH/USD Oracle, 1 token for 1$.
To unstake, a user should provide ERC-20 tokens in return.

## Contract addresses:
[Staking contract address](https://sepolia.etherscan.io/address/)

[ERC20](https://sepolia.etherscan.io/address/)

