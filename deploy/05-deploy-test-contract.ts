import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
import verify from "../helper-functions"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { ethers } from "hardhat"

const deployBox: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const { getNamedAccounts, deployments, network } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    log("----------------------------------------------------")
    log("Deploying TestContract and waiting for confirmations...")
    const testContract = await deploy("TestContract", {
        from: deployer,
        args: [],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: networkConfig[network.name].blockConfirmations || 1,
    })
    log(`TestContract at ${testContract.address}`)
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(testContract.address, [])
    }
    const boxContract = await ethers.getContractAt("TestContract", testContract.address)
    const timeLock = await ethers.getContract("GovernanceTimeLock")
    const transferTx = await boxContract.transferOwnership(timeLock.address)
    await transferTx.wait(1)
}

export default deployBox
deployBox.tags = ["all", "contract"]