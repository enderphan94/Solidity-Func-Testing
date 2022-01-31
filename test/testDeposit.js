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
    })

  
    describe("testing require checks for Deposit", function(){
        
        it("should revert if Deposit is disabled", async function(){
            await PRXYUSDCBond.setDepositStatus(false);
            await expect(PRXYUSDCBond.deposit(100,account2.address)).to.be.revertedWith("Deposit is disabled");
        })
        it("should revert if _depositor is zero address", async function(){
            await expect(PRXYUSDCBond.deposit(100,zeroAddress)).to.be.revertedWith("Invalid address");
        })

        it("should call recoverExcessToken only by owner", async function(){
            await expect(PRXYUSDCBond.connect(account3).recoverExcessToken(USDC, 10000)).to.be.reverted;
        })
    })

    describe("testing Deposit function", function(){
        it("testing deposit", async function(){
            //const value = "10000000000000000000";
            const value = await treasury.valueOfToken(USDC,"10000000");
            console.log("Value of Token",Number(value));

            //Check for balance before Deposit
            const balanceOfBefore = await prxyContract.balanceOf(PRXYUSDCBond.address);
            console.log("PRXY balance of Bond Before Deposit",Number(balanceOfBefore));
            expect(balanceOfBefore).to.equal("0");

            const totalDebtBefore = await PRXYUSDCBond.totalDebt()
            console.log("total debt before deposit", Number(totalDebtBefore));
            expect(totalDebtBefore).to.equal("0");

            const balanceInUSDTHolderBefore = await usdcContract.balanceOf(usdcHolder.address);

            const balanceOfDAOBefore = await prxyContract.balanceOf(account2.address);
            console.log("PRXY balance of DAO before Deposit", Number(balanceOfDAOBefore));
            expect(balanceOfDAOBefore).to.equal("0");

            const balanceOfTreasyInUSDCBefore = await usdcContract.balanceOf(treasury.address);
            console.log("balance of Treasury in USDC", Number(balanceOfTreasyInUSDCBefore));

            //call initializeBondTerms
            await PRXYUSDCBond.initializeBondTerms(bondVestingLength, 50, maxBondPayout, bondFee, maxBondDebt, intialBondDebt);
            const term = await PRXYUSDCBond.terms.call(0);

            // add bond to whitelist of PRXY
            await prxyContract.connect(prxyOwner).addToWhitelist(treasury.address);
            let bondPrice = await PRXYUSDCBond.bondPrice();
            const assetPrice = await PRXYUSDCBond.assetPrice();
            let bondPriceInUSD = await PRXYUSDCBond.bondPriceInUSD();
            const maxBondPrice = await PRXYUSDCBond.maxPayout();

            await treasury.connect(owner).queue('0', PRXYUSDCBond.address);
            await treasury.connect(owner).toggle('0', PRXYUSDCBond.address, zeroAddress);

            console.log('=============== INITIAL PRICE =======================')
            console.log('BOND PRICE IN USD   ', Number(bondPriceInUSD.toString())/Math.pow(10,18))
            console.log('maxBondPrice', Number(maxBondPrice));
            console.log('bondPrice', Number(bondPrice));
            console.log('assetPrice', Number(assetPrice));
            console.log('=====================================================')

            // Check for allowance b/w caller and bond
            await usdcContract.connect(usdcHolder).approve(PRXYUSDCBond.address, "10000000");
            const allowance = await usdcContract.allowance(usdcHolder.address,PRXYUSDCBond.address);
            console.log("allowance b/w caller and bond",Number(allowance));
            expect(allowance).to.equal("10000000");      

            // Check for payOut value
            const payoutFor = await PRXYUSDCBond.payoutFor(value);
            console.log("payoutFor",Number(payoutFor));
            expect(Number(payoutFor)).to.greaterThanOrEqual(10000000000000000);

            // fees calculation
            const termFee = term[3].toNumber();
            const fee = Number(termFee/10000*Number(payoutFor));
            console.log("fee", Number(fee)/Math.pow(10,18));
            const profit = Number(value) - Number(payoutFor) - Number(fee);
            console.log("profit", Number(profit)/Math.pow(10,18));
            const send = Number(value) - Number(profit);
            console.log("send",Number(send)/Math.pow(10,18));
            
            // Deposit is called
            await PRXYUSDCBond.connect(usdcHolder).deposit("10000000",account3.address);

            /////////AFTER DEPOSIT

            // Check for balance of PRXYUSDCBond after Deposit
            const balanceOfBondAfter = await prxyContract.balanceOf(PRXYUSDCBond.address);
            console.log("PRXY balance of Bond after Deposit", Number(balanceOfBondAfter));
            expect(Math.round(Number(balanceOfBondAfter)/Math.pow(10,18))).to.equal(Math.round((Number(send)-Number(fee))/Math.pow(10,18)));

            //Check balance Of Treasury after Deposit
            const balanceOfTreasyInUSDC = await usdcContract.balanceOf(treasury.address);
            console.log("balance of Treasury in USDC", Number(balanceOfTreasyInUSDC));
            expect(balanceOfTreasyInUSDC).to.equal("10000000");

            //Check balance of DAO after Deposit
            const balanceOfDAOAfter = await prxyContract.balanceOf(account2.address);
            console.log("PRXY balance of DAO after Deposit", Number(balanceOfDAOAfter));
            expect(Number(balanceOfDAOAfter)).to.equal(fee);

            //Check Balance of Caller after Deposit
            const balanceInUSDTHolderAfter = await usdcContract.balanceOf(usdcHolder.address);
            console.log("balance of holder in USDC", Number(balanceInUSDTHolderAfter));
            expect(balanceInUSDTHolderAfter).to.equal(Number(balanceInUSDTHolderBefore) - Number("10000000"));

            //Check totalDebt after Deposit
            const totalDebtAfter = await PRXYUSDCBond.totalDebt()
            console.log("total debt after deposit", Number(totalDebtAfter));
            expect(Number(totalDebtAfter)).to.equal(Number(totalDebtBefore)+10000000000000000000);
            
            //Check for bondInfo of the depositor
            const bondInfo = await PRXYUSDCBond.bondInfo(account3.address);
            console.log("pricePaid",bondInfo[3].toNumber());
            expect(Number(bondInfo[3])).to.equal(bondPriceInUSD);

            console.log("vesting",bondInfo[1].toNumber());
            expect(Number(bondInfo[1])).to.equal(term[0]);

            console.log("payout",Number(bondInfo[0]));
            expect(Number(bondInfo[0])).to.equal(Number(payoutFor));

            // Check for allowance b/w bond and treasury
            const allowanceBondAndTreasury = await usdcContract.allowance(PRXYUSDCBond.address,treasury.address);
            console.log("allowance b/w caller and bond",Number(allowanceBondAndTreasury));
            expect(allowanceBondAndTreasury).to.equal("0");

            //////// Deposit is called again

            const payoutFor2 = await PRXYUSDCBond.payoutFor(value);
            console.log("payoutFor",Number(payoutFor));
            expect(Number(payoutFor2)).to.greaterThanOrEqual(10000000000000000);

            await usdcContract.connect(usdcHolder).approve(PRXYUSDCBond.address, "10000000");
            const allowance2 = await usdcContract.allowance(usdcHolder.address,PRXYUSDCBond.address);
            console.log("allowance b/w caller and bond",Number(allowance2));
            expect(allowance2).to.equal("10000000"); 
            
            //Second Deposit
            await PRXYUSDCBond.connect(usdcHolder).deposit("10000000",account3.address);

            const bondInfo2 = await PRXYUSDCBond.bondInfo(account3.address);
            console.log("payout",Number(bondInfo2[0]));
            expect(Number(bondInfo2[0])).to.equal(Number(bondInfo[0])+Number(payoutFor2));
        })  
        
    })

});