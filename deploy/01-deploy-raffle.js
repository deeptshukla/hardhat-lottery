const { getNamedAccounts, deployments, network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const verify = require("../utils/verify")

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("30")

module.exports = async function ({ getNamedAccounts, deployments }) {
    // const { getNamedAccounts, deployments } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2Address
    if (developmentChains.includes(network.name)) {
        console.log(`includes ${network.name}`)
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        // vrfCoordinatorV2Mock = await deployments.get("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const txnResponse = await vrfCoordinatorV2Mock.createSubscription()
        const txnReceipt = await txnResponse.wait()
        subscriptionId = txnReceipt.events[0].args.subId
        // Fund the subscription
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
        callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    }

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]

    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        gasLane,
        entranceFee,
        callbackGasLimit,
        interval,
    ]
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log("Raffle deployed!")

    if (developmentChains.includes(network.name)) {
        vrfCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address)
    }

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(raffle.address, args)
    } else {
        log("Skipping verify for local developement!")
    }

    log("-------------------------------------")

    // log(await raffle.geNumWords())
    // log(await raffle.getLatestTimeStamp())
    // log(await raffle.getRaffleState())
    // const contract = await ethers.getContract("Raffle", deployer)
    // console.log(await contract.getInterval())
}
module.exports.tags = ["all", "raffle"]