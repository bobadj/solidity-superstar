pragma experimental ABIEncoderV2; // required
pragma solidity ^0.6.2;

import {Test, console2, console} from "forge-std/Test.sol";
import {TreasuryVester, IUni, SafeMath} from "../src/TreasuryVester.sol";

contract UniTest is IUni {

    mapping(address => uint256) public balances;

    function balanceOf(address account) external view override returns (uint) {
        require(account != address(0), "UniTest: Address can not be zero.");

        return balances[account];
    }

    function transfer(address dst, uint rawAmount) external override returns (bool) {
        require(dst != address(0), "UniTest: DST address can not be zero.");
        balances[dst] += rawAmount;
        return true;
    }
}

contract TreasuryVesterTest is Test {
    using SafeMath for uint;

    TreasuryVester public treasuryVester;
    UniTest public uniToken;
    address public recipient;

    uint256 public vestingAmount = 1000;
    uint256 public vestingBegin = block.timestamp + 3600;
    uint256 public vestingCliff = block.timestamp + 7200;
    uint256 public vestingEnd = block.timestamp + 14400;

    function setUp() public {
        uniToken = new UniTest();
        recipient = address(1234);

        treasuryVester = new TreasuryVester(
            address(uniToken),
            recipient,
            vestingAmount,
            vestingBegin,
            vestingCliff,
            vestingEnd
        );

        // transfer 100 to TreasuryVester and recipient
        // to make sure that math is correct
        uniToken.transfer(recipient, 100);
        uniToken.transfer(address(treasuryVester), 100);
    }

    function test_contractDeployment() public {
        vm.expectRevert('TreasuryVester::constructor: vesting begin too early');
        new TreasuryVester(
            address(uniToken),
            recipient,
            vestingAmount,
            block.timestamp - 1,
            vestingCliff,
            vestingEnd
        );

        vm.expectRevert('TreasuryVester::constructor: cliff is too early');
        new TreasuryVester(
            address(uniToken),
            recipient,
            vestingAmount,
            vestingBegin,
            block.timestamp,
            vestingEnd
        );

        vm.expectRevert('TreasuryVester::constructor: end is too early');
        new TreasuryVester(
            address(uniToken),
            recipient,
            vestingAmount,
            vestingBegin,
            vestingCliff,
            block.timestamp
        );
    }

    function test_initialValues() public {
        assertEq(treasuryVester.uni(), address(uniToken));
        assertEq(treasuryVester.recipient(), recipient);
        assertEq(treasuryVester.vestingAmount(), vestingAmount);
        assertEq(treasuryVester.vestingBegin(), vestingBegin);
        assertEq(treasuryVester.vestingCliff(), vestingCliff);
        assertEq(treasuryVester.vestingEnd(), vestingEnd);
    }

    function test_setRecipientFail(address newRecipient) public {
        vm.expectRevert('TreasuryVester::setRecipient: unauthorized');
        treasuryVester.setRecipient(newRecipient);
    }

    function test_setRecipientSuccess() public {
        treasuryVester.setRecipient(address(this));
        assertEq(treasuryVester.recipient(), address(this));
    }

    function test_claimFail() public {
        vm.expectRevert('TreasuryVester::claim: not time yet');
        treasuryVester.claim();
    }

    function test_claimBeforeEnd() public {
        vm.warp(vestingCliff + 3600);
        uint256 lastUpdate = treasuryVester.lastUpdate();
        uint256 recipientBalanceBeforeClaim = uniToken.balanceOf(recipient);

        treasuryVester.claim();
        assertEq(treasuryVester.lastUpdate(), block.timestamp);

        uint256 amount = vestingAmount.mul(block.timestamp - lastUpdate).div(vestingEnd - vestingBegin);
        uint256 recipientBalanceAfterClaim = uniToken.balanceOf(recipient);

        assertEq(recipientBalanceAfterClaim, recipientBalanceBeforeClaim+amount);
    }

    function test_claimAfterEnd() public {
        vm.warp(vestingEnd + 3600);
        uint256 recipientBalanceBeforeClaim = uniToken.balanceOf(recipient);
        uint256 treasuryVesterBalanceBeforeClaim = uniToken.balanceOf(address(treasuryVester));

        treasuryVester.claim();
        uint256 recipientBalanceAfterClaim = uniToken.balanceOf(recipient);

        assertEq(recipientBalanceAfterClaim, recipientBalanceBeforeClaim+treasuryVesterBalanceBeforeClaim);
    }
}
