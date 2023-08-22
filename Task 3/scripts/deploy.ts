import { ethers, network } from "hardhat";
import { BaseContract, ContractFactory } from "ethers";

const SEPOLIA_PRICE_ORACLE: string = '0x694AA1769357215DE4FAC081bf1f309aDC325306';

async function main() {
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

  // grants minter role for SuperStaking contract
  const minterRole: string = ethers.solidityPackedKeccak256(['string'], ['MINTER_ROLE']);
  const tsx = await superToken.grantRole(minterRole.toString(), await superStaking.getAddress());
  await tsx.wait(1);

  console.log(`SuperStaking ( ${superStakingAddress} ) has been granted MINTER_ROLE for SuperToken ( ${superTokenAddress} )`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
