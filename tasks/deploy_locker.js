const { task, types } = require('hardhat/config');
const { use } = require("@maticnetwork/maticjs");
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-web3');
const { BigNumber } = require('ethers');

require("@nomiclabs/hardhat-web3");
// install web3 plugin
use(Web3ClientPlugin);

// Task for getting all donater addresses
// Example: npx hardhat deployLocker --network maticMumbai --token-address 0xA0F11783591ee3114A19cb0F4Ce759ed9886c4C4 --owner-address 0x83ceAC6A4b7060348d8Ebf4996817962Db7e3758
// npx hardhat verify --network maticMumbai 0x17D87a9B6b8ec5df93fE4229dA8f727411e9F5ea 0xA0F11783591ee3114A19cb0F4Ce759ed9886c4C4 0x83ceAC6A4b7060348d8Ebf4996817962Db7e3758
task('deployLocker', 'deploy timelocker')
    .addParam("tokenAddress", 'Child erc20 contract address', '', types.string)
    .addParam("ownerAddress", 'Owner address', '', types.string)
    .setAction(async ({tokenAddress, ownerAddress},{ ethers }) => {
        const [signer] = await ethers.getSigners();
        const SimpleTimelock = await ethers.getContractFactory("SimpleTimelock");
        const timelock = await SimpleTimelock.deploy(tokenAddress, ownerAddress);

        console.log("Contract deployed!");
        console.log(timelock.address);
    });

module.exports = {};