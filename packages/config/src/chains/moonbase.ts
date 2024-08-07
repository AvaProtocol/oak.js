import BN from "bn.js";
import { Weight } from "./types/Weight";
import { ChainFamily, createChain } from "./types/Chain";
import { MoonbaseTokens } from "../tokens";

const turingMoonbase = createChain({
  assets: [{ asset: MoonbaseTokens.tur, isNative: true }],
  endpoint: "ws://167.99.226.24:8846",
  family: ChainFamily.oak,
  key: "turing-moonbase",
  name: "Moonbase Turing",
  relayChain: "moonbase-alpha-relay",
  xcm: {
    instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
    network: "moonbase-alpha-relay",
  },
});

const moonbaseAlpha = createChain({
  assets: [
    { asset: MoonbaseTokens.dev, isNative: true },
    {
      asset: MoonbaseTokens.tur,
      contractAddress: "0xfFffffFf6448d0746f2a66342B67ef9CAf89478E",
      id: "133300872918374599700079037156071917454",
      isNative: false,
    },
  ],
  endpoint: "wss://wss.api.moonbase.moonbeam.network",
  family: ChainFamily.moonbeam,
  isEthereum: true,
  key: "moonbase-alpha",
  name: "Moonbase Alpha",
  relayChain: "moonbase-alpha-relay",
  xcm: {
    instructionWeight: new Weight(new BN("250000000"), new BN("10000")),
    network: "moonbase-alpha-relay",
  },
});

// eslint-disable-next-line import/no-default-export
export default { moonbaseAlpha, turingMoonbase };
