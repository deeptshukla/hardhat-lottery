const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
// const { describe, it } = require("node:test")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit tests", () => {
          let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer, interval
          const chainId = network.config.chainId

          beforeEach(async function () {
              //We will need raffle and vrfCoordinatorV2Mock contracts
              //   deployer = (await getNamedAccounts()).deployer
              deployer = (await getNamedAccounts()).deployer

              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              raffleEntranceFee = networkConfig[chainId]["entranceFee"]
              interval = await raffle.getInterval()
          })

          describe("constructor", () => {
              it("initializes the raffle correctly", async () => {
                  const raffleState = await raffle.getRaffleState()
                  //   interval = await raffle.getInterval()
                  assert.equal(raffleState.toString(), "0") // It should be open, meaning, 0
                  assert.equal(interval.toString(), networkConfig[chainId]["interval"])
              })
          })
          describe("enterRaffle", () => {
              it("reverts when not paying enough", async () => {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__NotEnoughEthEntered"
                  )
              })
              it("adds player to players when they enter raffle", async () => {
                  const txn = await raffle.enterRaffle({ value: raffleEntranceFee })
                  const playerAddedInContract = await raffle.getPlayer(0)
                  assert.equal(playerAddedInContract, deployer)
              })
              it("emits event on player entry", async () => {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      raffle,
                      "RaffleEnter"
                  )
              })
              //   it("doesn't allow entrance while raffle is calculating", async () => {
              //       await raffle.enterRaffle({ value: raffleEntranceFee })
              //       //   console.log(interval)
              //       //   console.log(`${interval}`)
              //       //   console.log(interval.toNumber())
              //       console.log("1-")
              //       const blockNumBefore = await ethers.provider.getBlockNumber()
              //       console.log("2-")
              //       const blockBefore = await ethers.provider.getBlock(blockNumBefore)
              //       console.log("3-")
              //       const timestampBefore = blockBefore.timestamp
              //       console.log("4-")
              //       //   console.log(raffle.block.timestamp)
              //       await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
              //       console.log("5-")
              //       //   console.log(raffle.timestamp)
              //       await network.provider.send("evm_mine", [])
              //       console.log("6-")
              //       const blockNumAfter = await ethers.provider.getBlockNumber()
              //       console.log("7-")
              //       const blockAfter = await ethers.provider.getBlock(blockNumAfter)
              //       console.log("8-")
              //       const timestampAfter = blockAfter.timestamp
              //       console.log("9-")

              //       console.log(`blockNumBefore: ${blockNumBefore} blockNumAfter: ${blockNumAfter}`)
              //       console.log(
              //           `timestampBefore: ${timestampBefore} timestampAfter: ${timestampAfter}`
              //       )
              //       await raffle.performUpkeep([])
              //       await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
              //           "Raffle__NotOpen"
              //       )
              //   })
              it("doesn't allow entrance when raffle is calculating", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  // for a documentation of the methods below, go here: https://hardhat.org/hardhat-network/reference
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  // we pretend to be a keeper for a second
                  await raffle.performUpkeep([]) // changes the state to calculating for our comparison below
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
                      // is reverted as raffle is calculating
                      "Raffle__NotOpen"
                  )
              })
          })
          describe("checkUpkeep", () => {
              it("returns false if people haven't sent any ETH", async () => {
                  //   await raffle.enterRaffle({ value: raffleEntranceFee })
                  //   let totalPlayers = await raffle.getNumberOfPlayers()
                  //   let balance = await raffle.getBalance()
                  //   console.log(`totalPlayers are ${totalPlayers} and balance is ${balance}`)
                  //   await raffle.enterRaffle({ value: raffleEntranceFee })
                  //   totalPlayers = await raffle.getNumberOfPlayers()
                  //   balance = await raffle.getBalance()
                  //   console.log(`totalPlayers are ${totalPlayers} and balance is ${balance}`)
                  //   await raffle.callStatic.enterRaffle({ value: raffleEntranceFee })
                  //   totalPlayers = await raffle.getNumberOfPlayers()
                  //   balance = await raffle.getBalance()
                  //   console.log(`totalPlayers are ${totalPlayers} and balance is ${balance}`)
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                  assert.equal(upkeepNeeded, true)
              })
          })
      })
