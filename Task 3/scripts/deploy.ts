import { ethers, network } from "hardhat";
import { BaseContract, ContractFactory } from "ethers";

const SEPOLIA_PRICE_ORACLE: string = '0x694AA1769357215DE4FAC081bf1f309aDC325306';
const TOKENS_TO_MINT: number = 100000;

async function main() {
  // deploy SuperToken
  const SuperToken: ContractFactory = await ethers.getContractFactory("SuperToken");
  const superToken: BaseContract = await SuperToken.deploy();
  await superToken.waitForDeployment();
  const superTokenAddress: string = await superToken.getAddress();
  console.log(`SuperToken deployed, address: ${superTokenAddress}, Etherscan: https://${network.name}.etherscan.io/address/${superTokenAddress}`);

  // deploy SuperStaking contract with SuperToken & PriceFeed address in constructor
  const SuperStaking: ContractFactory = await ethers.getContractFactory("SuperStaking");
  let superStaking: BaseContract = await SuperStaking.deploy(await superToken.getAddress(), SEPOLIA_PRICE_ORACLE);
  await superToken.waitForDeployment();
  const superStakingAddress: string = await superStaking.getAddress();
  console.log(`SuperStaking deployed, address: ${superStakingAddress}, Etherscan: https://${network.name}.etherscan.io/address/${superStakingAddress}`);

  // mint 100.000 tokens for SuperStaking contract
  const tsx = await superToken.mint(superStakingAddress, `${TOKENS_TO_MINT}${'0'.repeat(18)}`);
  await tsx.wait(1);

  console.log(`${TOKENS_TO_MINT} has been minted for SuperStaking contract`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
