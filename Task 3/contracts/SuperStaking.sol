// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SuperStaking is Ownable {
    ERC20 internal immutable superToken;
    AggregatorV3Interface internal immutable priceFeed;

    struct Stake {
        uint256 amount;
        uint256 unlockAt;
        int256 ethUsdPrice;
        uint256 totalTokensReceived;
    }

    uint256 public minStakingPeriod = 6 * 30 days;

    uint256 public totalStaked;
    mapping(address => Stake) public investments;
    mapping(address => uint) public superTokenAssigned;

    event Withdrawal();
    event EtherReceived(address, uint256);
    event Withdrawn(address indexed user, uint256 amount);
    event Staked(address indexed user, uint256 amount, uint256 period, int256 atPrice);

    constructor(address _superToken, address _priceFeed) {
        superToken = ERC20(_superToken);
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }

    /*
    * Withdraw funds to owner
    *
    * @notice be careful! contract should have enough funds for unstake
    * @notice available for contract owner only
    *
    * no returns
    */
    function withdrawEther(uint256 _amount) onlyOwner public payable {
        require(totalStaked < address(this).balance - _amount, "You are not allowed to withdraw that much.");

        address payable ownerAddress = payable(address(owner()));
        (bool sent,) = ownerAddress.call{value : _amount}("");
        require(sent, "Failed to send Ether.");

        emit Withdrawal();
    }

    /*
    * Stake tokens
    *
    * @params uint256 _period - staking period
    *
    * @notice staking period should not be less then 6 months
    * @notice in return for staking, address should be rewarded with SPT tokens 1$ = 1SPT
    * @notice make sure that contract has enough SPT tokens
    * @notice should emit Staked() event
    */
    function stake(uint256 _period) public payable {
        require(_period >= minStakingPeriod, "Staking period can not be less then 6 months");
        require(msg.value > 0, "0 not allowed.");

        Stake memory staked = investments[msg.sender];
        require(staked.amount <= 0, "You have to withdraw before another stake.");

        (,int256 ethUsdPrice,,uint256 updatedAt,) = priceFeed.latestRoundData();
        require(updatedAt > 0, "Not able to determinate ETH/USD price at this moment");
        uint256 tokensToAssign = (msg.value * uint256(ethUsdPrice)) * (10**(superToken.decimals() - priceFeed.decimals()));
        require(superToken.balanceOf(address(this)) >= tokensToAssign, "Not enough SPT tokens to complete transfer");

        address payable contractAddress = payable(address(this));
        (bool sent,) = contractAddress.call{value : msg.value}("");
        require(sent, "Failed to send Ether.");

        superToken.transfer(msg.sender, tokensToAssign);

        totalStaked += msg.value;
        superTokenAssigned[msg.sender] += tokensToAssign;

        staked.amount += msg.value;
        staked.unlockAt = block.timestamp + _period;
        staked.ethUsdPrice = ethUsdPrice;
        staked.totalTokensReceived = tokensToAssign;
        investments[msg.sender] = staked;

        emit Staked(msg.sender, msg.value, _period, ethUsdPrice);
    }

    /*
    * Withdraw/Unstake tokens
    *
    * @notice to withdraw tokens address should provide SPT token in return
    * @notice approve or increaseAllowance is required
    * @notice should emit Withdrawn() event
    */
    function withdraw() public payable {
        Stake memory staked = investments[msg.sender];

        require(staked.unlockAt > 0, "You did not staked anything yet.");
        require(block.timestamp > staked.unlockAt, "Staking period is not over yet.");

        require(superToken.balanceOf(msg.sender) >= staked.totalTokensReceived, "You dont have enough STP tokens");
        superToken.transferFrom(msg.sender, address(this), staked.totalTokensReceived);

        (bool sent,) = payable(msg.sender).call{value : staked.amount}("");
        require(sent, "Failed to send Ether.");

        delete investments[msg.sender];

        totalStaked -= staked.amount;
        superTokenAssigned[msg.sender] -= staked.totalTokensReceived;

        emit Withdrawn(msg.sender, staked.amount);
    }
}