import { GS, TestLzEndpoint, TestLzEndpoint__factory } from "../typechain-types"
import { deployments, ethers, getNamedAccounts } from "hardhat"
import { expect } from "chai"
import { BigNumber } from "ethers"

describe("GS", async () => {
    let srcGovToken: GS
    let dstGovToken: GS
    let srcLzEndpoint: any
    let dstLzEndpoint: any
    let wallet: any
    let deployer: any
    let LzEndpointFactory, GovTokenFactory

    const srcChainId = 1
    const dstChainId = 2
    const globalSupply = ethers.utils.parseUnits("16000000", 18)

    beforeEach(async () => {
        [wallet] = await ethers.getSigners();
        const accounts = await getNamedAccounts()
        deployer = accounts.deployer

        // await deployments.fixture(["gs"])
        
        LzEndpointFactory = await ethers.getContractFactory("TestLzEndpoint")
        GovTokenFactory = await ethers.getContractFactory('GS')

        srcLzEndpoint = await LzEndpointFactory.deploy(srcChainId);
        dstLzEndpoint = await LzEndpointFactory.deploy(dstChainId);
        srcGovToken = await GovTokenFactory.deploy(srcLzEndpoint.address) as GS
        dstGovToken = await GovTokenFactory.deploy(dstLzEndpoint.address) as GS

        await srcLzEndpoint.setDestLzEndpoint(dstGovToken.address, dstLzEndpoint.address)
        await dstLzEndpoint.setDestLzEndpoint(srcGovToken.address, srcLzEndpoint.address)
        await srcGovToken.setTrustedRemote(dstChainId, ethers.utils.solidityPack(["address", "address"], [dstGovToken.address, srcGovToken.address]))
        await dstGovToken.setTrustedRemote(srcChainId, ethers.utils.solidityPack(["address", "address"], [srcGovToken.address, dstGovToken.address]))
        await srcGovToken.setUseCustomAdapterParams(true);
    })

    describe("deployment", async () => {
        it("deployer is first account", async () => {
            expect(deployer).to.equal(wallet.address)
        })

        it("init values", async () => {
            expect(await srcGovToken.name()).to.equal("GammaSwap")
            expect(await srcGovToken.symbol()).to.equal("GS")

            const maxSupply = await srcGovToken.s_maxSupply();

            expect(maxSupply).to.equal(BigNumber.from(16).mul(BigNumber.from(10).pow(24)))
            expect(await srcGovToken.s_maxSupply()).to.equal(maxSupply)
            expect(await srcGovToken.totalSupply()).to.equal(maxSupply)
        })

        it("Deployer owns everything", async () => {
            const totalSupply = await srcGovToken.totalSupply();
            expect(await srcGovToken.balanceOf(deployer)).to.equal(totalSupply)
        })
    })

    describe("crosschain", async () => {
        it("sendFrom() - tokens from main to other chain using default", async function () {
            // ensure they're both allocated initial amounts
            expect(await srcGovToken.balanceOf(deployer)).to.equal(globalSupply)
            expect(await dstGovToken.balanceOf(deployer)).to.equal(globalSupply)
    
            const amount = ethers.utils.parseUnits("100", 18)
    
            await srcGovToken.setUseCustomAdapterParams(false)
    
            // estimate nativeFees
            let nativeFee = (await srcGovToken.estimateSendFee(dstChainId, deployer, amount, false, "0x")).nativeFee
    
            await srcGovToken.sendFrom(
                deployer,
                dstChainId, // destination chainId
                deployer, // destination address to send tokens to
                amount, // quantity of tokens to send (in units of wei)
                deployer, // LayerZero refund address (if too much fee is sent gets refunded)
                ethers.constants.AddressZero, // future parameter
                "0x", // adapterParameters empty bytes specifies default settings
                { value: nativeFee } // pass a msg.value to pay the LayerZero message fee
            )
    
            // verify tokens burned on source chain and minted on destination chain
            expect(await srcGovToken.balanceOf(deployer)).to.be.equal(globalSupply.sub(amount))
            expect(await dstGovToken.balanceOf(deployer)).to.be.equal(globalSupply.add(amount))
        })
        it("sendFrom() - tokens from main to other chain using adapterParam", async function () {
            // ensure they're both allocated initial amounts
            expect(await srcGovToken.balanceOf(deployer)).to.equal(globalSupply)
            expect(await dstGovToken.balanceOf(deployer)).to.equal(globalSupply)
    
            const amount = ethers.utils.parseUnits("100", 18)

            await srcGovToken.setMinDstGas(dstChainId, await srcGovToken.PT_SEND(), 225000)
            const adapterParam = ethers.utils.solidityPack(["uint16", "uint256"], [1, 225000])
            // estimate nativeFees
            let nativeFee = (await srcGovToken.estimateSendFee(dstChainId, deployer, amount, false, adapterParam)).nativeFee
    
            await srcGovToken.sendFrom(
                deployer,
                dstChainId, // destination chainId
                deployer, // destination address to send tokens to
                amount, // quantity of tokens to send (in units of wei)
                deployer, // LayerZero refund address (if too much fee is sent gets refunded)
                ethers.constants.AddressZero, // future parameter
                adapterParam, // adapterParameters empty bytes specifies default settings
                { value: nativeFee } // pass a msg.value to pay the LayerZero message fee
            )
    
            // verify tokens burned on source chain and minted on destination chain
            expect(await srcGovToken.balanceOf(deployer)).to.be.equal(globalSupply.sub(amount))
            expect(await dstGovToken.balanceOf(deployer)).to.be.equal(globalSupply.add(amount))
        })
    })
})