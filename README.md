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

## commit 4: Getting random number from chainlink VRF part2

requestRandomWinner() will be called, which will emit a requestId
fulfillRandomWords() will receive random values and stores them with your contract(or do whatever you want to do after that)
In our case, it will transfer the ammount to the randomly picked address.

## commit 5: Chainlink keepers (checkUpkeep)

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
