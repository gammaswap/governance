import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import verify from "../helper-functions"
import {
    networkConfig,
    developmentChains,
    QUORUM_PERCENTAGE,
    VOTING_PERIOD,
    VOTING_DELAY,
    PROPOSAL_THRESHOLD,
} from "../helper-hardhat-config"

const deployGovernorContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const governanceToken = await get("GS")
    const timeLock = await get("GovernanceTimeLock")
    const args = [
        governanceToken.address,
        timeLock.address,
        QUORUM_PERCENTAGE,
        VOTING_PERIOD,
        VOTING_DELAY,
        PROPOSAL_THRESHOLD,
    ]

    log("----------------------------------------------------")
    log("Deploying GammaSwapGovernor and waiting for confirmations...")
    const governorContract = await deploy("GammaSwapGovernor", {
        from: deployer,
        args,
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })
    log(`GammaSwapGovernor at ${governorContract.address}`)
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(governorContract.address, args)
    }
}

export default deployGovernorContract
deployGovernorContract.tags = ["all", "governor", "prod"]