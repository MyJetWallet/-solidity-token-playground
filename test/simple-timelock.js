const { assert, expect } = require("chai");
const { ethers, web3 } = require("hardhat");
const { BigNumber, Contract } = require('ethers');
const { use } = require("@maticnetwork/maticjs");
const { SignerWithAddress } = require('@nomiclabs/hardhat-ethers/dist/src/signer-with-address');
const { solidity } = require('ethereum-waffle');

//TODO: After test time is broken on ganache instance.
describe("Deploy token and timelock", function () {

  require("@nomiclabs/hardhat-web3");
  const { Web3ClientPlugin } = require('@maticnetwork/maticjs-web3');

  // install web3 plugin
  use(Web3ClientPlugin);
  const timeMachine = require('ganache-time-traveler');

  var SimplToken;
  var SimpleTimelock;
  var signer;
  var receiver;
  var ethVal;
  var token;

  async function GetLastBlockTimeStamp() {
    var latestBlockNumber = await web3.eth.getBlockNumber();
    var latestBlock = await web3.eth.getBlock(latestBlockNumber);

    return latestBlock.timestamp;
  }

  beforeEach(async function () {
    [signer, receiver] = await ethers.getSigners();
    SimplToken = await ethers.getContractFactory("ChildSimplToken");
    SimpleTimelock = await ethers.getContractFactory("SimpleTimelock");
    ethVal = BigNumber.from("100000000000000000000");

    token = await SimplToken.deploy("ChildSimplToken", "SMPLT", signer.address);
    await token.deployed()
    var date = Math.floor(new Date().getTime() / 1000);
    await timeMachine.advanceBlockAndSetTime(date);
  });

  it("Should release only 1% of funds after one unlock interval ", async function () {
    var releaseTime = await GetLastBlockTimeStamp() + 10;
    const unlockTimeIntervalSec = 10;
    const onePercent = 1000 //1%
    const timelock = await SimpleTimelock.deploy(token.address, releaseTime, unlockTimeIntervalSec, onePercent);
    await timelock.deployed();

    var encodedAmount = web3.eth.abi.encodeParameter('uint256', ethVal);

    var txDeposit = await token.deposit(timelock.address, encodedAmount);
    await txDeposit.wait();

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal);

    await setBenTx.wait();

    var response = await timeMachine.advanceBlockAndSetTime(releaseTime + unlockTimeIntervalSec);

    var releaseTx = await timelock.connect(receiver).release();

    await releaseTx.wait();

    const balanceOf = await token.balanceOf(receiver.address);

    const expectedGain = ethVal.div(100);
    
    expect(balanceOf.eq(expectedGain)).to.equal(true);

  });

  it("Should release 50% of funds after timelock interval is 50", async function () {
    var releaseTime = await GetLastBlockTimeStamp() + 10;
    const unlockTimeIntervalSec = 5;
    const timelock = await SimpleTimelock.deploy(token.address, releaseTime, unlockTimeIntervalSec, 1000); //1%
    await timelock.deployed();

    var encodedAmount = web3.eth.abi.encodeParameter('uint256', ethVal);

    var txDeposit = await token.deposit(timelock.address, encodedAmount);
    await txDeposit.wait();

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal);

    await setBenTx.wait();

    var response = await timeMachine.advanceBlockAndSetTime(releaseTime + 50 * unlockTimeIntervalSec);

    var releaseTx = await timelock.connect(receiver).release();

    await releaseTx.wait();

    const balanceOf = await token.balanceOf(receiver.address);

    const expectedGain = ethVal.div(2);
    expect(balanceOf.eq(expectedGain)).to.equal(true);

  });

  it("Should release 100% of funds after timelock interval is 100", async function () {
    var releaseTime = await GetLastBlockTimeStamp() + 10;
    const unlockTimeIntervalSec = 1;
    const timelock = await SimpleTimelock.deploy(token.address, releaseTime, unlockTimeIntervalSec, 1000); //1%
    await timelock.deployed();

    var encodedAmount = web3.eth.abi.encodeParameter('uint256', ethVal);

    var txDeposit = await token.deposit(timelock.address, encodedAmount);
    await txDeposit.wait();

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal);

    await setBenTx.wait();

    var response = await timeMachine.advanceBlockAndSetTime(releaseTime + 102 * unlockTimeIntervalSec);

    var releaseTx = await timelock.connect(receiver).release();

    await releaseTx.wait();

    const balanceOf = await token.balanceOf(receiver.address);

    const expectedGain = ethVal;
    
    expect(balanceOf.eq(expectedGain)).to.equal(true);

  });

  it("Should not release the same interval tokens twice!", async function () {
    var releaseTime = await GetLastBlockTimeStamp() + 10;
    const unlockTimeIntervalSec = 10;
    const timelock = await SimpleTimelock.deploy(token.address, releaseTime, unlockTimeIntervalSec, 1000); //1%
    await timelock.deployed();

    var encodedAmount = web3.eth.abi.encodeParameter('uint256', ethVal);

    var txDeposit = await token.deposit(timelock.address, encodedAmount);
    await txDeposit.wait();

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal);

    await setBenTx.wait();

    var response = await timeMachine.advanceBlockAndSetTime(releaseTime + 10 * unlockTimeIntervalSec);

    var releaseTx = await timelock.connect(receiver).release();

    await releaseTx.wait();

    await expect(
      timelock.connect(receiver).release()
    ).to.be.revertedWith("SimpleTimelock: unlockTimes should be greater than 0");
  });

  it("Should not release tokens when ther are no available!", async function () {
    var releaseTime = await GetLastBlockTimeStamp() + 10;
    const unlockTimeIntervalSec = 10;
    const timelock = await SimpleTimelock.deploy(token.address, releaseTime, unlockTimeIntervalSec, 1000); //1%
    await timelock.deployed();

    var encodedAmount = web3.eth.abi.encodeParameter('uint256', ethVal);

    var txDeposit = await token.deposit(timelock.address, encodedAmount);
    await txDeposit.wait();

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal);

    await setBenTx.wait();

    await timeMachine.advanceBlockAndSetTime(releaseTime + 100 * unlockTimeIntervalSec);

    var releaseTx = await timelock.connect(receiver).release();

    await releaseTx.wait();

    await timeMachine.advanceTime(1);

    await expect(
      timelock.connect(receiver).release()
    ).to.be.revertedWith("SimpleTimelock: no tokens to release");
  });

  it("Should not set beneficiary if no tokens are available!", async function () {
    var releaseTime = await GetLastBlockTimeStamp() + 10;
    const unlockTimeIntervalSec = 10;
    const timelock = await SimpleTimelock.deploy(token.address, releaseTime, unlockTimeIntervalSec, 1000); //1%
    await timelock.deployed();

    await expect(
      timelock.setBeneficiary(receiver.address, ethVal)
    ).to.be.revertedWith("SimpleTimelock: you can't lock more tokens than you have.");
  });

  it("Should not register same address twice as beneficiary", async function () {
    var releaseTime = await GetLastBlockTimeStamp() + 10;
    const unlockTimeIntervalSec = 1;
    const timelock = await SimpleTimelock.deploy(token.address, releaseTime, unlockTimeIntervalSec, 1000); //1%
    await timelock.deployed();

    var encodedAmount = web3.eth.abi.encodeParameter('uint256', ethVal);

    var txDeposit = await token.deposit(timelock.address, encodedAmount);
    await txDeposit.wait();

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal);

    await setBenTx.wait();

    await expect(
      timelock.setBeneficiary(receiver.address, ethVal)
    ).to.be.revertedWith("SimpleTimelock: you can't set the same address more than once!");
  });
});

