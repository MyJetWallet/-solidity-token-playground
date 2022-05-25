# Basic Sample Hardhat Project

ENV variables:

```
POLYGON_PRIVATE_KEY - private key for deployer on both networks
INFURA_API_KEY - infura api key for both goerli and mainnet
ALCHEMY_POLYGON_API_KEY - alchemy polygon api key
ALCHEMY_MUMBAI_API_KEY - alchemy mumbai api key
ETHERSCAN_API_KEY - etherscan api key
POLYGONSCAN_API_KEY - polygon scan api key
```

Try running some of the following tasks:

```shell
npm install

// Deploy child erc20 contract (maticMumbai)
npx hardhat deployChild --network maticMumbai --child-manager {childManagerAddress}

npx hardhat verify --network maticMumbai {contractAddress} "SimplToken" "SMPLT" {childManagerAddress}

npx hardhat deployRoot --network goerli --amount 1000000000000000000000000

npx hardhat verify --network goerli {contractAddress} "SimplToken" "SMPLT" 1000000000000000000000000 {deployerAddress}

npx hardhat approve --amount 1000 --root-network goerli --child-network maticMumbai --root-token-address {rootTokenAddress} --child-token-address {childTokenAddress}

npx hardhat deposit --amount 1000 --root-network goerli --child-network maticMumbai --root-token-address {rootTokenAddress} --child-token-address {childTokenAddress} --user-address {userAddress}

npx hardhat withdraw --amount 50 --root-network goerli --child-network maticMumbai --root-token-address {rootTokenAddress} --child-token-address {childTokenAddress}

npx hardhat withdrawExit --burn-tx-hash {withdrawTxHashOnPolygon} --root-network goerli --child-network maticMumbai --root-token-address {rootTokenAddress} --child-token-address {childTokenAddress}

```

Examples: TODO

https://goerli.etherscan.io/token/0x13e943bd367041c79e8842d3cdb0fe2bc7ba46fc
https://mumbai.polygonscan.com/address/0xa0f11783591ee3114a19cb0f4ce759ed9886c4c4

endpoint to get last synced polygon block in ethereum