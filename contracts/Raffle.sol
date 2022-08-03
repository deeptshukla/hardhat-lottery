// Raffle
// Enter the lottery (paying some ammount)
// Pick a random winner (verifiable random)
// Winner be selected every X minute -> Automated
// Chainlink oracle -> randomness, automated execution (Chainlink keeper)

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

error Raffle__NotEnoughEthEntered();

contract Raffle {
    /*State Variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players; // We want the address to be payable, as we will pay one player the winning ammount

    /*Events */
    event RaffleEnter(address indexed player);

    constructor(uint256 entranceFee) {
        i_entranceFee = entranceFee;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughEthEntered();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
