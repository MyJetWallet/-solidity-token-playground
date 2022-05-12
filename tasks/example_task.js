const { task } = require('hardhat/config');
const { use } = require("@maticnetwork/maticjs");
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-web3');
// install web3 plugin
use(Web3ClientPlugin);

// Example: npx hardhat example
task('example', 'example')
    .setAction(async ({}, { ethers }) => {
        console.log("Start example!");
    });

module.exports = {};