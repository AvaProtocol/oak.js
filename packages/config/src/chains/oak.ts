import BN from "bn.js";
import { Chain, XToken, Weight } from "@oak-network/sdk-types";
import { assets } from "../tokens/rococo";

// turing-local
const turToken = new XToken({ asset: assets.tur, isNative: true });
const moonbaseAlphaToken = new XToken({
  asset: assets.moonbaseAlpha,
  isNative: false,
});
const turingRococoTokens = [turToken, moonbaseAlphaToken];
export const turingLocal = new Chain({
  key: "turing-local",
  assets: turingRococoTokens,
  defaultToken: turToken,
  endpoint: "ws://127.0.0.1:9946",
  relayChain: "local",
  xcm: {
    network: "rococo",
    instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
  },
});

// turing-staging
export const turingStaging = new Chain({
  key: "turing-staging",
  assets: turingRococoTokens,
  defaultToken: turToken,
  endpoint: "wss://rpc.turing-staging.oak.tech",
  relayChain: "rococo",
  xcm: {
    network: "rococo",
    instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
  },
});

// turing-moonbase
export const turingMoonbase = new Chain({
  key: "turing-moonbase",
  assets: turingRococoTokens,
  defaultToken: turToken,
  endpoint: "ws://167.99.226.24:8846",
  relayChain: "moonbase-alpha-relay",
  xcm: {
    network: "rococo",
    instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
  },
});

// turing-kusama
const turingKusamaTokens = [turToken, moonbaseAlphaToken];
export const turing = new Chain({
  key: "turing",
  assets: turingKusamaTokens,
  defaultToken: turToken,
  endpoint: "wss://rpc.turing.oak.tech",
  relayChain: "kusama",
  xcm: {
    network: "kusama",
    instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
  },
});
