import BN from "bn.js";
import { Weight } from "./types/Weight";
import { createChain } from "./types/Chain";
import { RococoTokens } from "../tokens";

const rocstar = createChain({
  assets: [{ asset: RococoTokens.rstr, isNative: true }],
  endpoint: "wss://rocstar.astar.network",
  isEthereum: true,
  key: "rocstar",
  name: "Rocstar",
  relayChain: "rococo",
  xcm: {
    instructionWeight: new Weight(new BN("1000000000"), new BN(64 * 1024)),
    network: "rococo",
  },
});

const mangataRococo = createChain({
  assets: [
    { asset: RococoTokens.mgr, isNative: true },
    { asset: RococoTokens.tur, id: "7", isNative: false },
  ],
  endpoint: "wss://collator-01-ws-rococo.mangata.online",
  key: "mangata-rococo",
  name: "Mangata Rococo",
  relayChain: "rococo",
  xcm: {
    instructionWeight: new Weight(new BN("150000000"), new BN("0")),
    network: "rococo",
  },
});

const turingStaging = createChain({
  assets: [
    { asset: RococoTokens.tur, id: "0", isNative: true },
    { asset: RococoTokens.rstr, id: "9", isNative: false },
  ],
  endpoint: "wss://rpc.turing-staging.oak.tech",
  key: "turing-staging",
  name: "Turing Staging",
  relayChain: "rococo",
  xcm: {
    instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
    network: "rococo",
  },
});

// eslint-disable-next-line import/no-default-export
export default { mangataRococo, rocstar, turingStaging };
