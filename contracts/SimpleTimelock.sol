// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.5.0) (token/ERC20/utils/TokenTimelock.sol)

pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";

/**
 * @dev A token holder contract that will allow a beneficiary to extract the
 * tokens after a given release time.
 *
 * Useful for simple vesting schedules like "advisors get all of their tokens
 * after 1 year".
 */
contract SimpleTimelock {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    mapping(address => BeneficiaryRecord) _beneficiaries;

    struct BeneficiaryRecord {
        uint256 lastUnlockTime;
        uint256 tokenAmount;
        uint256 releaseTime;
        uint256 unlockInterval;
        uint256 unlockAmount;
    }

    // ERC20 basic token contract being held
    IERC20 private immutable _token;

    // unlock percentage for
    address private immutable _owner;

    uint256 private _lockedTokens; //

    /**
     * @dev Deploys a timelock instance that is able to hold the token specified, and will only release it to
     * `beneficiary_` when {release} is invoked after `releaseTime_`. The release time is specified as a Unix timestamp
     * (in seconds).
     */
    constructor(IERC20 token_, address owner_) {
        _token = token_;
        _lockedTokens = 0;
        _owner = owner_;
    }

    /**
     * @dev Returns the token being held.
     */
    function token() public view virtual returns (IERC20) {
        return _token;
    }

    /**
     * @dev Returns
     */
    function lockedTokens() public view virtual returns (uint256) {
        return _lockedTokens;
    }

    /**
     * @dev Returns
     */
    function beneficiaryRecord(address beneficiaryAddress_)
        public
        view
        virtual
        returns (BeneficiaryRecord memory)
    {
        BeneficiaryRecord memory result = _beneficiaries[beneficiaryAddress_];
        return result;
    }

    /**
     * @dev Returns
     */
    function expectedRelease(address beneficiaryAddress_)
        public
        view
        virtual
        returns (uint256)
    {
        BeneficiaryRecord memory record = _beneficiaries[beneficiaryAddress_];

        if (record.lastUnlockTime == 0) {
            return 0;
        }

        return calculateTokensToUnlock(block.timestamp, record);
    }

    function setBeneficiary(
        address beneficiaryAddress_,
        uint256 tokenAmount_,
        uint256 releaseTime_,
        uint256 unlockInterval_,
        uint256 unlockAmount_
    ) public virtual {
        require(
            msg.sender == _owner,
            "SimpleTimelock: only owner can set beneficiary!"
        );
        BeneficiaryRecord memory record = _beneficiaries[beneficiaryAddress_];
        require(
            record.lastUnlockTime == 0,
            "SimpleTimelock: you can't set the same address more than once!"
        );

        require(
            releaseTime_ > block.timestamp,
            "SimpleTimelock: release time is before current time."
        );

        require(
            releaseTime_ > unlockInterval_,
            "SimpleTimelock: It should be releaseTime_ > unlockInterval_."
        );

        require(
            unlockAmount_ <= tokenAmount_,
            "SimpleTimelock: It should be unlockAmount_ <= tokenAmount_."
        );

        uint256 amount = token().balanceOf(address(this));

        _lockedTokens += tokenAmount_;

        require(
            _lockedTokens <= amount,
            "SimpleTimelock: you can't lock more tokens than you have."
        );
        
        _beneficiaries[beneficiaryAddress_] = BeneficiaryRecord(
            releaseTime_ - unlockInterval_,
            tokenAmount_,
            releaseTime_,
            unlockInterval_,
            unlockAmount_
        );
    }

    /**
     * @dev Transfers tokens held by the timelock to the beneficiary. Will only succeed if invoked after the release
     * time.
     */
    function release() public virtual {
        BeneficiaryRecord memory record = _beneficiaries[msg.sender];

        require(
            record.lastUnlockTime != 0,
            "SimpleTimelock: BeneficiaryRecord does not exist for caller."
        );
        require(
            record.tokenAmount > 0,
            "SimpleTimelock: BeneficiaryRecord amount should be grater than 0."
        );

        require(
            block.timestamp >= record.releaseTime,
            "SimpleTimelock: current time is before release time"
        );

        uint256 amount = token().balanceOf(address(this));
        require(amount > 0, "SimpleTimelock: no tokens to release");

        uint256 curTime = block.timestamp;
        require(
            curTime > record.lastUnlockTime,
            "SimpleTimelock: cur time should be greater than lastUnlockTime"
        );

        uint256 unlockedAmount = calculateTokensToUnlock(curTime, record);

        require(
            unlockedAmount > 0,
            "SimpleTimelock: unlockedAmount should be greater than 0"
        );

        token().safeTransfer(msg.sender, unlockedAmount);

        record.lastUnlockTime = curTime;
        record.tokenAmount -= unlockedAmount;
        _lockedTokens -= unlockedAmount;

        _beneficiaries[msg.sender] = record;
    }

    function calculateTokensToUnlock(
        uint256 curTime,
        BeneficiaryRecord memory record
    ) private pure returns (uint256) {
        if (curTime <= record.lastUnlockTime) {
            return 0;
        }

        uint256 diff = curTime - record.lastUnlockTime;

        uint256 unlockTimes = diff.div(record.unlockInterval);

        if (unlockTimes == 0) {
            return 0;
        }

        uint256 unlockedAmount = record
            .unlockAmount
            .mul(unlockTimes);

        if (unlockedAmount > record.tokenAmount) {
            unlockedAmount = record.tokenAmount;
        }

        return unlockedAmount;
    }
}
