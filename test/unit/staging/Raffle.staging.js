const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../../helper-hardhat-config")
developmentChains

if (developmentChains.includes(network.name)) {
    describe.skip
} else {
    describe("Raffle staging test", () => {
        let deployer, raffle, raffle2, raffleEntranceFee
        console.log("before before each")
        beforeEach(async () => {
            console.log("inside before each")
            deployer = (await getNamedAccounts()).deployer
            console.log(`deployer is ${deployer}, now deploying others`)
            // await deployments.fixture(["all"])
            console.log(`after deployment fixture`)
            raffle = await ethers.getContract("Raffle", deployer)
            console.log(`raffle is ${raffle.address}`)
            // raffle2 = await deployments.get("Raffle")
            raffleEntranceFee = await raffle.getEntranceFee()
            // console.log(
            //     `raffle1 address is ${raffle.address} and raffle2 address is ${raffle2.address}`
            // )
        })

        describe("fulfilRandomWords", () => {
            it("should work with live chainlink  keepers and vrf and gets a winner ", async () => {
                console.log("Inside test 1")
                // enter the raffle,
                const startingTimeStamp = await raffle.getLastTimeStamp()

                const accounts = await ethers.getSigners()
                // Setup listener
                await new Promise(async (resolve, reject) => {
                    raffle.once("WinnerPicked", async () => {
                        console.log("WinnerPicked event fired")
                        try {
                            const recentWinner = await raffle.getRecentWinner()
                            const raffleState = await raffle.getRaffleState()
                            const winnerEndingBalance = await accounts[0].getBalance()
                            const endingTimeStamp = await raffle.getLastTimeStamp()
                            const numOfPlayers = await raffle.getNumberOfPlayers()

                            await expect(raffle.getPlayer(0)).to.be.reverted
                            assert.equal(recentWinner.toString(), accounts[0].address)
                            assert.equal(recentWinner.toString(), deployer)
                            assert.equal(raffleState, 0)
                            assert.equal(
                                winnerStartingBalance.add(raffleEntranceFee).toString(),
                                winnerEndingBalance.toString()
                            )
                            assert(endingTimeStamp > startingTimeStamp)
                            resolve()
                        } catch (error) {
                            console.log(`Got error : ${error}`)
                            reject(error)
                        }
                    })
                    // Then entering the raffle
                    console.log("Entering Raffle...")
                    const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
                    await tx.wait(1)
                    console.log("Ok, time to wait...")
                    const winnerStartingBalance = await accounts[0].getBalance()
                    // Enter the raffle now
                    // raffle.enterRaffle({ value: raffleEntranceFee })
                    // const winnerStartingBalance = await accounts[0].getBalance()

                    // const tx = await raffle.enterRaffle({ value: raffleEntranceFee })
                    //   await tx.wait(1)
                    //   console.log("Ok, time to wait...")
                    //   const winnerStartingBalance = await accounts[0].getBalance()

                    // This will keep running, unless our listener doesn't listen
                })
            })
        })
    })
}
