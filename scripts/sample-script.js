const { ethers } = require("hardhat");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const { POSClient, use } = require("@maticnetwork/maticjs");
const { Web3ClientPlugin } = require('@maticnetwork/maticjs-web3');
const hardhatConfig = require("../hardhat.config");
const Web3 = require('web3');
// install web3 plugin
use(Web3ClientPlugin);

const rootTokenAddress = "0x3ef35357f0b024070c5eab6ca1ba754461007b04";
const childTokenAddress = "0x3Ef35357F0B024070C5eAb6cA1Ba754461007B04";

async function main() {
  const [signer] = await ethers.getSigners();
  const posClient = new POSClient();
  const fromParent = Web3.eth.accounts.privateKeyToAccount(hardhatConfig.networks.goerli.accounts[0]);
  const toParent = Web3.eth.accounts.privateKeyToAccount(hardhatConfig.networks.goerli.accounts[0]);

  await posClient.init({
    network: 'testnet',
    version: 'mumbai',
    parent: {
      provider: new HDWalletProvider(hardhatConfig.networks.goerli.accounts[0], hardhatConfig.networks.goerli.url),
      defaultConfig: {
        from: fromParent.address
      }
    },
    child: {
      provider: new HDWalletProvider(hardhatConfig.networks.maticMumbai.accounts[0], hardhatConfig.networks.maticMumbai.url),
      defaultConfig: {
        from: toParent.address
      }
    }
  });

  const erc20ChildToken = posClient.erc20(childTokenAddress);
  const erc20ParentToken = posClient.erc20(rootTokenAddress, true);

  //Approve
  {
    // approve amount 10 on parent token
    const approveResult = await erc20ParentToken.approve(10);

    // get transaction hash
    const txHash = await approveResult.getTransactionHash();
    console.log("Approve hash: " + txHash);
    // get transaction receipt
    const txReceipt = await approveResult.getReceipt();

    console.log("Approve receipt: " + txReceipt);
  }

  // Deposit
  {
    const result = await erc20ChildToken.deposit(100, signer.address);
    const txHash = await result.getTransactionHash();

    console.log("Deposit hash: " + txHash);
    const txReceipt = await result.getReceipt();

    console.log("Deposit receipt: " + txReceipt);
  }

  const withdrawalTxHash = "";
  //Withdrawal
  {
    const result = await erc20Token.withdrawStart(100);
    withdrawalTxHash = await result.getTransactionHash();
    console.log("Withdrawal hash: " + withdrawalTxHash);
    const txReceipt = await result.getReceipt();

    console.log("Withdrawal receipt: " + txReceipt);
  }

  //Exit
  {
    const result = await erc20Token.withdrawExit(withdrawalTxHash);
    const txHash = await result.getTransactionHash();
    console.log("Exit hash: " + withdrawalTxHash);
    const txReceipt = await result.getReceipt();

    console.log("Exit receipt: " + txReceipt);
  }

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
