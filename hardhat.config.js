require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require('solidity-coverage')

// Tasks
require('./tasks');

module.exports = {
  defaultNetwork: "maticMumbai",
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545",
      accounts: ['d878a21985558e7ecb7974b6b3c3add3c97eef6ca8c5ff81201e293075b1f961', 
      '541390f6845da0b6cb1adc22610a243d079bcd9099adee61eb0963fa8980ba21']
    },
    maticMumbai: {
      url: "https://matic-mumbai.chainstacklabs.com",//https://polygon-mumbai.g.alchemy.com/v2/"+ process.env.ALCHEMY_MUMBAI_API_KEY,
      accounts: [process.env.POLYGON_PRIVATE_KEY],
      gasPrice: 35000000000,
      saveDeployments: true,
    },
    goerli: {
      url: "https://goerli.infura.io/v3/"+ process.env.INFURA_GOERLI_API_KEY,
      accounts: [process.env.POLYGON_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: {
      mainnet: "YOUR_ETHERSCAN_API_KEY",
      goerli: process.env.GOERLISCAN_API_KEY,
      // polygon
      polygon: "YOUR_POLYGONSCAN_API_KEY",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
  }
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