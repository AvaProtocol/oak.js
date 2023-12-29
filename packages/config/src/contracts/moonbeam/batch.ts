// Document: https://docs.moonbeam.network/builders/pallets-precompiles/precompiles/batch/
// https://moonriver.moonscan.io/address/0x0000000000000000000000000000000000000808#code

const address = "0x0000000000000000000000000000000000000808";

const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "SubcallFailed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "SubcallSucceeded",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "to",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "value",
        type: "uint256[]",
      },
      {
        internalType: "bytes[]",
        name: "call_data",
        type: "bytes[]",
      },
      {
        internalType: "uint64[]",
        name: "gas_limit",
        type: "uint64[]",
      },
    ],
    name: "batchAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "to",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "value",
        type: "uint256[]",
      },
      {
        internalType: "bytes[]",
        name: "call_data",
        type: "bytes[]",
      },
      {
        internalType: "uint64[]",
        name: "gas_limit",
        type: "uint64[]",
      },
    ],
    name: "batchSome",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "to",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "value",
        type: "uint256[]",
      },
      {
        internalType: "bytes[]",
        name: "call_data",
        type: "bytes[]",
      },
      {
        internalType: "uint64[]",
        name: "gas_limit",
        type: "uint64[]",
      },
    ],
    name: "batchSomeUntilFailure",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export { abi, address };
