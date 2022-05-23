const { task, types } = require('hardhat/config');
const { use } = require("@maticnetwork/maticjs");
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-web3');
const { BigNumber } = require('ethers');

require("@nomiclabs/hardhat-web3");
// install web3 plugin
use(Web3ClientPlugin);
const timeMachine = require('ganache-time-traveler');

// Task for getting all donater addresses
// Example: npx hardhat deployLocker --network ganache --token-address 0x81077Aedbf00dd7E28D4127E27Db8Ea2B7b3E17D --release-time 1652879484 --unlock-interval 120 --unlock-percentage 1000
// npx hardhat verify --network maticMumbai 
task('timeMachine', 'advance time')
    .addParam("time", 'time', 0, types.int)
    .setAction(async ({ time }, { ethers }) => {
        var date = Math.floor(new Date().getTime() / 1000);
        await timeMachine.advanceBlockAndSetTime(date + time);
    });

module.exports = {};