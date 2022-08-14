const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

// !developmentChains.includes(network.name)
//     ? describe.skip
//     : describe("Raffle Unit tests", () => {
if (!developmentChains.includes(network.name)) {
    describe.skip
} else {
    describe("Raffle Unit tests", () => {
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
                    "Raffle__SendMoreToEnterRaffle"
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

            it("returns false if raffle isn't open", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                await raffle.performUpkeep([])
                const raffleState = await raffle.getRaffleState()
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                assert.equal(raffleState.toString(), "1")
                assert.equal(upkeepNeeded, false)
            })
            it("return false if enough time has not passed", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber()])
                await network.provider.request({ method: "evm_mine", params: [] })
                const raffleState = await raffle.getRaffleState()
                assert.equal(raffleState.toString(), "0")
            })

            it("returns true if enough time has passed, has players, eth and is open", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([])
                assert.equal(upkeepNeeded, true)
            })
        })
        describe("performUpkeep", () => {
            it("it can only run if checkUpkeep returns true", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.request({ method: "evm_mine", params: [] })
                //   try {
                //       const tx = await raffle.performUpkeeps([])
                //   } catch (error) {
                //       console.log(`error is ${error}`)
                //   }
                const tx = await raffle.performUpkeep([])
                assert(tx)
                //   const tx = await raffle.performUpkeeps([])
                //   await expect(raffle.performUpkeep([])).not.reverted()
            })
            it("revert if checkUpkeep returns false", async () => {
                await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle_UpkeepNotNeeded")
            })
            it("updates the raffle state, emits an event and calls the vrf coordinator", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.send("evm_mine", [])
                const txnResponse = await raffle.performUpkeep([])
                const txnReceipt = await txnResponse.wait(1)
                const requestId = txnReceipt.events[1].args.requestId
                const raffleState = await raffle.getRaffleState()
                assert(requestId.toNumber() > 0)
                assert.equal(raffleState.toString(), "1")
            })
        })

        describe("fulfillRandomWords", () => {
            beforeEach(async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee })
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                await network.provider.send("evm_mine", [])
            })
            it("it can only be called after performUpkeep", async () => {
                await expect(
                    vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                ).to.be.revertedWith("nonexistent request")
            })

            // THE BIG DADDY TEST!!!
            it("picks a winner, resets the lottery, sends the money", async () => {
                // deployer has already participated, and we have increased the time of evm and have mined a block.
                // Now, we can add 3 more players, and add call performUpkeep pretending to be chainlink keepers.
                // As all the conditions for checkupKeep are true, performUpkeep will call
                // VRFCoordinatorV2Mock.requestRandomWords. Now we have already subscribed to this contract.
                // This contract, is kind of manager for all the consumers. It will return the requestId on requestRandomWords.
                // Chainlink nodes, will keep listening the events, and will get the requestId, consumer and other data about
                // who called the coordinator contract.
                // Now, Chainlink nodes will call the coordinator.fulfillRandomWords(), which will generate the random words, and will send them
                // to the fulfillRandomWords() of the consumer contract.
                // Now the function is being called for what to be done when randomWords are provided to the contract.
                console.log("THE BIG DADDY TEST!!!")
                const additionalEntrants = 3
                const accounts = await ethers.getSigners()
                const startingAccountIndex = 1 // developer has been added at 0th index
                for (
                    let i = startingAccountIndex;
                    i < additionalEntrants + startingAccountIndex;
                    i++
                ) {
                    // We can also do following to connect to account
                    // const accountConnectedRaffle = raffle.connect(accounts[i].address)
                    const accountConnectedRaffle = raffle.connect(accounts[i])
                    await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee })
                }

                const startingTimeStamp = await raffle.getLastTimeStamp()
                // perform upkeep (Mock being chainlink keepers)
                // call fulfillRandomWords

                // Lets create conditions when checkUpkeep returns true.
                // Now impersonating chainlink keepers and calling performUpkeep.
                // performUpkeep will call coordinator.requestRandomWords which will call the our contract with
                // Let's create a new listener for event WinnerPicked
                // Order: call performUpkeep(We are doing this manually impersonating chainlink keepers)
                // performUpkeep will call checkUpkeep and finally will call coordinator contract for running coordinator.requestRandomWords
                // ,which will callback fulfillRandomWords() of contract.
                // TODO:
                // check if the getBalance() costs money or not, call getBalance() and call function that returns getBalance from raffle.sol
                console.log("THE BIG DADDY TEST2!!!")
                await new Promise(async (resolve, reject) => {
                    console.log("PART1")
                    raffle.once("WinnerPicked", async () => {
                        console.log("WinnerPicked event fired")
                        try {
                            const recentWinner = await raffle.getRecentWinner()
                            const raffleState = await raffle.getRaffleState()
                            const winnerBalance = await accounts[1].getBalance()
                            const endingTimeStamp = await raffle.getLastTimeStamp()
                            const numOfPlayers = await raffle.getNumberOfPlayers()
                            assert.equal(numOfPlayers.toNumber(), 0)
                            console.log("1")
                            await expect(raffle.getPlayer(0)).to.be.reverted
                            console.log("2")
                            assert.equal(recentWinner.toString(), accounts[1].address)
                            console.log("3")
                            assert.equal(raffleState, 0)
                            console.log("4")
                            assert.equal(
                                winnerBalance.toString(),
                                startingBalance
                                    .add(
                                        raffleEntranceFee
                                            .mul(additionalEntrants)
                                            .add(raffleEntranceFee)
                                    )
                                    .toString()
                            )
                            console.log("5")
                            assert(endingTimeStamp > startingTimeStamp)
                            console.log("6")
                            resolve()
                        } catch (error) {
                            console.log(`inside catch error with error ' ${error}`)
                            reject(error)
                        }
                    })
                    console.log("PART2")

                    console.log("THE BIG DADDY TEST3!!!")

                    // const recentWinnerOld = await raffle.getRecentWinner()
                    console.log("before running performUpkeep")
                    const tx = await raffle.performUpkeep("0x")
                    console.log("before running wait")

                    const txScript = await tx.wait(1)
                    console.log("before geting starting balance")
                    startingBalance = await accounts[1].getBalance()
                    console.log("before running fulfillRandomWords")
                    const tx2 = await vrfCoordinatorV2Mock.fulfillRandomWords(
                        txScript.events[1].args.requestId,
                        raffle.address
                    )
                    console.log("Done running all of these, waiting for event")
                })
            })
        })
    })
}
