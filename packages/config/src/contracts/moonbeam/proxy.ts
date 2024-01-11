// Document: https://docs.moonbeam.network/builders/pallets-precompiles/precompiles/proxy/
// https://moonriver.moonscan.io/address/0x000000000000000000000000000000000000080D#code

const address = "0x000000000000000000000000000000000000080b";

const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "delegate",
        type: "address",
      },
      {
        internalType: "enum Proxy.ProxyType",
        name: "proxyType",
        type: "uint8",
      },
      {
        internalType: "uint32",
        name: "delay",
        type: "uint32",
      },
    ],
    name: "addProxy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "real",
        type: "address",
      },
      {
        internalType: "address",
        name: "delegate",
        type: "address",
      },
      {
        internalType: "enum Proxy.ProxyType",
        name: "proxyType",
        type: "uint8",
      },
      {
        internalType: "uint32",
        name: "delay",
        type: "uint32",
      },
    ],
    name: "isProxy",
    outputs: [
      {
        internalType: "bool",
        name: "exists",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "real",
        type: "address",
      },
      {
        internalType: "address",
        name: "callTo",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "callData",
        type: "bytes",
      },
    ],
    name: "proxy",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "real",
        type: "address",
      },
      {
        internalType: "enum Proxy.ProxyType",
        name: "forceProxyType",
        type: "uint8",
      },
      {
        internalType: "address",
        name: "callTo",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "callData",
        type: "bytes",
      },
    ],
    name: "proxyForceType",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "removeProxies",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "delegate",
        type: "address",
      },
      {
        internalType: "enum Proxy.ProxyType",
        name: "proxyType",
        type: "uint8",
      },
      {
        internalType: "uint32",
        name: "delay",
        type: "uint32",
      },
    ],
    name: "removeProxy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export { address, abi };
