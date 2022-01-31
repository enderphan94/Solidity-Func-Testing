const { expect } = require("chai");

describe("Token contract", function (accounts) {
  let PrxyERC20Token;
  let token;
  let USDC;
  let USDC_contract;
  let Treasury;
  let Treasury_contract;
  let PRXYUSDCBond;
  let PRXYUSDCBond_contract;
  
  let owner;
  let account2;
  let account3;
  
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  // Large number for approval for DAI
  const largeApproval = '100000000000000000000000000000000';

  // Initial mint for Frax and DAI (10,000,000)
  const initialMint = '10000000000000';

  // DAI bond BCV
  const ohmBondBCV = '500';

  // Bond vesting length in blocks. 33110 ~ 5 days
  const bondVestingLength = '216000';

  // Min bond price
  const minBondPrice = '9140982';

  // Max bond payout
  const maxBondPayout = '500'

  // DAO fee for bond

  const bondFee = '10000';

  // Max debt bond can take on
  const maxBondDebt = '200000000000000000000000';

  // Initial Bond debt
  const intialBondDebt = '0';

  beforeEach(async function(){
    token = await ethers.getContractFactory("PrxyERC20Token");
    [owner, account2, account3] = await ethers.getSigners();
    PrxyERC20Token = await token.deploy();

    USDC_contract = await ethers.getContractFactory("USDC");
    USDC = await USDC_contract.deploy(0);

    Treasury_contract = await ethers.getContractFactory("Treasury");
    Treasury = await Treasury_contract.deploy(PrxyERC20Token.address, USDC.address, 0);

    PRXYUSDCBond_contract = await ethers.getContractFactory("PRXYUSDCBond");
    PRXYUSDCBond = await PRXYUSDCBond_contract.deploy(PrxyERC20Token.address,USDC.address,Treasury.address,account2.address,"0xD99D1c33F9fC3444f8101754aBC46c52416550D1");
  })



  describe("PrxyERC20Token", function(){
    it("Should deploy and return correct name", async function () {
      const name = await PrxyERC20Token.name();
      expect(name).to.equal("PRXY");
    });

    it("should return owner", async function(){

      const ownerOf = await PrxyERC20Token.owner();
      expect(ownerOf).to.equal(owner.address);
      //console.log(owner.address);
    })

    it("set vault by owner", async function(){
      await PrxyERC20Token.setVault(owner.address);
      expect(await PrxyERC20Token.vault()).to.equal(owner.address);
    })
    
    it("should mint by owner & check balance", async function(){
      await PrxyERC20Token.setVault(owner.address);
      const balanceOfOwner = await PrxyERC20Token.mint(account2.address, 10000);
      expect(await PrxyERC20Token.balanceOf(account2.address)).to.equal(10000);
    })

    it("should failt if user does not have enough token", async function(){
      const initialBalance2 = await PrxyERC20Token.balanceOf(account2.address)

      await expect(PrxyERC20Token.connect(account2).transfer(account3.address,100000)).to.be.revertedWith("ERC20: transfer amount exceeds"); 
      expect(await PrxyERC20Token.balanceOf(account2.address)).to.equal(initialBalance2);
    })

    it("should approve and send the token", async function(){
      //set Vault and Mint
      await PrxyERC20Token.setVault(owner.address);
      const balanceOfOwner = await PrxyERC20Token.mint(account2.address, 10000);
      expect(await PrxyERC20Token.balanceOf(account2.address)).to.equal(10000);

      //test approval
      await PrxyERC20Token.connect(account2).approve(account3.address,5000);
      const allow = await PrxyERC20Token.allowance(account2.address, account3.address);
      expect(allow).to.equal(5000);

      await expect(PrxyERC20Token.connect(account3).transferFrom(account2.address,account3.address,10000)).to.be.revertedWith("ERC20: transfer amount exceeds allowance");

      expect(allow).to.equal(5000);

      await PrxyERC20Token.connect(account3).transferFrom(account2.address,account3.address,5000);

      expect(await PrxyERC20Token.balanceOf(account3.address)).to.equal(5000);
      expect(await PrxyERC20Token.balanceOf(account2.address)).to.equal(5000);
    })

  })

  //USDC
  describe("USDC", function(){

    it("get name of USDC contract", async function(){
      const name = await USDC.name();
      expect(name).to.equal("Usdc Stablecoin");
    })

  })

  //Treasury
  describe("Treasury", function(){

    it("get the manager of Treasury", async function(){
      const name = await Treasury.manager();
      expect(name).to.equal(owner.address);
    })

    it("get PRXY address", async function(){
      const name = await Treasury.PRXY();
      expect(name).to.equal(PrxyERC20Token.address);
    })
  })
  
  //PRXYUSDCBond
  describe("PRXYUSDCBond", function(){

    it("get the DAO of PRXYUSDCBond", async function(){
      const acc2 = await PRXYUSDCBond.DAO();
      expect(acc2).to.equal(account2.address);
    })

    it("should call initializeBondTerms by owner", async function(){
      await expect(PRXYUSDCBond.connect(account3).initializeBondTerms(bondVestingLength, 50, maxBondPayout, bondFee, maxBondDebt, intialBondDebt)).to.be.reverted;
      await PRXYUSDCBond.initializeBondTerms(bondVestingLength, 50, maxBondPayout, bondFee, maxBondDebt, intialBondDebt);
      //expect(await PRXYUSDCBond.terms()).to.have.deep.members([{vestingTerm: bondVestingLength}, {discountPercentage:50}, {maxPayout:maxBondPayout}, {fee:bondFee}, {maxDebt:maxBondDebt}]);
      expect(await PRXYUSDCBond.terms()).to.have.deep.members([bondVestingLength, 50, maxBondPayout, bondFee, maxBondDebt]);
    })
  })

});