import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseContract, Contract, ContractTransactionResponse, Signer } from "ethers";
import { SuperStaking, SuperStaking__factory, SuperToken, SuperToken__factory } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import AggregatorV3InterfaceABI from './../abis/AggregatorV3Interface.abi.json'

const SEPOLIA_PRICE_ORACLE: string = '0x694AA1769357215DE4FAC081bf1f309aDC325306';
const SIX_MONTHS_IN_SEC: number = 15552000;

describe("SuperStaking", function () {
    const priceFeedDecimals: number = 8,
          superTokenDecimals: number = 18,
          tokensToMint: number = 100000,
          stakeValue: any = 10,
          stakePeriod: any = SIX_MONTHS_IN_SEC;

    let priceFeed: BaseContract,
        superStaking: SuperStaking,
        superToken: SuperToken,
        owner: Signer,
        otherSigners: Signer[];

    before("Deploy the contracts first", async function() {
        [ owner, otherSigners ] = await ethers.getSigners();
        // deploy SuperToken
        const SuperToken: SuperToken__factory = await ethers.getContractFactory("SuperToken");
        superToken = await SuperToken.deploy();
        await superToken.waitForDeployment();

        // deploy SuperStaking contract with SuperToken address in constructor
        const SuperStaking: SuperStaking__factory = await ethers.getContractFactory("SuperStaking");
        superStaking = await SuperStaking.deploy(await superToken.getAddress(), SEPOLIA_PRICE_ORACLE);
        await superToken.waitForDeployment();

        const PriceFeed: Contract = new ethers.Contract(SEPOLIA_PRICE_ORACLE, AggregatorV3InterfaceABI);
        priceFeed = PriceFeed.connect(owner);

        // mint 100.000 tokens for SuperStaking contract
        const superStakingAddress: any = await superStaking.getAddress();
        // had to do it this way, not able to multiply with 1e18
        const tokensToMinInWei: any = `${tokensToMint}${'0'.repeat(superTokenDecimals)}`;
        const tsx: ContractTransactionResponse = await superToken.mint(superStakingAddress, tokensToMinInWei);
        await tsx.wait(1);
    });

    it("Should not be able to stake if period is less then 6 months", async () => {
        // try with 24h first
        let period: any = 86400;
        let params: any = { value: 10 };
        await expect(superStaking.stake(period, params)).to.be.revertedWith("Staking period can not be less then 6 months");
        // try again with Six months - 1 day
        period = stakePeriod - 86400;
        await expect(superStaking.stake(period, params)).to.be.revertedWith("Staking period can not be less then 6 months");
    });

    it("Should not be able to stake 0", async () => {
        await expect(superStaking.stake(stakePeriod)).to.be.revertedWith("0 not allowed.");
    });

    it("Should not be allow to withdraw as no stake has been made", async () => {
        await expect(superStaking.withdraw()).to.be.revertedWith("You did not staked anything yet.");
    });

    it("Should emit Stake event", async () => {
        const address: string = await owner.getAddress();
        const ethUsdPrice: number = (await priceFeed.latestRoundData()).answer.toString();
        const params: any = { value: stakeValue };

        await expect(superStaking.stake(stakePeriod, params)).to.emit(superStaking, 'Staked')
            .withArgs(address, stakeValue, stakePeriod, ethUsdPrice);
    });

    it("Should get STP tokens in return", async () => {
        const address: any = await owner.getAddress();
        const ethUsdPrice: number = (await priceFeed.latestRoundData()).answer.toString();
        const totalReward: string = `${stakeValue * ethUsdPrice}${'0'.repeat(superTokenDecimals - priceFeedDecimals)}`;

        const balance: BigInt = await superToken.balanceOf(address);
        expect(ethers.formatEther(balance)).to.be.equal(ethers.formatEther(totalReward));
    });

    it("Should not be able to stake twice", async () => {
        const params: any = { value: stakeValue };
        await expect(superStaking.stake(stakePeriod, params)).to.be.revertedWith("You have to withdraw before another stake.");
    });

    it("Should not be allow to withdraw before period", async () => {
        await expect(superStaking.withdraw()).to.be.revertedWith("Staking period is not over yet.");
    });

    it("Should withdraw successfully", async () => {
        const unlockTime: number = (await time.latest()) + SIX_MONTHS_IN_SEC;
        const investorAddress: any = await owner.getAddress();
        const investorStake: any = await superStaking.investments(investorAddress);
        const superStakingAddress: any = await superStaking.getAddress();

        await time.increaseTo(unlockTime);

        await superToken.approve(superStakingAddress, investorStake.totalTokensReceived);
        await expect(superStaking.withdraw()).to.be.emit(superStaking, "Withdrawn")
            .withArgs(investorAddress, stakeValue);
    });

    it("Should not be able to withdraw any more", async () => {
        await expect(superStaking.withdraw()).to.be.revertedWith("You did not staked anything yet.");
    });
});
