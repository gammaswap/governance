// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.2;

import "@layerzerolabs/solidity-examples/contracts/mocks/LZEndpointMock.sol";

contract TestLzEndpoint is LZEndpointMock {
    constructor(uint16 _chainId) LZEndpointMock(_chainId) {}
}