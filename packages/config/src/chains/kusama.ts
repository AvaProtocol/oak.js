import BN from "bn.js";
import { Weight } from "./types/Weight";
import { createChain } from "./types/Chain";
import { KusamaTokens } from "../tokens";

const shiden = createChain({
  assets: [{ asset: KusamaTokens.sdn, isNative: true }],
  endpoint: "wss://shiden-rpc.dwellir.com",
  isEthereum: true,
  key: "shiden",
  name: "Shiden Network",
  relayChain: "kusama",
  xcm: {
    instructionWeight: new Weight(new BN("1000000000"), new BN(64 * 1024)),
    network: "kusama",
  },
});

const turing = createChain({
  assets: [
    { asset: KusamaTokens.tur, id: "0", isNative: true },
    { asset: KusamaTokens.sdn, id: "8", isNative: false },
    { asset: KusamaTokens.movr, id: "9", isNative: false },
    { asset: KusamaTokens.mgx, isNative: false }, // MGX is not registered on Turing yet
  ],
  endpoint: "wss://rpc.turing.oak.tech",
  key: "turing",
  name: "Turing Network",
  relayChain: "kusama",
  xcm: {
    instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
    network: "kusama",
  },
});

const mangata = createChain({
  assets: [
    { asset: KusamaTokens.mgx, isNative: true },
    { asset: KusamaTokens.xcTur, isNative: false },
  ],
  endpoint: "wss://kusama-rpc.mangata.online",
  key: "mangata",
  name: "Mangata",
  relayChain: "kusama",
  xcm: {
    instructionWeight: new Weight(new BN("150000000"), new BN("0")),
    network: "kusama",
  },
});

const moonriver = createChain({
  assets: [
    { asset: KusamaTokens.movr, isNative: true },
    {
      asset: KusamaTokens.xcTur,
      contractAddress: "0xfFffffFf6448d0746f2a66342B67ef9CAf89478E",
      id: "133300872918374599700079037156071917454",
      isNative: false,
      otherSymbol: "xcTUR",
    },
  ],
  endpoint: "wss://wss.api.moonriver.moonbeam.network",
  isEthereum: true,
  key: "moonriver",
  name: "Moonriver",
  relayChain: "kusama",
  xcm: {
    instructionWeight: new Weight(new BN("250000000"), new BN("10000")),
    network: "kusama",
  },
});

// eslint-disable-next-line import/no-default-export
export default { mangata, moonriver, shiden, turing };
