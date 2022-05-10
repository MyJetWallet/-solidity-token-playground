const { task, types } = require('hardhat/config');
const { use } = require("@maticnetwork/maticjs");
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-web3');
const { BigNumber } = require('ethers');

require("@nomiclabs/hardhat-web3");
// install web3 plugin
use(Web3ClientPlugin);

// Task for getting all donater addresses
// Example: npx hardhat deployRoot --network goerli --amount 1000000000000000000000
task('deployroot', 'deploy root erc20 token')
    .addParam('amount', 'Initial supply', '', types.string)
    .setAction(async ({amount}, { ethers }) => {
        const [signer] = await ethers.getSigners();
        const SimplToken = await ethers.getContractFactory("SimplToken");
        const ethVal = BigNumber.from(amount);
        const token = await SimplToken.deploy("SimplToken", "SMPLT", ethVal, signer.address);
        console.log("Token deployed!");
        console.log(token.address);
    });

module.exports = {};