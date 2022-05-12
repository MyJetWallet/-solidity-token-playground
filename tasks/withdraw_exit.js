const { task, types } = require('hardhat/config');
//const { hardhat } = require("hardhat");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const { POSClient, use } = require("@maticnetwork/maticjs");
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-web3');
const Web3 = require('web3');
const Wallet = require('ethereumjs-wallet').default;
const { BigNumber } = require('ethers');
// install web3 plugin
use(Web3ClientPlugin);

// Example: npx hardhat withdrawExit --burn-tx-hash 0x252f0fe145f5dfe80e1d22b6992220aac68774929910aaa7fdddb22bafdc2ed6 --root-network goerli --child-network maticMumbai --root-token-address 0x13e943BD367041c79e8842D3cDB0fe2bc7ba46Fc --child-token-address 0xa0f11783591ee3114a19cb0f4ce759ed9886c4c4
task('withdrawExit', 'withdraw exit')
    .addParam('burnTxHash', 'burnTxHash', '', types.string)
    .addParam('rootNetwork', 'Root network', '', types.string)
    .addParam('childNetwork', 'Child network', '', types.string)
    .addParam('rootTokenAddress', 'token address', '', types.string)
    .addParam('childTokenAddress', 'Child address', '', types.string)
    .setAction(async ({ burnTxHash, rootNetwork, childNetwork,
        rootTokenAddress, childTokenAddress }, { ethers }) => {
        console.log("Start approve!");
        const hardhatConfig = require("../hardhat.config");

        const posClient = new POSClient();

        const pk1 = hardhatConfig.networks[rootNetwork].accounts[0];
        const pk2 = hardhatConfig.networks[childNetwork].accounts[0];

        const buf1 = Buffer.from(pk1.slice(2, pk1.length), 'hex');
        const buf2 = Buffer.from(pk2.slice(2, pk2.length), 'hex');

        const fromAcc = Wallet.fromPrivateKey(buf1);
        const toAcc = Wallet.fromPrivateKey(buf2);

        const fromParent = fromAcc.getAddressString();
        const toChild = toAcc.getAddressString();

        // network: 'testnet' or 'mainnet'
        // version: <network version>, // 'mumbai' or 'v1'
        var network;
        var version;
        if (rootNetwork === "goerli") {
            network = 'testnet';
            version = 'mumbai';
        } else {
            network = 'mainnet';
            version = 'v1';
        }

        console.log(network);
        console.log(version);

        await posClient.init({
            network: network,
            version: version,
            parent: {
                provider: new HDWalletProvider(hardhatConfig.networks[rootNetwork].accounts[0], hardhatConfig.networks[rootNetwork].url),
                defaultConfig: {
                    from: fromParent
                }
            },
            child: {
                provider: new HDWalletProvider(hardhatConfig.networks[childNetwork].accounts[0], hardhatConfig.networks[childNetwork].url),
                defaultConfig: {
                    from: toChild
                }
            }
        });

        const erc20ChildToken = posClient.erc20(childTokenAddress, false);
        const erc20ParentToken = posClient.erc20(rootTokenAddress, true);

        const result = await erc20ParentToken.withdrawExit(burnTxHash);

        const txHash = await result.getTransactionHash();

        console.log("Withdrawal hash: " + txHash);
        console.log("Wait for receipt!");
        const txReceipt = await result.getReceipt();
        console.log("Receipt acquired!");
    });

module.exports = {};