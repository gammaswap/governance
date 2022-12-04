import { GS } from "../typechain-types"
import { deployments, ethers, getNamedAccounts } from "hardhat"
import { expect } from "chai"
import { BigNumber } from "ethers"

describe("GS", async () => {
    let governanceToken: GS
    let wallet: any
    let deployer: any

    beforeEach(async () => {
        [wallet] = await ethers.getSigners();
        const accounts = await getNamedAccounts()
        deployer = accounts.deployer

        await deployments.fixture(["gs"])
        governanceToken = await ethers.getContract("GS")
    })

    describe("deployment", async () => {
        it("deployer is first account", async () => {
            expect(deployer).to.equal(wallet.address)
        })

        it("init values", async () => {
            expect(await governanceToken.name()).to.equal("GammaSwap")
            expect(await governanceToken.symbol()).to.equal("GS")

            const maxSupply = await governanceToken.s_maxSupply();

            expect(maxSupply).to.equal(BigNumber.from(16).mul(BigNumber.from(10).pow(24)))
            expect(await governanceToken.s_maxSupply()).to.equal(maxSupply)
            expect(await governanceToken.totalSupply()).to.equal(maxSupply)
        })

        it("Deployer owns everything", async () => {
            const totalSupply = await governanceToken.totalSupply();
            expect(await governanceToken.balanceOf(deployer)).to.equal(totalSupply)
        })
    })
})