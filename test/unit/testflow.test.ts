import { GammaSwapGovernor, GS, GovernanceTimeLock, TestContract } from "../../typechain-types"
import { deployments, ethers } from "hardhat"
import { assert, expect } from "chai"
import {
    FUNC,
    PROPOSAL_DESCRIPTION,
    NEW_STORE_VALUE,
    VOTING_DELAY,
    VOTING_PERIOD,
    MIN_DELAY,
} from "../../helper-hardhat-config"
import { moveBlocks } from "../../utils/move-blocks"
import { moveTime } from "../../utils/move-time"

describe("Governor Flow", async () => {
    let governor: GammaSwapGovernor
    let governanceToken: GS
    let timeLock: GovernanceTimeLock
    let contract: TestContract
    const voteWay = 1 // for
    const reason = "I lika do da cha cha"
    beforeEach(async () => {
        await deployments.fixture(["all"])
        governor = await ethers.getContract("GammaSwapGovernor")
        timeLock = await ethers.getContract("GovernanceTimeLock")
        governanceToken = await ethers.getContract("GS")
        contract = await ethers.getContract("TestContract")
    })

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
        console.log(`Current Proposal State: ${proposalState}`)

        await moveBlocks(VOTING_DELAY + 1)
        // vote
        const voteTx = await governor.castVoteWithReason(proposalId, voteWay, reason)
        await voteTx.wait(1)
        proposalState = await governor.state(proposalId)
        assert.equal(proposalState.toString(), "1")
        console.log(`Current Proposal State: ${proposalState}`)
        await moveBlocks(VOTING_PERIOD + 1)

        // queue & execute
        // const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION))
        const descriptionHash = ethers.utils.id(PROPOSAL_DESCRIPTION)
        const queueTx = await governor.queue([contract.address], [0], [encodedFunctionCall], descriptionHash)
        await queueTx.wait(1)
        await moveTime(MIN_DELAY + 1)
        await moveBlocks(1)

        proposalState = await governor.state(proposalId)
        console.log(`Current Proposal State: ${proposalState}`)

        console.log("Executing...")
        console.log
        const exTx = await governor.execute([contract.address], [0], [encodedFunctionCall], descriptionHash)
        await exTx.wait(1)
        console.log((await contract.retrieve()).toString())
    })
})