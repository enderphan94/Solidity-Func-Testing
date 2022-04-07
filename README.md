# Solidity-Func-Testing
Sharing experience in Solidity Functional Testing

# Libraries

https://hardhat.org/tutorial/setting-up-the-environment.html

https://chaijs.com/

https://www.chaijs.com/api/bdd/

https://docs.ethers.io/v5/getting-started/

https://medium.com/building-ibotta/testing-arrays-and-objects-with-chai-js-4b372310fe6d

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
  const stbCoinListAfter = await PresaleContract.stableCoinLists()
  expect(stbCoinListAfter).to.be.an('array').that.does.not.include(USDT);
  expect(stbCoinListAfter).to.include.members([ethers.utils.getAddress(USDC.address)]);
  ```
  Bypass Timestamp
  ```
  // suppose the current block has a timestamp of 01:00 PM
  await network.provider.send("evm_increaseTime", [3600])
  await network.provider.send("evm_mine") // this one will have 02:00 PM as its timestamp
  ```
  getting timestamp
  ```
  const blockNumBefore = await ethers.provider.getBlockNumber();
  const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  const timestampBefore = blockBefore.timestamp;
  ```
  ```
  evm_setNextBlockTimestamp
  await network.provider.send("evm_setNextBlockTimestamp", [1625097600])
  await network.provider.send("evm_mine") // this one will have 2021-07-01 12:00 AM as its timestamp, no matter what the previous block has
  ```
  # Some mistakes
  
  Boolean value set in Hardhat in string type variable will result a wrong output in solidity.
 
  Eg:
  
  ```
  // False. This will return a wrong boolean value in solidity 
  farm.addPool(_allocPoint,_lockHours,_isLinearRelease, "false")
  ```
  
   ```
  // True. Set it without double qoutes
  farm.addPool(_allocPoint,_lockHours,_isLinearRelease, false)
  ```

  Similar with "expect"
  
  ```
  // true
  expect(pool[12]).to.equal(false)
  
  // false
  expect(pool[12]).to.equal("false")
  ```
