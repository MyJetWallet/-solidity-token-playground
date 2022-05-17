const { task, types } = require('hardhat/config');
const { use } = require("@maticnetwork/maticjs");
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-web3');

require("@nomiclabs/hardhat-web3");
// install web3 plugin
use(Web3ClientPlugin);

// Task for getting all donater addresses
// Example: npx hardhat deployChild --network maticMumbai --child-manager 0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa
// mumbai 0xb5505a6d998549090530911180f38aC5130101c6
// mainnet 0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa
// npx hardhat verify --network maticMumbai 0x13e943BD367041c79e8842D3cDB0fe2bc7ba46Fc "SimplToken" "SMPLT" 0xb5505a6d998549090530911180f38aC5130101c6
task('deployChild', 'deploy child erc20 token')
    .addParam("childManager", 'ChildManager contract address', '', types.string)
    .setAction(async ({childManager},{ ethers }) => {
        const [signer] = await ethers.getSigners();

        const ChildSimplToken = await ethers.getContractFactory("ChildSimplToken");
        const childToken = await ChildSimplToken.deploy("SimplToken", "SMPLT", childManager);

        console.log("Child Token deployed!");
        console.log(childToken.address);
    });

module.exports = {};