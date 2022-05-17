const { task, types } = require('hardhat/config');
const { use } = require("@maticnetwork/maticjs");
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-web3');
const { BigNumber } = require('ethers');

require("@nomiclabs/hardhat-web3");
// install web3 plugin
use(Web3ClientPlugin);

// Task for getting all donater addresses
// Example: npx hardhat deployRoot --network goerli --amount 1000000000000000000000000
// npx hardhat verify --network goerli 0x13e943BD367041c79e8842D3cDB0fe2bc7ba46Fc "SimplToken" "SMPLT" 1000000000000000000000000 0xD8970629b60eDDE6766A4a8C74667307d7044eB2
// https://goerli.etherscan.io/address/0x13e943BD367041c79e8842D3cDB0fe2bc7ba46Fc#code
task('deployRoot', 'deploy root erc20 token')
    .addParam('amount', 'Initial supply', '', types.string)
    .setAction(async ({amount}, { ethers }) => {
        const [signer] = await ethers.getSigners();
        const SimplToken = await ethers.getContractFactory("SimplToken");
        const ethVal = BigNumber.from(amount);
        const token = await SimplToken.deploy("SimplToken", "SMPLT", ethVal, signer.address);
        console.log("Token deployed!");
        console.log(token.address);

        // does not work
        /* await ethers.ru("verify:verify", {
            address: token.address,
            constructorArguments: [
                "SimplToken", "SMPLT", ethVal, signer.address
            ],
          }); */
    });

module.exports = {};