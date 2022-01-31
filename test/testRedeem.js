const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = require("hardhat");
const PRXYABI = require("./PRXY-ABI.json");
const USDCABI = require("./USDC-ABI.json");
const TREASURYABI = require("./Treasury-ABI.json");


describe("Token contract", function (accounts) {
    let prxyContract;
    const PrxyERC20Token = "0xab3D689C22a2Bb821f50A4Ff0F21A7980dCB8591";
    //let token;

    let usdcContract;
    const USDC = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
    //let USDC_contract;

    let treasury;
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
    let signer;
    let provider;
    
    const zeroAddress = '0x0000000000000000000000000000000000000000';

    // Large number for approval for DAI
    const largeApproval = "100000000000000000000000000000000";

    // Initial mint for Frax and DAI (10,000,000)
    const initialMint = "1000000000000000000000000000000";

    // DAI bond BCV
    const ohmBondBCV = 500;

    // Bond vesting length in blocks. 33110 ~ 5 days
    const bondVestingLength = 60;

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
        
        [owner, account2, account3] = await ethers.getSigners();

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x0a4e2501683b752afc05ce8ddfd4b6baddbe5f0c"],
        });
        prxyOwner = await ethers.getSigner("0x0a4e2501683b752afc05ce8ddfd4b6baddbe5f0c");

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xd1f4ec7ff772bc382c2345cc4f57dc4bf13685a9"],
        });
        prxyHolder = await ethers.getSigner("0xd1f4ec7ff772bc382c2345cc4f57dc4bf13685a9");
        
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0xbecaa4ad36e5d134fd6979cc6780eb48ac5b5a93"],
        });
        
        usdcHolder = await ethers.getSigner("0xbecaa4ad36e5d134fd6979cc6780eb48ac5b5a93");

        prxyContract = new ethers.Contract(PrxyERC20Token, PRXYABI, prxyHolder)
        usdcContract = new ethers.Contract(USDC, USDCABI, usdcHolder)

        treasury_contract = await ethers.getContractFactory("PRXYTreasury");
        treasury = await treasury_contract.deploy(PrxyERC20Token, USDC, 0);

        PRXYUSDCBond_contract = await ethers.getContractFactory("PRXYUSDCBond");
        PRXYUSDCBond = await PRXYUSDCBond_contract.deploy(PrxyERC20Token,USDC,treasury.address,account2.address,"0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff");

        sPRXY_contract = await ethers.getContractFactory("sPRXY");
        sPRXY = await sPRXY_contract.deploy();

        PRXYStaking_contract = await ethers.getContractFactory("PRXYStaking");
        PRXYStaking = await PRXYStaking_contract.deploy(PrxyERC20Token,sPRXY.address,600,5,1643204369);

        StakingHelper_contract = await ethers.getContractFactory("StakingHelper");
        StakingHelper = await StakingHelper_contract.deploy(PRXYStaking.address,PrxyERC20Token);
        this.timeout(0);
    })

  
    describe("testing require checks for Deposit", function(){
        
        it("should revert if setRedeemStatus is disabled", async function(){
            await PRXYUSDCBond.setRedeemStatus(false);
            await expect(PRXYUSDCBond.redeem(account3.address, false)).to.be.revertedWith("Redeem is disabled");
        })
    })

    describe("testing Redeem function", function(){
        //

        it("testing Redeem", async function(){

            //Initial to run Deposit
            await prxyContract.connect(prxyOwner).addToWhitelist(treasury.address);
            await PRXYUSDCBond.initializeBondTerms(bondVestingLength, 50, maxBondPayout, bondFee, maxBondDebt, intialBondDebt);

            await usdcContract.connect(usdcHolder).approve(PRXYUSDCBond.address, "10000000");
            const allowance2 = await usdcContract.allowance(usdcHolder.address,PRXYUSDCBond.address);
            console.log("allowance b/w caller and bond",Number(allowance2));
            expect(allowance2).to.equal("10000000"); 

            await treasury.connect(owner).queue('0', PRXYUSDCBond.address);
            await treasury.connect(owner).toggle('0', PRXYUSDCBond.address, zeroAddress);
            
            //Call Deposit
            await PRXYUSDCBond.connect(usdcHolder).deposit("10000000",account3.address);
            //await new Promise(resolve => setTimeout(resolve, 10000)); // 3 sec

            const percentVested = await PRXYUSDCBond.percentVestedFor(account3.address);
            console.log("percentVested", Number(percentVested));
            
            //Call Redeem
            await expect(PRXYUSDCBond.connect(account2).redeem(account3.address, false));

        })
        
    })

});