import BN from "bn.js";
import { Chain, XToken, Weight } from "@oak-network/sdk-types";
import { assets } from "../tokens/assets";

// Shibuya
const sbyToken = new XToken({ asset: assets.sby, isNative: true });
const shibuyaTokens = [sbyToken];
export const shibuya = new Chain({
  key: "shibuya",
  assets: shibuyaTokens,
  defaultToken: sbyToken,
  endpoint: "ws://127.0.0.1:9948",
  relayChain: "local",
  xcm: {
    network: "rococo",
    instructionWeight: new Weight(new BN("1000000000"), new BN(64 * 1024)),
  },
});

// Rocstar
const rstrToken = new XToken({ asset: assets.rstr, isNative: true });
const rocstarTokens = [rstrToken];
export const rocstar = new Chain({
  key: "rocstar",
  assets: rocstarTokens,
  defaultToken: rstrToken,
  endpoint: "wss://rocstar.astar.network",
  relayChain: "rococo",
  xcm: {
    network: "rococo",
    instructionWeight: new Weight(new BN("1000000000"), new BN(64 * 1024)),
  },
});

// Shiden
const sdnToken = new XToken({ asset: assets.sdn, isNative: true });
const shidenTokens = [sdnToken];
export const shiden = new Chain({
  key: "shiden",
  assets: shidenTokens,
  defaultToken: sdnToken,
  endpoint: "wss://shiden-rpc.dwellir.com",
  relayChain: "kusama",
  xcm: {
    network: "kusama",
    instructionWeight: new Weight(new BN("1000000000"), new BN(64 * 1024)),
  },
});
