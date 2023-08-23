import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseContract, Contract, ContractFactory, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import AggregatorV3InterfaceABI from './../abis/AggregatorV3Interface.abi.json'

const SEPOLIA_PRICE_ORACLE: string = '0x694AA1769357215DE4FAC081bf1f309aDC325306';
const SIX_MONTHS_IN_SEC: number = 15552000;

describe("SuperStaking", function () {
    let priceFeed: BaseContract, superStaking: BaseContract, superToken: BaseContract, owner: Signer, availableSigners: Signer[];
    const priceFeedDecimals: number = 8, superTokenDecimals: number = 18, tokensToMint: number = 100000;
    const stakeValue: number = 10, stakePeriod: number = SIX_MONTHS_IN_SEC;

    before("Deploy the contracts first", async function() {
        availableSigners = await ethers.getSigners();
        [ owner ] = availableSigners;
        // deploy SuperToken
        const SuperToken: ContractFactory = await ethers.getContractFactory("SuperToken");
        superToken = await SuperToken.deploy();
        await superToken.waitForDeployment();

        // deploy SuperStaking contract with SuperToken address in constructor
        const SuperStaking: ContractFactory = await ethers.getContractFactory("SuperStaking");
        superStaking = await SuperStaking.deploy(await superToken.getAddress(), SEPOLIA_PRICE_ORACLE);
        await superToken.waitForDeployment();

        const PriceFeed: Contract = new ethers.Contract(SEPOLIA_PRICE_ORACLE, AggregatorV3InterfaceABI);
        priceFeed = PriceFeed.connect(owner);

        // mint 100.000 tokens for SuperStaking contract
        const superStakingAddress: string = await superStaking.getAddress();
        // had to do it this way, not able to multiply with 1e18
        const tsx = await superToken.mint(superStakingAddress, `${tokensToMint}${'0'.repeat(superTokenDecimals)}`);
        await tsx.wait(1);
    });

    it("Should not be able to stake if period is less then 6 months", async () => {
        // try with 24h first
        await expect(superStaking.stake(86400, { value: 10 })).to.be.revertedWith("Staking period can not be less then 6 months");
        // try again with Six months - 1 day
        await expect(superStaking.stake(SIX_MONTHS_IN_SEC - 86400, { value: 10 })).to.be.revertedWith("Staking period can not be less then 6 months");
    });

    it("Should not be able to stake 0", async () => {
        await expect(superStaking.stake(SIX_MONTHS_IN_SEC)).to.be.revertedWith("0 not allowed.");
    });

    it("Should not be allow to withdraw as no stake has been made", async () => {
        await expect(superStaking.withdraw()).to.be.revertedWith("You did not staked anything yet.");
    });

    it("Should emit Stake event", async () => {
        const address: string = await owner.getAddress();
        const ethUsdPrice: number = parseInt([...await priceFeed.latestRoundData()][1]);

        await expect(superStaking.stake(stakePeriod, { value: stakeValue })).to.emit(superStaking, 'Staked')
            .withArgs(address, stakeValue, stakePeriod, ethUsdPrice);
    });

    it("Should get STP tokens in return", async () => {
        const address: string = await owner.getAddress();
        const ethUsdPrice: number = (await priceFeed.latestRoundData()).answer.toString();
        const totalReward: string = `${stakeValue * ethUsdPrice}${'0'.repeat(superTokenDecimals - priceFeedDecimals)}`;

        const balance = await superToken.balanceOf(address);
        expect(ethers.formatEther(balance)).to.be.equal(ethers.formatEther(totalReward));
    });

    it("Should not be able to stake twice", async () => {
        await expect(superStaking.stake(stakePeriod, { value: stakeValue })).to.be.revertedWith("You have to withdraw before another stake.");
    });

    it("Should not be allow to withdraw before period", async () => {
        await expect(superStaking.withdraw()).to.be.revertedWith("Staking period is not over yet.");
    });

    it("Should withdraw successfully", async () => {
        const unlockTime: number = (await time.latest()) + 16000000;
        const investorAddress: string = await owner.getAddress();
        const investorStake: any = await superStaking.investments(investorAddress);
        const superStakingAddress: string = await superStaking.getAddress();

        await time.increaseTo(unlockTime);

        await superToken.approve(superStakingAddress, investorStake.totalTokensReceived);
        await expect(superStaking.withdraw()).to.be.emit(superStaking, "Withdrawn")
            .withArgs(investorAddress, stakeValue);
    });

    it("Should not be able to withdraw any more", async () => {
        await expect(superStaking.withdraw()).to.be.revertedWith("You did not staked anything yet.");
    });
});
