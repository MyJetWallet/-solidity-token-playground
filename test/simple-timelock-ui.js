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

    token = await SimplToken.deploy("ChildSimplToken", "SMPLT", signer.address);
    await token.deployed()
    var date = Math.floor(new Date().getTime() / 1000);
    await timeMachine.advanceBlockAndSetTime(date);
  });

  it("Deploy everythin to test ui", async function () {
    var releaseTime = await GetLastBlockTimeStamp() + 120; // 10 min from now
    const unlockTimeIntervalSec = 60; // 1 min
    const onePercent = 1000 //1%
    const beneficiaryAddress = '0x83ceAC6A4b7060348d8Ebf4996817962Db7e3758';

    await bank.sendTransaction({
      to: beneficiaryAddress,
      value: ethers.utils.parseEther("0.01"), // Sends exactly 1.0 ether
    });

    const timelock = await SimpleTimelock.deploy(token.address, releaseTime, unlockTimeIntervalSec, onePercent);
    await timelock.deployed();

    await DepositFullAmount(timelock);

    var setBenTx = await timelock.setBeneficiary(beneficiaryAddress, ethVal);

    await setBenTx.wait();

    console.log(token.address);
    console.log(timelock.address);

    //console.log(await timelock.expectedRelease(beneficiaryAddress));

  });
});

