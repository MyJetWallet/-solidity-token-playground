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
  var bank;
  var ethVal;
  var token;
  var onePercent;
  const unlockTimeIntervalSec = 10;

  async function GetLastBlockTimeStamp() {
    var latestBlockNumber = await web3.eth.getBlockNumber();
    var latestBlock = await web3.eth.getBlock(latestBlockNumber);

    return latestBlock.timestamp;
  }

  async function GetReleaseTime() {
    return await GetLastBlockTimeStamp() + unlockTimeIntervalSec;
  }

  async function DepositFullAmount(timelock) {
    var encodedAmount = web3.eth.abi.encodeParameter('uint256', ethVal);

    var txDeposit = await token.deposit(timelock.address, encodedAmount);
    await txDeposit.wait();
  }

  beforeEach(async function () {
    [signer, receiver, bank] = await ethers.getSigners();
    SimplToken = await ethers.getContractFactory("ChildSimplToken");
    SimpleTimelock = await ethers.getContractFactory("SimpleTimelock");
    ethVal = BigNumber.from("100000000000000000000");
    onePercent = ethVal.div(100);

    token = await SimplToken.deploy("ChildSimplToken", "SMPLT", signer.address);
    await token.deployed()

    var date = Math.floor(new Date().getTime() / 1000);
    await timeMachine.advanceBlockAndSetTime(date);
  });

  it("Should release only 1% of funds after one unlock interval ", async function () {
    var releaseTime = await GetReleaseTime();
    const timelock = await SimpleTimelock.deploy(token.address, signer.address);
    await timelock.deployed();

    await DepositFullAmount(timelock);

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal, releaseTime, unlockTimeIntervalSec, onePercent);

    await setBenTx.wait();

    var response = await timeMachine.advanceBlockAndSetTime(releaseTime);

    var releaseTx = await timelock.connect(receiver).release();

    await releaseTx.wait();

    const balanceOf = await token.balanceOf(receiver.address);

    const expectedGain = ethVal.div(100);
    
    expect(balanceOf.eq(expectedGain)).to.equal(true);

  });

  it("Should release only 2% of funds after two unlock intervals", async function () {
    var releaseTime = await GetReleaseTime();
    const timelock = await SimpleTimelock.deploy(token.address, signer.address);
    await timelock.deployed();

    await DepositFullAmount(timelock);

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal, releaseTime, unlockTimeIntervalSec, onePercent);

    await setBenTx.wait();

    var response = await timeMachine.advanceBlockAndSetTime(releaseTime + unlockTimeIntervalSec);

    var releaseTx = await timelock.connect(receiver).release();

    await releaseTx.wait();

    const balanceOf = await token.balanceOf(receiver.address);

    const expectedGain = ethVal.div(50);
    
    expect(balanceOf.eq(expectedGain)).to.equal(true);

  });

  it("Should release 50% of funds after timelock interval is 50", async function () {
    var releaseTime = await GetReleaseTime();
    const timelock = await SimpleTimelock.deploy(token.address, signer.address); //1%
    await timelock.deployed();

    await DepositFullAmount(timelock);

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal, releaseTime, unlockTimeIntervalSec, onePercent);

    await setBenTx.wait();

    var response = await timeMachine.advanceBlockAndSetTime(releaseTime + 49 * unlockTimeIntervalSec);

    var releaseTx = await timelock.connect(receiver).release();

    await releaseTx.wait();

    const balanceOf = await token.balanceOf(receiver.address);

    const expectedGain = ethVal.div(2);
    expect(balanceOf.eq(expectedGain)).to.equal(true);

  });

  it("Should release 100% of funds after timelock interval is 100", async function () {
    var releaseTime = await GetReleaseTime();
    
    const timelock = await SimpleTimelock.deploy(token.address, signer.address); //1%
    await timelock.deployed();

    await DepositFullAmount(timelock);

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal, releaseTime, unlockTimeIntervalSec, onePercent);

    await setBenTx.wait();

    var response = await timeMachine.advanceBlockAndSetTime(releaseTime + 99 * unlockTimeIntervalSec);

    var releaseTx = await timelock.connect(receiver).release();

    await releaseTx.wait();

    const balanceOf = await token.balanceOf(receiver.address);

    const expectedGain = ethVal;
    
    expect(balanceOf.eq(expectedGain)).to.equal(true);

  });

  it("Should release 100% of funds after timelock interval is 100 for both beneficiaries", async function () {
    var releaseTime = await GetReleaseTime();
    
    const timelock = await SimpleTimelock.deploy(token.address, signer.address); //1%
    await timelock.deployed();

    await DepositFullAmount(timelock);

    var half = ethVal.div(2);

    var setBenTx = await timelock.setBeneficiary(receiver.address, half, releaseTime, unlockTimeIntervalSec, onePercent);

    await setBenTx.wait();

    var setBenTx = await timelock.setBeneficiary(bank.address, half, releaseTime, unlockTimeIntervalSec, onePercent);

    await setBenTx.wait();

    await timeMachine.advanceBlockAndSetTime(releaseTime + 99 * unlockTimeIntervalSec);

    var releaseTx = await timelock.connect(receiver).release();

    await releaseTx.wait();

    var releaseTx = await timelock.connect(bank).release();

    await releaseTx.wait();

    var balanceOf = await token.balanceOf(receiver.address);
  
    const expectedGain = half;
    
    expect(balanceOf.eq(expectedGain)).to.equal(true);

    var balanceOf = await token.balanceOf(bank.address);
    
    expect(balanceOf.eq(expectedGain)).to.equal(true);

  });

  it("Should not release the same interval tokens twice!", async function () {
    var releaseTime = await GetReleaseTime();
    const timelock = await SimpleTimelock.deploy(token.address, signer.address); //1%
    await timelock.deployed();

    await DepositFullAmount(timelock);

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal, releaseTime, unlockTimeIntervalSec, onePercent);

    await setBenTx.wait();

    var response = await timeMachine.advanceBlockAndSetTime(releaseTime);

    var releaseTx = await timelock.connect(receiver).release();

    await releaseTx.wait();

    var response = await timeMachine.advanceBlockAndSetTime(await GetLastBlockTimeStamp() + 1);

    await expect(
      timelock.connect(receiver).release()
    ).to.be.revertedWith("SimpleTimelock: unlockedAmount should be greater than 0");
  });

  it("Should not release tokens when there are no available!", async function () {
    var releaseTime = await GetReleaseTime();
    const timelock = await SimpleTimelock.deploy(token.address, signer.address); //1%
    await timelock.deployed();

    await DepositFullAmount(timelock);

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal, releaseTime, unlockTimeIntervalSec, onePercent);

    await setBenTx.wait();

    await timeMachine.advanceBlockAndSetTime(releaseTime + 100 * unlockTimeIntervalSec);

    var releaseTx = await timelock.connect(receiver).release();

    await releaseTx.wait();

    await timeMachine.advanceTime(1);

    await expect(
      timelock.connect(receiver).release()
    ).to.be.revertedWith("SimpleTimelock: BeneficiaryRecord amount should be grater than 0");
  });

  it("Should not set beneficiary if no tokens are available!", async function () {
    var releaseTime = await GetReleaseTime();
    const timelock = await SimpleTimelock.deploy(token.address, signer.address); //1%
    await timelock.deployed();

    await expect(
      timelock.setBeneficiary(receiver.address, ethVal, releaseTime, unlockTimeIntervalSec, onePercent)
    ).to.be.revertedWith("SimpleTimelock: you can't lock more tokens than you have.");
  });

  it("Should not register same address twice as beneficiary", async function () {
    var releaseTime = await GetReleaseTime();
    const timelock = await SimpleTimelock.deploy(token.address, signer.address); //1%
    await timelock.deployed();

    await DepositFullAmount(timelock);

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal, releaseTime, unlockTimeIntervalSec, onePercent);

    await setBenTx.wait();

    await expect(
      timelock.setBeneficiary(receiver.address, ethVal, releaseTime, unlockTimeIntervalSec, onePercent)
    ).to.be.revertedWith("SimpleTimelock: you can't set the same address more than once!");
  });

  it("Should not set beneficiary if sender is not the owner", async function () {
    var releaseTime = await GetReleaseTime();
    const timelock = await SimpleTimelock.deploy(token.address, signer.address); //1%
    await timelock.deployed();

    await DepositFullAmount(timelock);

    await expect(
      timelock.connect(receiver).setBeneficiary(receiver.address, ethVal, releaseTime, unlockTimeIntervalSec, onePercent)
    ).to.be.revertedWith("SimpleTimelock: only owner can set beneficiary!");
  });

  it("Should receive 0 as expectedRelease", async function () {
    var releaseTime = await GetReleaseTime();
    const timelock = await SimpleTimelock.deploy(token.address, signer.address); //1%
    await timelock.deployed();

    await DepositFullAmount(timelock);

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal, releaseTime, unlockTimeIntervalSec, onePercent);

    await setBenTx.wait();

    var expectedRelease = await timelock.expectedRelease(receiver.address);
    expect(expectedRelease.eq(BigNumber.from(0))).to.equal(true);
  });

  it("Should receive ethVal as expectedRelease", async function () {
    var releaseTime = await GetReleaseTime();
    const timelock = await SimpleTimelock.deploy(token.address, signer.address); //1%
    await timelock.deployed();

    await DepositFullAmount(timelock);

    var setBenTx = await timelock.setBeneficiary(receiver.address, ethVal, releaseTime, unlockTimeIntervalSec, onePercent);

    await setBenTx.wait();

    var response = await timeMachine.advanceBlockAndSetTime(releaseTime + 99 * unlockTimeIntervalSec);

    var expectedRelease = await timelock.expectedRelease(receiver.address);
    expect(expectedRelease.eq(ethVal)).to.equal(true);
  });

  it("Should set new owner, and new owner can set new beneficiaries", async function () {
    var releaseTime = await GetReleaseTime();
    const timelock = await SimpleTimelock.deploy(token.address, signer.address); //1%
    await timelock.deployed();

    await DepositFullAmount(timelock);

    var set = await timelock.setNewOwner(receiver.address);

    await set.wait();

    var setBenTx = await timelock.connect(receiver).setBeneficiary(receiver.address, ethVal, releaseTime, unlockTimeIntervalSec, onePercent);

    await setBenTx.wait();

    var response = await timeMachine.advanceBlockAndSetTime(releaseTime + 99 * unlockTimeIntervalSec);

    var expectedRelease = await timelock.expectedRelease(receiver.address);
    expect(expectedRelease.eq(ethVal)).to.equal(true);
  });

  it("Should not set new owner from not owner's address", async function () {
    const timelock = await SimpleTimelock.deploy(token.address, signer.address); //1%
    await timelock.deployed();

    await expect(
      timelock.connect(receiver).setNewOwner(receiver.address)
    ).to.be.revertedWith("SimpleTimelock: only owner can set new owner.");
  });
});

