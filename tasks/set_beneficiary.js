const { task, types } = require('hardhat/config');
const { use } = require("@maticnetwork/maticjs");
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-web3');
const { BigNumber } = require('ethers');

require("@nomiclabs/hardhat-web3");
// install web3 plugin
use(Web3ClientPlugin);

// Task for getting all donater addresses
// Example: npx hardhat setBeneficiary --network maticMumbai --timelock-address 0xffc3C419E4E63D2266e77Fe63A7A17FCCCDF8407 
// --token-amount 1000000000000000000 --user-address 0x83ceAC6A4b7060348d8Ebf4996817962Db7e3758 --release-time 1652963993 --unlock-interval 600 --unlock-amount 10000000000000000
task('setBeneficiary', 'Set beneficiary')
    .addParam("timelockAddress", 'TimeLock address', '', types.string)
    .addParam("tokenAmount", 'Token amount', '', types.string)
    .addParam("userAddress", 'User Address', '', types.string)
    .addParam("releaseTime", 'Release time in unix timestamp seconds', '', types.string)
    .addParam("unlockInterval", 'Unlock interval time in unix timestamp seconds', '', types.string)
    .addParam("unlockAmount", 'Amount of locked funds that are unlocked after each interval', '', types.string)
    .setAction(async ({ timelockAddress, tokenAmount, userAddress,
        releaseTime, unlockInterval, unlockAmount }, { ethers }) => {
        const [signer] = await ethers.getSigners();
        const ta = BigNumber.from(tokenAmount);
        const rt = BigNumber.from(releaseTime);
        const ui = BigNumber.from(unlockInterval);
        const ua = BigNumber.from(unlockAmount);
        const SimpleTimelock = await ethers.getContractFactory("SimpleTimelock");
        const timelock = await SimpleTimelock.attach(timelockAddress);
        var tx = await timelock.setBeneficiary(userAddress, ta, rt, ui, ua);
        console.log("Beneficiary set transaction is broadcasted!");
        console.log(tx);
    });

module.exports = {};