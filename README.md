## commit 1: Basic setup

```shell
yarn add hardhat
yarn hardhat
#Start with empty setup
yarn add --dev @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers @nomiclabs/hardhat-etherscan @nomiclabs/hardhat-waffle chai ethereum-waffle hardhat hardhat-contract-sizer hardhat-deploy hardhat-gas-reporter prettier prettier-plugin-solidity solhint solidity-coverage dotenv
```

```javascript
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()
```

## commit 2: Raffle contract basic setup

Creating contract for Raffle, keeping state variables private and creating getter methods.
// We want the address to be payable, as we will pay one player the winning ammount

```solidity
address payable[] private s_players;
// Later adding players by making address payable
s_players.push(payable(msg.sender));
```

## commit 3: Events

There can be upto 3 indexed parameters, also known as topics. These are easy to search.
event names are generally function name reversed

## commit 4: Getting random number from chainlink VRF part1

```shell
yarn add --dev @chainlink/contracts
```

```solidity
contract Raffle is VRFConsumerBaseV2 {
    //... more code

constructor(
        address vrfCoordinatorV2Address,
        uint64 subscriptionId,
        bytes32 gasLane, // keyHash
        uint256 entranceFee,
        uint32 callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2Address) {
```

We need to call the parent class constructor while creating our constructor, similar to super keyword in java

## commit 5: Getting random number from chainlink VRF part2

requestRandomWinner() will be called, which will emit a requestId
fulfillRandomWords() will receive random values and stores them with your contract(or do whatever you want to do after that)
In our case, it will transfer the ammount to the randomly picked address.

## commit 6: Chainlink keepers (checkUpkeep)

fulfillRandomWords() is called internally once the random numbers are generated.
So, we put our logic of transfering money to the winner here.

ChainLink Keepers: Keepers run our code automatically.
We can make our code keepers compatible by inheriting KeeperCompatible
(https://docs.chain.link/docs/chainlink-keepers/compatible-contracts/).
This require us to override two functions:

checkUpkeep:

It returns upkeepNeeded(bool), based on condition defined by us.

```solidity
/** @dev This function that the chainLink keeper nodes call, they look for the upkeepNeeded
 *  to return true.
 * The following should be true in order to return true:
 * 1. Our time interval should have passed.
 * 2. Should have atleast one player and have some Eth.
 * 3. Our subscription is funded with LINK.
 * 4. The lottery should be in the "open" state.
 *
 *
 */
function checkUpkeep(
    bytes calldata /* checkData */
)
    external
    view
    override
    returns (
        bool upkeepNeeded,
        bytes memory /* performData */
    )
{
    upkeepNeeded = false;
    // We don't use the checkData in this example. The checkData is defined when the Upkeep was registered.
}

```

Adding enum RaffleState.
block.timestamp returns the current timestamp of the blockchain.
i_interval specifies the interval for each lottery.
s_lastTimeStamp will be updated everytime the winner is selected.

## commit 7: Chainlink keepers (performUpkeep)

changing checkUpkeep to public so that we can call it from performUpkeep

checkUpkeep: Runs off-chain at every block to determine if the performUpkeep function should be called on-chain.

performUpkeep: Contains the logic that should be executed on-chain when checkUpkeep returns true.

If checkupkeep returns true, the performupkeep is called by the chainlink keeper nodes.

From the documentation :When checkUpkeep returns upkeepNeeded == true, the Keeper node broadcasts a transaction to the blockchain to execute your performUpkeep function on-chain with performData as an input.

We should always check the conditions again i.e. call checkupkeep inside the performUpkeep, and do the required things, if the upkeep is needed.

In our example, we check for checkUpkeep and only then, call the i_vrfCoordinator.requestRandomWords() to get the random words requestID, which will be used to call fulfillRandomWords() by the chainlink VRF, which will finally get the index of winner of lottery and will send the amount to the winner, and will reset the state of the contract state variables.

All the functions, which don't even read the state variables should be named as pure (This decreases the cost).

## commit 8:

```javascript
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
}

// hardhat-deploy adds few more features to hardhat/hre
// We use getNamedAccounts() to get the names for the accounts defined in hardhat-config.js
// We can export tags in from the deploy scripts, and can be run at once using
// `await deployments.fixture(['MyContract'])`
```

-The chainlinkVRF can be tested using the mock provided.
-It also contains the createSubscription and other functions, which can be used to add the smart contract to the subscription for VRF.
-For testnet, we have done this manually, by creating a subscription, funding it, and adding our contract address to the subscribers.

Still not sure, how is the fulfilaRandomWords is being called on calling requestRandomWords. ??

## commit 9:

We spend gas only when the state is updated.
So, all the view/pure functions are free.
If we need to call a non view/pure function, without spending any gas, we can use callStatic
raffle.callStatic.checkUpkeep();

## commit 10:

```solidity
const { deploy, log } = deployments
```

log obtained from here is shown only when running hh deploy
console.log is shown even during the hh test

We can create promises with

```javascript
new Promise(async (resolve, reject) => {
    try {
        //part of code
        resolve()
    } catch (error) {
        //will be called if it fails
        reject(error)
    }
})
```

So, we have setup a listener inside the Promise.
Afte setting up listerner, we mimic the chainlink nodes, and call performUpkeep (keeping in mind that checkUpkeep has returned true, as we did increase the evm_time, mined the block, and added few participants in the lottery ). Here we are immitating chainlink keepers.
Now we will call fulfilRandomWords of coordinator , which will itself call our raffle's fulfilRandomWords, setting up the winner and transfering amout and reseting the state of the raffle

For getting balance of any user, we can call:
accounts = ethers.getSigners()
const balance = await accounts[0].getBalance()

we cant use
const balance = await deployer.getBalance()
as the deployer is just an address, not the signer object, having all the functions like getBalance
