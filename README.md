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
  
  Query struct and array, mapping values
  ```
  #Mapping 
  const userInfo = await stakingContract.userInfo(owner.address);
  expect(userInfo[0]).to.equal(parseEther("3000"));
  expect(userInfo[2].toString()).to.equal("true");
  ```
  ```
  #Array
  const stbCoinListAfter = await PresaleContract.stableCoinLists.call()
  expect(stbCoinListAfter).to.be.an('array').that.does.not.include(USDT);
  ```
  Bypass Timestamp
  ```
  // suppose the current block has a timestamp of 01:00 PM
  await network.provider.send("evm_increaseTime", [3600])
  await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp
  ```
  
  ```
  evm_setNextBlockTimestamp
  await network.provider.send("evm_setNextBlockTimestamp", [1625097600])
  await network.provider.send("evm_mine") // this one will have 2021-07-01 12:00 AM as its timestamp, no matter what the previous block has
  ```
