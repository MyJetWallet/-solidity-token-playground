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
    }

    // ERC20 basic token contract being held
    IERC20 private immutable _token;

    // timestamp when token release is enabled
    uint256 private immutable _releaseTime;
    
    // timestamp interval when token percentage is claimable
    uint256 private immutable _unlockInterval;


    // unlock percentage for
    uint256 private immutable _unlockPercentage;

    uint256 private _maxPercentage = 100_000; // means 100.000%

    uint256 private _lockedTokens; //
    /**
     * @dev Deploys a timelock instance that is able to hold the token specified, and will only release it to
     * `beneficiary_` when {release} is invoked after `releaseTime_`. The release time is specified as a Unix timestamp
     * (in seconds).
     */
    constructor(
        IERC20 token_,
        uint256 releaseTime_,
        uint256 unlockInterval_,
        uint256 unlockPercentage_
    ) {
        require(
            releaseTime_ > block.timestamp,
            "SimpleTimelock: release time is before current time."
        );
        require(
            unlockPercentage_ > 0 && unlockPercentage_ <= _maxPercentage,
            "SimpleTimelock should be in range."
        );

        _token = token_;
        _releaseTime = releaseTime_;
        _unlockInterval = unlockInterval_;
        _unlockPercentage = unlockPercentage_;
        _lockedTokens = 0;
    }

    /**
     * @dev Returns the token being held.
     */
    function token() public view virtual returns (IERC20) {
        return _token;
    }

    /**
     * @dev Returns the time when the tokens are released in seconds since Unix epoch (i.e. Unix timestamp).
     */
    function releaseTime() public view virtual returns (uint256) {
        return _releaseTime;
    }

    /**
     * @dev Returns
     */
    function unlockInterval() public view virtual returns (uint256) {
        return _unlockInterval;
    }

    /**
     * @dev Returns
     */
    function unlockPercentage() public view virtual returns (uint256) {
        return _unlockPercentage;
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
    function beneficiaryRecord(address beneficiaryAddress_) public view virtual returns (BeneficiaryRecord memory) {
        BeneficiaryRecord memory result = _beneficiaries[beneficiaryAddress_];
        return result;
    }
    

    function setBeneficiary(address beneficiaryAddress_, uint256 tokenAmount_) public virtual {
        BeneficiaryRecord memory record = _beneficiaries[beneficiaryAddress_];
        require(
            record.lastUnlockTime == 0,
            "SimpleTimelock: you can't set the same address more than once!"
        );

        uint256 amount = token().balanceOf(address(this));

        _lockedTokens += tokenAmount_;

        require(_lockedTokens <= amount, "SimpleTimelock: you can't lock more tokens than you have." );
        console.log("Beneficiary set '%s' to '%s' ('%s' with release time)", beneficiaryAddress_, tokenAmount_, _releaseTime);
        _beneficiaries[beneficiaryAddress_] = BeneficiaryRecord(
            _releaseTime,
            tokenAmount_
        );
    }

    /**
     * @dev Transfers tokens held by the timelock to the beneficiary. Will only succeed if invoked after the release
     * time.
     */
    function release() public virtual {
        require(
            block.timestamp >= releaseTime(),
            "SimpleTimelock: current time is before release time"
        );

        uint256 amount = token().balanceOf(address(this));
        require(amount > 0, "SimpleTimelock: no tokens to release");

        BeneficiaryRecord memory record = _beneficiaries[msg.sender];

        require(
            record.lastUnlockTime != 0,
            "SimpleTimelock: BeneficiaryRecord does not exist for caller."
        );
        require(
            record.tokenAmount > 0,
            "SimpleTimelock: BeneficiaryRecord amount should be grater than 0."
        );

        uint256 curTime = block.timestamp;
        require(
            curTime > record.lastUnlockTime,
            "SimpleTimelock: cur time should be greater than lastUnlockTime"
        );

        uint256 unlockTimes = (curTime - record.lastUnlockTime).div(
            _unlockInterval
        );

        require(unlockTimes > 0, "SimpleTimelock: unlockTimes should be greater than 0");

        uint256 unlockedAmount = record.tokenAmount
            .mul(_unlockPercentage)
            .mul(unlockTimes)
            .div(_maxPercentage);

        require(unlockedAmount > 0, "SimpleTimelock: unlockedAmount should be greater than 0");

        if (unlockedAmount > record.tokenAmount) {
            unlockedAmount = record.tokenAmount;
        }

        token().safeTransfer(msg.sender, unlockedAmount);

        console.log("curTime '%s'", curTime);
        console.log("unlockTimes '%s'", unlockTimes);
        console.log("unlockedAmount '%s'", unlockedAmount);

        record.lastUnlockTime = curTime;
        record.tokenAmount -= unlockedAmount;

        _beneficiaries[msg.sender] = record;
    }
}
