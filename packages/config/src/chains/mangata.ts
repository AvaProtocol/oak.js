import BN from "bn.js";
import { Chain, XToken, Weight } from "@oak-network/sdk-types";
import { assets } from "../tokens/assets";

// mangata-local
const mgrToken = new XToken({ asset: assets.mgr, isNative: true });
const mangataRococoTokens = [mgrToken];
export const mangataLocal = new Chain({
  key: "mangata-local",
  assets: mangataRococoTokens,
  defaultToken: mgrToken,
  endpoint: "ws://127.0.0.1:9947",
  relayChain: "local",
  xcm: {
    network: "rococo",
    instructionWeight: new Weight(new BN("150000000"), new BN("0")),
  },
});

// mangata-rococo
export const mangataRococo = new Chain({
  key: "mangata-rococo",
  assets: mangataRococoTokens,
  defaultToken: mgrToken,
  endpoint: "wss://collator-01-ws-rococo.mangata.online",
  relayChain: "rococo",
  xcm: {
    network: "rococo",
    instructionWeight: new Weight(new BN("150000000"), new BN("0")),
  },
});

// mangata-kusama
const mgxToken = new XToken({ asset: assets.mgx, isNative: true });
const mangataKusamaTokens = [mgxToken];
export const mangataKusama = new Chain({
  key: "mangata-kusama",
  assets: mangataKusamaTokens,
  defaultToken: mgxToken,
  endpoint: "wss://kusama-rpc.mangata.online",
  relayChain: "kusama",
  xcm: {
    network: "kusama",
    instructionWeight: new Weight(new BN("150000000"), new BN("0")),
  },
});
