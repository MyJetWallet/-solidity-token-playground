const { assert, expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber, Contract } = require('ethers');
const { SignerWithAddress } = require('@nomiclabs/hardhat-ethers/dist/src/signer-with-address');
const { solidity } = require('ethereum-waffle');

describe("Deploy token and check balances", function () {
  it("Should deploy token with constructor args", async function () {
    const [signer, receiver] = await ethers.getSigners();
    const SimplToken = await ethers.getContractFactory("SimplToken");
    const ethVal = BigNumber.from("10000000");
    const transferVal = BigNumber.from("100");
    const token = await SimplToken.deploy("SimplToken", "SMPLT", ethVal, signer.address);
    
    await token.deployed();

    const name = await token.name();
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    const totalSupply = await token.totalSupply();
    const balanceOf = await token.balanceOf(signer.address);

    var transferTx = await token.transfer(receiver.address, transferVal);
    await transferTx.wait();

    const balanceAfterOf = await token.balanceOf(signer.address);
    const receivingBalance = await token.balanceOf(receiver.address);

    // wait until the transaction is mined
    //await setGreetingTx.wait();
    expect(name).to.equal("SimplToken");
    expect(symbol).to.equal("SMPLT");
    expect(decimals).to.equal(18);

    expect(balanceOf.eq(ethVal)).to.equal(true);
    expect(totalSupply.eq(ethVal)).to.equal(true);

    expect(balanceAfterOf.eq(ethVal.sub(transferVal))).to.equal(true);
    expect(receivingBalance.eq(transferVal)).to.equal(true);
  });
});

