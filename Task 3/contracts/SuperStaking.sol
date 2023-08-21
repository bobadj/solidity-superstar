// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./SuperToken.sol";

contract SuperStaking is Ownable {
    SuperToken internal immutable superToken;
    AggregatorV3Interface internal immutable priceFeed;

    struct Stake {
        uint256 amount;
        uint256 unlockAt;
    }

    uint256 public minStakingPeriod = 6 * 30 days;

    uint256 public totalStaked;
    mapping(address => Stake) public investments;
    mapping(address => uint) public superTokenAssigned;

    modifier zeroNotAllowed(uint256 _value) {
        require(_value > 0, "0 not allowed.");
        _;
    }

    event Withdrawal();
    event EtherReceived(address, uint256);
    event Staked(address indexed user, uint256 amount, uint256 period, int256 atPrice);
    event Withdrawn(address indexed user, uint256 amount, int256 atPrice);

    constructor(address _superToken, address _priceFeed) {
        superToken = SuperToken(_superToken);
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
    * @notice should emit Staked() event
    */
    function stake(uint256 _period) zeroNotAllowed(msg.value) public payable {
        require(_period >= minStakingPeriod, "Staking period can not be less then 6 months");

        (,int256 ethUsdPrice,,uint256 updatedAt,) = priceFeed.latestRoundData();
        require(updatedAt > 0, "Not able to determinate ETH/USD price at this moment");

        address payable contractAddress = payable(address(this));
        (bool sent,) = contractAddress.call{value : msg.value}("");
        require(sent, "Failed to send Ether.");

        uint256 tokensToAssign = (msg.value * uint256(ethUsdPrice)) * (10**(superToken.decimals() - priceFeed.decimals()));
        superToken.assignTokens(msg.sender, tokensToAssign);

        Stake memory staked = investments[msg.sender];

        totalStaked += msg.value;
        superTokenAssigned[msg.sender] += tokensToAssign;

        staked.amount += msg.value;
        staked.unlockAt = block.timestamp + _period;
        investments[msg.sender] = staked;

        emit Staked(msg.sender, msg.value, _period, ethUsdPrice);
    }

    /*
    * Withdraw/Unstake tokens
    *
    * @param _amount - amount to be withdrawn
    *
    * @notice to withdraw tokens address should provide SPT token in return
    * @notice should emit Withdrawn() event
    */
    function withdraw(uint256 _amount) zeroNotAllowed(_amount) public payable {
        Stake memory staked = investments[msg.sender];

        require(staked.unlockAt > 0, "You did not staked anything yet.");
        require(staked.amount > 0, "There is nothing to withdraw.");
        require(_amount <= staked.amount, "You are now allow to withdraw that much.");
        require(block.timestamp > staked.unlockAt, "Staking period is not over yet.");

        (,int256 ethUsdPrice,,uint256 updatedAt,) = priceFeed.latestRoundData();
        require(updatedAt > 0, "Not able to determinate ETH/USD price at this moment");

        uint256 tokensToReturn = (_amount * uint256(ethUsdPrice)) * (10**(superToken.decimals() - priceFeed.decimals()));
        require(superToken.balanceOf(msg.sender) >= tokensToReturn, "You dont have enough STP tokens");
        superToken.returnTokens(msg.sender, tokensToReturn);

        (bool sent,) = payable(msg.sender).call{value : _amount}("");
        require(sent, "Failed to send Ether.");

        staked.amount -= _amount;
        investments[msg.sender] = staked;

        totalStaked -= _amount;
        superTokenAssigned[msg.sender] -= tokensToReturn;

        emit Withdrawn(msg.sender, _amount, ethUsdPrice);
    }
}