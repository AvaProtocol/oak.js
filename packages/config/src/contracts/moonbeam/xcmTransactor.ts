// Document: https://docs.moonbeam.network/builders/interoperability/xcm/xcm-transactor/#xcmtransactor-precompile
// https://moonriver.moonscan.io/address/0x000000000000000000000000000000000000080D#code

const address = "0x000000000000000000000000000000000000080d";

const abi = [
  {
    inputs: [
      {
        internalType: "uint8",
        name: "transactor",
        type: "uint8",
      },
      {
        internalType: "uint16",
        name: "index",
        type: "uint16",
      },
      {
        internalType: "bytes",
        name: "innerCall",
        type: "bytes",
      },
    ],
    name: "encodeUtilityAsDerivative",
    outputs: [
      {
        internalType: "bytes",
        name: "result",
        type: "bytes",
      },
    ],
    stateMutability: "pure",
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
        internalType: "struct XcmTransactorV2.Multilocation",
        name: "multilocation",
        type: "tuple",
      },
    ],
    name: "feePerSecond",
    outputs: [
      {
        internalType: "uint256",
        name: "feePerSecond",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint16",
        name: "index",
        type: "uint16",
      },
    ],
    name: "indexToAccount",
    outputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    stateMutability: "view",
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
        internalType: "struct XcmTransactorV2.Multilocation",
        name: "multilocation",
        type: "tuple",
      },
    ],
    name: "transactInfoWithSigned",
    outputs: [
      {
        internalType: "uint64",
        name: "transactExtraWeight",
        type: "uint64",
      },
      {
        internalType: "uint64",
        name: "transactExtraWeightSigned",
        type: "uint64",
      },
      {
        internalType: "uint64",
        name: "maxWeight",
        type: "uint64",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "transactor",
        type: "uint8",
      },
      {
        internalType: "uint16",
        name: "index",
        type: "uint16",
      },
      {
        internalType: "address",
        name: "currencyId",
        type: "address",
      },
      {
        internalType: "uint64",
        name: "transactRequiredWeightAtMost",
        type: "uint64",
      },
      {
        internalType: "bytes",
        name: "innerCall",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "feeAmount",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "overallWeight",
        type: "uint64",
      },
    ],
    name: "transactThroughDerivative",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint8",
        name: "transactor",
        type: "uint8",
      },
      {
        internalType: "uint16",
        name: "index",
        type: "uint16",
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
        internalType: "struct XcmTransactorV2.Multilocation",
        name: "feeAsset",
        type: "tuple",
      },
      {
        internalType: "uint64",
        name: "transactRequiredWeightAtMost",
        type: "uint64",
      },
      {
        internalType: "bytes",
        name: "innerCall",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "feeAmount",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "overallWeight",
        type: "uint64",
      },
    ],
    name: "transactThroughDerivativeMultilocation",
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
        internalType: "struct XcmTransactorV2.Multilocation",
        name: "dest",
        type: "tuple",
      },
      {
        internalType: "address",
        name: "feeLocationAddress",
        type: "address",
      },
      {
        internalType: "uint64",
        name: "transactRequiredWeightAtMost",
        type: "uint64",
      },
      {
        internalType: "bytes",
        name: "call",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "feeAmount",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "overallWeight",
        type: "uint64",
      },
    ],
    name: "transactThroughSigned",
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
        internalType: "struct XcmTransactorV2.Multilocation",
        name: "dest",
        type: "tuple",
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
        internalType: "struct XcmTransactorV2.Multilocation",
        name: "feeLocation",
        type: "tuple",
      },
      {
        internalType: "uint64",
        name: "transactRequiredWeightAtMost",
        type: "uint64",
      },
      {
        internalType: "bytes",
        name: "call",
        type: "bytes",
      },
      {
        internalType: "uint256",
        name: "feeAmount",
        type: "uint256",
      },
      {
        internalType: "uint64",
        name: "overallWeight",
        type: "uint64",
      },
    ],
    name: "transactThroughSignedMultilocation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export { address, abi };
