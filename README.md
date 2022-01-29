# Solidity-Func-Testing
Sharing experience in Solidity Functional Testing

# Libraries

https://hardhat.org/tutorial/setting-up-the-environment.html

https://chaijs.com/

https://docs.ethers.io/v5/getting-started/

## Environment Setup

`npm init --yes`

`npm install --save-dev hardhat`

`npx hardhat` (or create hardhat.config.js manually)

`npx hardhat compile`

`npx hardhat test <file>` ( --network <choose your network>)

## Hardhat.config

1. Better to use fork inside the hardhat.config.js, using ganache might cause some troubles with hardhat objects (eg: the use of impersonate function, etc)
```
require("@nomiclabs/hardhat-waffle");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.5",
  
  //defaultNetwork: "forking",
  
  networks: {
    hardhat: {
      forking: {
        url: "https://polygon-mainnet.g.alchemy.com/v2/fM9kmWwiwB2icRiq_8ObacssjfQKvaiY",
        blockNumber: 23942000,
      }
    }
  },

};

```
2. Specify the blockNumber helps to accelerate the query
  
## Useful functions

* Import a live contract & Impersonate a live account
  
  Impersonate
  ```
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0xbecaa4ad36e5d134fd6979cc6780eb48ac5b5a93"],
  });
  
  usdcHolder = await ethers.getSigner("0xbecaa4ad36e5d134fd6979cc6780eb48ac5b5a93");
  
  //check for balance
  const provider = new ethers.providers.JsonRpcProvider();
  const balance = await provider.getBalance(usdcHolder.address);
  console.log(balance);
  ```
  
  Import live contracts
  ```
  const USDCABI = require("./USDC-ABI.json"); // import its ABI
  let usdcContract;
  const USDC = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
  usdcContract = new ethers.Contract(USDC, USDCABI, usdcHolder)
  ```
  
  
