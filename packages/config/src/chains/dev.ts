import BN from "bn.js";
import { Weight } from "./types/Weight";
import { createChain } from "./types/Chain";
import { DevTokens } from "../tokens";

const shibuya = createChain({
  assets: [{ asset: DevTokens.sby, isNative: true }],
  endpoint: "ws://127.0.0.1:9948",
  isEthereum: true,
  key: "shibuya",
  name: "Shibuya",
  relayChain: "local",
  xcm: {
    instructionWeight: new Weight(new BN("1000000000"), new BN(64 * 1024)),
    network: "rococo",
  },
});

const turingLocal = createChain({
  assets: [
    { asset: DevTokens.tur, isNative: true },
    { asset: DevTokens.sby, isNative: false },
  ],
  endpoint: "ws://127.0.0.1:9946",
  key: "turing-local",
  name: "Turing Local",
  relayChain: "local",
  xcm: {
    instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
    network: "rococo",
  },
});

const mangataLocal = createChain({
  assets: [
    { asset: DevTokens.mgr, isNative: true },
    { asset: DevTokens.tur, isNative: false },
  ],
  endpoint: "ws://127.0.0.1:9947",
  key: "mangata-local",
  name: "Mangata Local",
  relayChain: "local",
  xcm: {
    instructionWeight: new Weight(new BN("150000000"), new BN("0")),
    network: "rococo",
  },
});

const moonbaseLocal = createChain({
  assets: [{ asset: DevTokens.moonbaseLocal, isNative: true }],
  endpoint: "ws://127.0.0.1:9949",
  isEthereum: true,
  key: "moonbase-local",
  name: "Moonbase Local",
  relayChain: "local",
  xcm: {
    instructionWeight: new Weight(new BN("250000000"), new BN("10000")),
    network: "rococo",
  },
});

// eslint-disable-next-line import/no-default-export
export default { mangataLocal, moonbaseLocal, shibuya, turingLocal };
