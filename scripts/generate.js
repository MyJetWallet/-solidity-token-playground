const Web3 = require('web3')

//const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/"));
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));

async function createAccount(){
    
    var wallet = await web3.eth.accounts.create();
    console.log('Address:' + wallet.address);
    console.log('Private Key: ' + wallet.privateKey)
}

async function GetLastBlockTimeStamp() {
    var latestBlockNumber = await web3.eth.getBlockNumber();
    var latestBlock = await web3.eth.getBlock(latestBlockNumber);

    console.log(latestBlock.timestamp);
  }

GetLastBlockTimeStamp();
//createAccount();