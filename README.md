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
