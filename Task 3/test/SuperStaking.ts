import { expect } from "chai";
import { ethers } from "hardhat";
import { BaseContract, Contract, ContractFactory, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import AggregatorV3InterfaceABI from './../abis/AggregatorV3Interface.abi.json'

const SEPOLIA_PRICE_ORACLE: string = '0x694AA1769357215DE4FAC081bf1f309aDC325306';
const SIX_MONTHS_IN_SEC: number = 15552000;

describe("SuperStaking", function () {
    let priceFeed: BaseContract, superStaking: BaseContract, superToken: BaseContract, owner: Signer, availableSigners: Signer[];
    const priceFeedDecimals: number = 8, superTokenDecimals: number = 18;
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

        // grants minter role for SuperStaking contract
        const minterRole: string = ethers.solidityPackedKeccak256(['string'], ['MINTER_ROLE']);
        const tsx = await superToken.grantRole(minterRole.toString(), await superStaking.getAddress());
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
        await expect(superStaking.withdraw(stakeValue)).to.be.revertedWith("You did not staked anything yet.");
    });

    it("Should emit Stake event", async () => {
        const address: string = await owner.getAddress();
        const ethUsdPrice: number = parseInt([...await priceFeed.latestRoundData()][1]);

        await expect(superStaking.stake(stakePeriod, { value: stakeValue })).to.emit(superStaking, 'Staked')
            .withArgs(address, stakeValue, stakePeriod, ethUsdPrice);
    });

    it("Should get STP tokens in return", async () => {
        const address: string = await owner.getAddress();
        const ethUsdPrice: number = parseInt([...await priceFeed.latestRoundData()][1]);
        const totalReward: number = (stakeValue * ethUsdPrice) * (10**(superTokenDecimals - priceFeedDecimals));

        const balance = await superToken.balanceOf(address);
        expect(balance.toString() / 1e18).to.be.equal(totalReward / 1e18);
    });

    it("Should not be allow to withdraw before period", async () => {
        await expect(superStaking.withdraw(stakeValue)).to.be.revertedWith("Staking period is not over yet.");
    });

    it("Should not be able to withdraw more then staked", async () => {
        await expect(superStaking.withdraw(stakeValue+1)).to.be.revertedWith("You are now allow to withdraw that much.");
    });

    it("Should withdraw successfully", async () => {
        const unlockTime: number = (await time.latest()) + 16000000;
        await time.increaseTo(unlockTime);

        const ethUsdPrice: number = parseInt([...await priceFeed.latestRoundData()][1]);

        await expect(superStaking.withdraw(stakeValue)).to.be.emit(superStaking, "Withdrawn")
            .withArgs(await owner.getAddress(), stakeValue, ethUsdPrice);
    });

    it("Should not be able to withdraw any more", async () => {
        await expect(superStaking.withdraw(stakeValue)).to.be.revertedWith("There is nothing to withdraw.");
    });
});
