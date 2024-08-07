// Documentation: https://docs.moonbeam.network/builders/interoperability/xcm/xc20/send-xc20s/xtokens-precompile/
// https://moonriver.moonscan.io/address/0x0000000000000000000000000000000000000804#code

const address = "0x0000000000000000000000000000000000000804";

const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "currency_address",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint8",
            name: "parents",
            type: "uint8",
          },
          {
            internalType: "bytes[]",
            name: "interior",
            type: "bytes[]",
          },
        ],
        internalType: "structXtokens.Multilocation",
        name: "destination",
        type: "tuple",
      },
      {
        internalType: "uint64",
        name: "weight",
        type: "uint64",
      },
    ],
    name: "transfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint8",
            name: "parents",
            type: "uint8",
          },
          {
            internalType: "bytes[]",
            name: "interior",
            type: "bytes[]",
          },
        ],
        internalType: "structXtokens.Multilocation",
        name: "asset",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "uint8",
            name: "parents",
            type: "uint8",
          },
          {
            internalType: "bytes[]",
            name: "interior",
            type: "bytes[]",
          },
        ],
        internalType: "structXtokens.Multilocation",
        name: "destination",
        type: "tuple",
      },
      {
        internalType: "uint64",
        name: "weight",
        type: "uint64",
      },
    ],
    name: "transfer_multiasset",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export { abi, address };
