const { task, types } = require('hardhat/config');
const { use } = require("@maticnetwork/maticjs");
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-web3');

require("@nomiclabs/hardhat-web3");
// install web3 plugin
use(Web3ClientPlugin);

// Task for getting all donater addresses
// Example: npx hardhat deploychild --network maticMumbai
// npx hardhat verify --network maticMumbai 0x13e943BD367041c79e8842D3cDB0fe2bc7ba46Fc "SimplToken" "SMPLT" 0xb5505a6d998549090530911180f38aC5130101c6
task('deploychild', 'deploy child erc20 token')
    .setAction(async ({},{ ethers }) => {
        const [signer] = await ethers.getSigners();

        const ChildSimplToken = await ethers.getContractFactory("ChildSimplToken");
        const childToken = await ChildSimplToken.deploy("SimplToken", "SMPLT", "0xb5505a6d998549090530911180f38aC5130101c6");

        console.log("Child Token deployed!");
        console.log(childToken.address);
    });

module.exports = {};