const { task, types } = require('hardhat/config');
//const { hardhat } = require("hardhat");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const { POSClient, use } = require("@maticnetwork/maticjs");
const WebSocket = require("ws");
const Web3 = require("web3");

const { Web3ClientPlugin } = require('@maticnetwork/maticjs-web3');
const web3 = new Web3();
const abiCoder = web3.eth.abi;
// install web3 plugin
use(Web3ClientPlugin);

// Example: npx hardhat track --amount 1000 --root-network goerli --child-network maticMumbai --root-token-address 0x13e943BD367041c79e8842D3cDB0fe2bc7ba46Fc --child-token-address 0xa0f11783591ee3114a19cb0f4ce759ed9886c4c4 --user-address 0xD8970629b60eDDE6766A4a8C74667307d7044eB2
task('track', 'track deposit')
    .addParam('amount', 'amount', '', types.string)
    .addParam('rootNetwork', 'Root network', '', types.string)
    .addParam('childNetwork', 'Child network', '', types.string)
    .addParam('rootTokenAddress', 'token address', '', types.string)
    .addParam('childTokenAddress', 'Child address', '', types.string)
    .addParam('userAddress', 'User address', '', types.string)
    .setAction(async ({ amount, rootNetwork, childNetwork, 
        rootTokenAddress, childTokenAddress, userAddress }, { ethers }) => {
        console.log("Start approve!");
        const hardhatConfig = require("../hardhat.config");
        var ws;
        // network: 'testnet' or 'mainnet'
        // version: <network version>, // 'mumbai' or 'v1'
        var network;
        var version;
        if (rootNetwork === "goerli") {
            network = 'testnet';
            version = 'mumbai';
            ws = new WebSocket("wss://ws-mumbai.matic.today/");
        } else {
            network = 'mainnet';
            version = 'v1';
            ws = new WebSocket("wss://ws-mainnet.matic.today/");
        }

        console.log(network);
        console.log(version);

        await checkDepositStatus(ws, userAddress, rootTokenAddress, amount, "0xb5505a6d998549090530911180f38aC5130101c6")
    });

    async function checkDepositStatus(
        ws,
        userAccount,
        rootToken,
        depositAmount,
        childChainManagerProxy
      ) {
        return new Promise((resolve, reject) => {
          ws.on("open", () => {
            ws.send(
              `{"id": 1, "method": "eth_subscribe", "params": ["newDeposits", {"Contract": "${childChainManagerProxy}"}]}`
            );
      
            ws.on("message", (msg) => {
              const parsedMsg = JSON.parse(msg);
              if (
                parsedMsg &&
                parsedMsg.params &&
                parsedMsg.params.result &&
                parsedMsg.params.result.Data
              ) {
                const fullData = parsedMsg.params.result.Data;
                const { 0: syncType, 1: syncData } = abiCoder.decodeParameters(
                  ["bytes32", "bytes"],
                  fullData
                );
      
                // check if sync is of deposit type (keccak256("DEPOSIT"))
                const depositType =
                  "0x87a7811f4bfedea3d341ad165680ae306b01aaeacc205d227629cf157dd9f821";
                if (syncType.toLowerCase() === depositType.toLowerCase()) {
                  const {
                    0: userAddress,
                    1: rootTokenAddress,
                    2: depositData,
                  } = abiCoder.decodeParameters(
                    ["address", "address", "bytes"],
                    syncData
                  );
      
                  // depositData can be further decoded to get amount, tokenId etc. based on token type
                  // For ERC20 tokens
                  const { 0: amount } = abiCoder.decodeParameters(
                    ["uint256"],
                    depositData
                  );
                  if (
                    userAddress.toLowerCase() === userAccount.toLowerCase() &&
                    rootToken.toLowerCase() === rootTokenAddress.toLowerCase() &&
                    depositAmount === amount
                  ) {
                    resolve(true);
                  }
                }
              }
            });
      
            ws.on("error", () => {
              reject(false);
            });
      
            ws.on("close", () => {
              reject(false);
            });
          });
        });
      }

module.exports = {};