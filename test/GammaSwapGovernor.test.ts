import { GammaSwapGovernor, GS, GovernanceTimeLock, TestContract } from "../typechain-types"
import {deployments, ethers, getNamedAccounts} from "hardhat"
import { assert, expect } from "chai"
import { BigNumber } from "ethers";
import {
    FUNC,
    PROPOSAL_DESCRIPTION,
    NEW_STORE_VALUE,
    VOTING_DELAY,
    VOTING_PERIOD,
    MIN_DELAY,
    QUORUM_PERCENTAGE,
    PROPOSAL_THRESHOLD,
} from "../helper-hardhat-config"
import { moveBlocks } from "../utils/move-blocks"
import { moveTime } from "../utils/move-time"

describe("GammaSwapGovernor", async () => {
    let governor: GammaSwapGovernor
    let governanceToken: GS
    let timeLock: GovernanceTimeLock
    let contract: TestContract
    let wallet: any
    let deployer: any
    const voteWay = 1 // for
    const reason = "I lika do da cha cha"
    const maxTokenSupply = BigNumber.from(16).mul(BigNumber.from(10).pow(24))

    beforeEach(async () => {
        [wallet] = await ethers.getSigners();
        const accounts = await getNamedAccounts()
        deployer = accounts.deployer
        await deployments.fixture(["all"])
        governor = await ethers.getContract("GammaSwapGovernor")
        timeLock = await ethers.getContract("GovernanceTimeLock")
        governanceToken = await ethers.getContract("GS")
        contract = await ethers.getContract("TestContract")
    })

    describe("deployment", async () => {
        it("deployer is first account", async () => {
            expect(deployer).to.equal(wallet.address)
        })

        it("init values", async () => {
            expect(await governor.name()).to.equal("GammaSwapGovernor")
            expect(await governor.token()).to.equal(governanceToken.address)
            expect(await governor.timelock()).to.equal(timeLock.address)
            expect(await governor.votingDelay()).to.equal(VOTING_DELAY)
            expect(await governor.votingPeriod()).to.equal(VOTING_PERIOD)
            expect(await governor.proposalThreshold()).to.equal(PROPOSAL_THRESHOLD)
            expect(await governor.quorumPercentage()).to.equal(QUORUM_PERCENTAGE)
        })

        it("set up", async () => {
            const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE()
            const proposerRole = await timeLock.PROPOSER_ROLE()
            const executorRole = await timeLock.EXECUTOR_ROLE()
            expect(await timeLock.hasRole(proposerRole, governor.address)).to.equal(true)
            expect(await timeLock.hasRole(executorRole, ethers.constants.AddressZero)).to.equal(true)
            expect(await timeLock.hasRole(adminRole, deployer)).to.equal(false)
        })
    })

    describe("flow test", async () => {
        it("can only be changed through governance", async () => {
            await expect(contract.store(55)).to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("proposes, votes, waits, queues, and then executes", async () => {
            // propose
            const encodedFunctionCall = contract.interface.encodeFunctionData(FUNC, [NEW_STORE_VALUE])
            const proposeTx = await governor.propose(
                [contract.address],
                [0],
                [encodedFunctionCall],
                PROPOSAL_DESCRIPTION
            )

            const proposeReceipt = await proposeTx.wait(1)
            const proposalId = proposeReceipt.events![0].args!.proposalId
            let proposalState = await governor.state(proposalId)
            // console.log(`Current Proposal State: ${proposalState}`)

            await moveBlocks(VOTING_DELAY + 1)
            // vote
            const voteTx = await governor.castVoteWithReason(proposalId, voteWay, reason)
            const resp = await voteTx.wait(1)
            const evt = resp.events && resp.events.length > 0 ? resp.events[0] : {
                event: "",
                args: {voter: "", proposalId: "", support: "", weight: "", reason: ""}
            };
            expect(evt.event).to.equal("VoteCast")
            expect(evt.args?.voter).to.equal(wallet.address)
            expect(evt.args?.proposalId).to.equal(proposalId)
            expect(evt.args?.support).to.equal(voteWay)
            expect(evt.args?.weight).to.equal(maxTokenSupply)
            expect(evt.args?.reason).to.equal(reason)
            proposalState = await governor.state(proposalId)
            assert.equal(proposalState.toString(), "1")
            // console.log(`Current Proposal State: ${proposalState}`)
            await moveBlocks(VOTING_PERIOD + 1)

            // queue & execute
            // const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION))
            const descriptionHash = ethers.utils.id(PROPOSAL_DESCRIPTION)
            const queueTx = await governor.queue([contract.address], [0], [encodedFunctionCall], descriptionHash)
            await queueTx.wait(1)
            await moveTime(MIN_DELAY + 1)
            await moveBlocks(1)

            proposalState = await governor.state(proposalId)
            // console.log(`Current Proposal State: ${proposalState}`)

            // console.log("Executing...")
            // console.log
            const exTx = await governor.execute([contract.address], [0], [encodedFunctionCall], descriptionHash)
            await exTx.wait(1)
            // console.log((await contract.retrieve()).toString())
        })
    })
})