const abi = [
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
        internalType: "struct XCM.Multilocation",
        name: "destination",
        type: "tuple",
      },
      {
        internalType: "bytes",
        name: "xcm_call",
        type: "bytes",
      },
    ],
    name: "send_xcm",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "currencyAddress",
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
        internalType: "struct XCM.Multilocation",
        name: "destination",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint64",
            name: "ref_time",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "proof_size",
            type: "uint64",
          },
        ],
        internalType: "struct XCM.WeightV2",
        name: "weight",
        type: "tuple",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
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
            internalType: "struct XCM.Multilocation",
            name: "location",
            type: "tuple",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        internalType: "struct XCM.MultiAsset[]",
        name: "assets",
        type: "tuple[]",
      },
      {
        internalType: "uint32",
        name: "feeItem",
        type: "uint32",
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
        internalType: "struct XCM.Multilocation",
        name: "destination",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint64",
            name: "ref_time",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "proof_size",
            type: "uint64",
          },
        ],
        internalType: "struct XCM.WeightV2",
        name: "weight",
        type: "tuple",
      },
    ],
    name: "transfer_multi_assets",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "currencyAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        internalType: "struct XCM.Currency[]",
        name: "currencies",
        type: "tuple[]",
      },
      {
        internalType: "uint32",
        name: "feeItem",
        type: "uint32",
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
        internalType: "struct XCM.Multilocation",
        name: "destination",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint64",
            name: "ref_time",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "proof_size",
            type: "uint64",
          },
        ],
        internalType: "struct XCM.WeightV2",
        name: "weight",
        type: "tuple",
      },
    ],
    name: "transfer_multi_currencies",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
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
        internalType: "struct XCM.Multilocation",
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
        internalType: "struct XCM.Multilocation",
        name: "destination",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint64",
            name: "ref_time",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "proof_size",
            type: "uint64",
          },
        ],
        internalType: "struct XCM.WeightV2",
        name: "weight",
        type: "tuple",
      },
    ],
    name: "transfer_multiasset",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
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
        internalType: "struct XCM.Multilocation",
        name: "asset",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "fee",
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
        internalType: "struct XCM.Multilocation",
        name: "destination",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint64",
            name: "ref_time",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "proof_size",
            type: "uint64",
          },
        ],
        internalType: "struct XCM.WeightV2",
        name: "weight",
        type: "tuple",
      },
    ],
    name: "transfer_multiasset_with_fee",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "currencyAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "fee",
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
        internalType: "struct XCM.Multilocation",
        name: "destination",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint64",
            name: "ref_time",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "proof_size",
            type: "uint64",
          },
        ],
        internalType: "struct XCM.WeightV2",
        name: "weight",
        type: "tuple",
      },
    ],
    name: "transfer_with_fee",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const xtokens = {
  abi,
  address: "0x0000000000000000000000000000000000005004",
};

// eslint-disable-next-line import/no-default-export
export default xtokens;
