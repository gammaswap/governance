import { GovernanceTimeLock } from "../typechain-types"
import {deployments, ethers, getNamedAccounts} from "hardhat"
import { expect } from "chai"
import {
    MIN_DELAY,
} from "../helper-hardhat-config"

describe("GammaSwapTimeLock", async () => {
    let timeLock: GovernanceTimeLock
    let wallet: any
    let deployer: any

    beforeEach(async () => {
        [wallet] = await ethers.getSigners();
        const accounts = await getNamedAccounts()
        deployer = accounts.deployer

        await deployments.fixture(["timelock"])
        timeLock = await ethers.getContract("GovernanceTimeLock")
    })

    describe("deployment", async () => {
        it("deployer is first account", async () => {
            expect(deployer).to.equal(wallet.address)
        })

        it("min delay", async () => {
            expect(await timeLock.getMinDelay()).to.equal(MIN_DELAY)
        })

        it("init roles", async () => {
            const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE()
            const proposerRole = await timeLock.PROPOSER_ROLE()
            const executorRole = await timeLock.EXECUTOR_ROLE()
            const cancellerRole = await timeLock.CANCELLER_ROLE()

            expect(await timeLock.hasRole(adminRole, deployer)).to.equal(true)
            expect(await timeLock.getRoleAdmin(adminRole)).to.equal(adminRole)
            expect(await timeLock.getRoleAdmin(proposerRole)).to.equal(adminRole)
            expect(await timeLock.getRoleAdmin(executorRole)).to.equal(adminRole)
            expect(await timeLock.getRoleAdmin(cancellerRole)).to.equal(adminRole)

            const accounts = await ethers.getSigners()
            for(let i = 1; i < accounts.length; i++) {
                expect(await timeLock.hasRole(adminRole, accounts[i].address)).to.equal(false)
                expect(await timeLock.hasRole(proposerRole, accounts[i].address)).to.equal(false)
                expect(await timeLock.hasRole(executorRole, accounts[i].address)).to.equal(false)
                expect(await timeLock.hasRole(cancellerRole, accounts[i].address)).to.equal(false)
            }
        })
    })
})