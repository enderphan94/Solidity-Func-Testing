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

  let sPRXY;
  let sPRXY_contract;

  let PRXYStaking;
  let PRXYStaking_contract;

  let StakingHelper;
  let StakingHelper_contract;
  
  let owner;
  let account2;
  let account3;
  
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  // Large number for approval for DAI
  const largeApproval = "100000000000000000000000000000000";

  // Initial mint for Frax and DAI (10,000,000)
  const initialMint = "1000000000000000000000000000000";

  // DAI bond BCV
  const ohmBondBCV = 500;

  // Bond vesting length in blocks. 33110 ~ 5 days
  const bondVestingLength = 216000;

  // Min bond price
  const minBondPrice = 9140982;

  // Max bond payout
  const maxBondPayout = 500;

  // DAO fee for bond

  const bondFee = 10000;

  // Max debt bond can take on
  const maxBondDebt = "200000000000000000000000";

  // Initial Bond debt
  const intialBondDebt = 0;

  beforeEach(async function(){
    token = await ethers.getContractFactory("PrxyERC20Token");
    [owner, account2, account3] = await ethers.getSigners();
    PrxyERC20Token = await token.deploy();

    USDC_contract = await ethers.getContractFactory("USDC");
    USDC = await USDC_contract.deploy(0);

    Treasury_contract = await ethers.getContractFactory("PRXYTreasury");
    Treasury = await Treasury_contract.deploy(PrxyERC20Token.address, USDC.address, 0);

    PRXYUSDCBond_contract = await ethers.getContractFactory("PRXYUSDCBond");
    PRXYUSDCBond = await PRXYUSDCBond_contract.deploy(PrxyERC20Token.address,USDC.address,Treasury.address,account2.address,"0xD99D1c33F9fC3444f8101754aBC46c52416550D1");

    sPRXY_contract = await ethers.getContractFactory("sPRXY");
    sPRXY = await sPRXY_contract.deploy();

    PRXYStaking_contract = await ethers.getContractFactory("PRXYStaking");
    PRXYStaking = await PRXYStaking_contract.deploy(PrxyERC20Token.address,sPRXY.address,600,5,1643204369);

    StakingHelper_contract = await ethers.getContractFactory("StakingHelper");
    StakingHelper = await StakingHelper_contract.deploy(PRXYStaking.address,PrxyERC20Token.address);
  })



  describe("PrxyERC20Token", function(){
    it("Should deploy and return correct name", async function () {
      const name = await PrxyERC20Token.name();
      expect(name).to.equal("PRXY");
    });

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
  
  //sPRXY
  describe("sPRXY", function(){
    it("get name of sPRXY", async function(){
      const name = await sPRXY.name();
      expect(name).to.equal("Staked PRXY");
    })
  })
  //PRXYStaking
  describe("PRXYStaking", function(){
    it("get the manager address of PRXYStaking", async function(){
      const manager = await sPRXY.manager();
      expect(manager).to.equal(owner.address);
    })
  })
  //StakingHelper
  describe("StakingHelper", function(){
    it("should return correct PRXYStaking address", async function(){
      const prxy = await StakingHelper.PRXY();
      expect(prxy).to.equal(PrxyERC20Token.address);
    })
    it("should return correct Staking address", async function(){
      const staking = await StakingHelper.staking();
      expect(staking).to.equal(PRXYStaking.address);
    })
  })
  //PRXYUSDCBond
  describe("PRXYUSDCBond", function(){
    
    it("get the DAO address of PRXYUSDCBond", async function(){
      const acc2 = await PRXYUSDCBond.DAO();
      expect(acc2).to.equal(account2.address);
    })

    it("should call initializeBondTerms only by owner", async function(){
      await expect(PRXYUSDCBond.connect(account3).initializeBondTerms(bondVestingLength, 50, maxBondPayout, bondFee, maxBondDebt, intialBondDebt)).to.be.reverted;
      await PRXYUSDCBond.initializeBondTerms(bondVestingLength, 50, maxBondPayout, bondFee, maxBondDebt, intialBondDebt);
      //expect(await PRXYUSDCBond.terms()).to.have.deep.members([{vestingTerm: bondVestingLength}, {discountPercentage:50}, {maxPayout:maxBondPayout}, {fee:bondFee}, {maxDebt:maxBondDebt}]);
      
      //check bondVestingLength 
      const term = await PRXYUSDCBond.terms.call(0);
      expect(term[0].toNumber()).to.equal(bondVestingLength);

      //check maxBondPayout 
      expect(term[2].toNumber()).to.equal(maxBondPayout);
      
    })

    it("should call setBondTerms only by owner", async function(){
      await expect(PRXYUSDCBond.connect(account3).setBondTerms(0,10000)).to.be.reverted;
      await expect(PRXYUSDCBond.setBondTerms(0,10000));
      const terms =  await PRXYUSDCBond.terms();
      expect(terms.vestingTerm.toNumber()).to.equal(10000);
    })

    it("should revert if vestingTerm < 10000", async function(){
      await expect(PRXYUSDCBond.setBondTerms(0,9000)).to.be.reverted;
    })

    it("should revert if maxPayout >= 1000", async function(){
      await expect(PRXYUSDCBond.setBondTerms(1,2000)).to.be.reverted;
    })

    it("should revert if fee >= 10000", async function(){
      await expect(PRXYUSDCBond.setBondTerms(2,20000)).to.be.reverted;
    })

    it("should set maxDebt to any value", async function(){
      await expect(PRXYUSDCBond.setBondTerms(3,20000));
      const terms =  await PRXYUSDCBond.terms();
      expect(terms.maxDebt.toNumber()).to.equal(20000);
    })

    it("should revert if discountPercentage >= 99 ", async function(){
      await expect(PRXYUSDCBond.setBondTerms(4,100)).to.be.reverted;
    })
    
    it("should call setStaking() only by owner", async function(){
      await expect(PRXYUSDCBond.connect(account3).setStaking(StakingHelper.address, true)).to.be.reverted;
      await expect(PRXYUSDCBond.setStaking(StakingHelper.address,true));
      const stakeHelperAddress = await PRXYUSDCBond.stakingHelper();
      expect(stakeHelperAddress).to.equal(StakingHelper.address);
    })

    it("should call setDepositStatus() only by owner", async function(){
      await expect(PRXYUSDCBond.connect(account3).setDepositStatus(true)).to.be.reverted;
      await PRXYUSDCBond.setDepositStatus(true);
      expect(await PRXYUSDCBond.depositStatus()).to.equal(true);
    })

    it("should call setRedeemStatus() only by owner", async function(){
      await expect(PRXYUSDCBond.connect(account3).setRedeemStatus(true)).to.be.reverted;
      await PRXYUSDCBond.setRedeemStatus(true);
      expect(await PRXYUSDCBond.redeemStatus()).to.equal(true);
    })

    it("should call renounceManagement() only by owner", async function(){
      await expect(PRXYUSDCBond.connect(account3).renounceManagement()).to.be.reverted;
      await PRXYUSDCBond.renounceManagement();
      expect(await PRXYUSDCBond.policy()).to.equal(zeroAddress);
    })

    it("should call pushManagement() only by owner", async function(){
      await expect(PRXYUSDCBond.connect(account3).pushManagement(account3.address)).to.be.reverted;
      await PRXYUSDCBond.pushManagement(account3.address);
      await PRXYUSDCBond.connect(account3).pullManagement();
      expect(await PRXYUSDCBond.policy()).to.equal(account3.address);
    })

    it("should call recoverETH() only by owner", async function(){
      await expect(PRXYUSDCBond.connect(account3).recoverETH()).to.be.reverted;
      await expect(PRXYUSDCBond.recoverETH());
    })

    it("should call recoverExcessToken() only by owner", async function(){
      await expect(PRXYUSDCBond.connect(account3).recoverExcessToken(USDC.address, 10000)).to.be.reverted;
      await USDC.mint(PRXYUSDCBond.address, 10000);
      expect(await USDC.balanceOf(PRXYUSDCBond.address)).to.equal(10000);
      await PRXYUSDCBond.recoverExcessToken(USDC.address, 10000);
      expect(await USDC.balanceOf(PRXYUSDCBond.address)).to.equal(0);
      expect(await USDC.balanceOf(owner.address)).to.equal(10000);
    })

    it("should not pass the require check of recoverLostToken()", async function(){
      await expect(PRXYUSDCBond.connect(account3).recoverLostToken(PrxyERC20Token.address)).to.be.reverted;
      await expect(PRXYUSDCBond.connect(account3).recoverLostToken(USDC.address)).to.be.reverted;
    })

    
  })

});