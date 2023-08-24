import { ethers, network } from "hardhat";
import { SuperStaking, SuperStaking__factory, SuperToken, SuperToken__factory } from "../typechain-types";
import { ContractTransactionResponse } from "ethers";

const SEPOLIA_PRICE_ORACLE: string = '0x694AA1769357215DE4FAC081bf1f309aDC325306';
const TOKENS_TO_MINT: any = `100000${'0'.repeat(18)}`;

async function main() {
  // deploy SuperToken
  const SuperToken: SuperToken__factory = await ethers.getContractFactory("SuperToken");
  const superToken: SuperToken = await SuperToken.deploy();
  await superToken.waitForDeployment();
  const superTokenAddress: string = await superToken.getAddress();
  console.log(`SuperToken deployed, address: ${superTokenAddress}, Etherscan: https://${network.name}.etherscan.io/address/${superTokenAddress}`);

  // deploy SuperStaking contract with SuperToken address in constructor
  const SuperStaking: SuperStaking__factory = await ethers.getContractFactory("SuperStaking");
  const superStaking: SuperStaking = await SuperStaking.deploy(await superToken.getAddress(), SEPOLIA_PRICE_ORACLE);
  await superToken.waitForDeployment();
  const superStakingAddress: any = await superStaking.getAddress();
  console.log(`SuperStaking deployed, address: ${superStakingAddress}, Etherscan: https://${network.name}.etherscan.io/address/${superStakingAddress}`);

  // mint 100.000 tokens for SuperStaking contract
  const tsx: ContractTransactionResponse = await superToken.mint(superStakingAddress, TOKENS_TO_MINT);
  await tsx.wait(1);

  console.log(`${TOKENS_TO_MINT} has been minted for SuperStaking contract`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
