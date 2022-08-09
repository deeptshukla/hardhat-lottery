const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") //It costs 0.25LINK per request
const GAS_PRICE_LINK = 1e9 // link per gas
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const networkName = network.name
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(networkName)) {
        log("Local network detected! Deploying mocks...")
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args: args,
            log: true,
            // waitConfirmations: network.config.blockConfirmations || 1,
        })
        log("Mocks deployed!")
        log(`networkName is ${networkName} and chainId is ${chainId} `)
        log("------------------------------------")
    }
}
module.exports.tags = ["all", "mocks"]
