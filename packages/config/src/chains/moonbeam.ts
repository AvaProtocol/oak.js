import BN from "bn.js";
import { Chain, XToken, Weight } from "@oak-network/sdk-types";
import { assets } from "../tokens/assets";

const moonbaseAlphaToken = new XToken({
  asset: assets.moonbaseAlpha,
  isNative: true,
});
const moonbaseTokens = [moonbaseAlphaToken];

// moonbase-local
export const moonbaseLocal = new Chain({
  key: "moonbase-local",
  assets: moonbaseTokens,
  defaultToken: moonbaseAlphaToken,
  endpoint: "ws://127.0.0.1:9949",
  relayChain: "local",
  xcm: {
    network: "rococo",
    instructionWeight: new Weight(new BN("250000000"), new BN("10000")),
  },
});

// moonbase-alpha
export const moonbaseAlpha = new Chain({
  key: "moonbase-alpha",
  assets: moonbaseTokens,
  defaultToken: moonbaseAlphaToken,
  endpoint: "wss://wss.api.moonbase.moonbeam.network",
  relayChain: "moonbase-alpha-relay",
  xcm: {
    network: "rococo",
    instructionWeight: new Weight(new BN("250000000"), new BN("10000")),
  },
});

// moonriver
export const moonriver = new Chain({
  key: "moonriver",
  assets: moonbaseTokens,
  defaultToken: moonbaseAlphaToken,
  endpoint: "wss://wss.api.moonriver.moonbeam.network",
  relayChain: "kusama",
  xcm: {
    network: "kusama",
    instructionWeight: new Weight(new BN("250000000"), new BN("10000")),
  },
});
