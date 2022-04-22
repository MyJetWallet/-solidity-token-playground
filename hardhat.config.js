require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

//GANACHE
module.exports = {
  defaultNetwork: "matic",
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545",
      accounts: ['d878a21985558e7ecb7974b6b3c3add3c97eef6ca8c5ff81201e293075b1f961', 
      '541390f6845da0b6cb1adc22610a243d079bcd9099adee61eb0963fa8980ba21']
    },
    matic: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.POLYGON_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  },
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
}