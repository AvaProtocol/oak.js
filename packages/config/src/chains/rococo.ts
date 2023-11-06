import BN from "bn.js";
import { Weight } from "./types/Weight";
import { createChain } from "./types/Chain";
import { RococoTokens } from "../tokens";

const rocstar = createChain({
	key: "rocstar",
	assets: [{ asset: RococoTokens.rstr, isNative: true }],
	endpoint: "wss://rocstar.astar.network",
	relayChain: "rococo",
	xcm: {
		network: "rococo",
		instructionWeight: new Weight(new BN("1000000000"), new BN(64 * 1024)),
	},
});

const mangataRococo = createChain({
	key: "mangata-rococo",
	assets: [{ asset: RococoTokens.mgr, isNative: true }, { asset: RococoTokens.tur, isNative: false }],
	endpoint: "wss://collator-01-ws-rococo.mangata.online",
	relayChain: "rococo",
	xcm: {
	  network: "rococo",
	  instructionWeight: new Weight(new BN("150000000"), new BN("0")),
	},
  });
  

const turingStaging = createChain({
	key: "turing",
	assets: [
		{ asset: RococoTokens.tur, isNative: true },
		{ asset: RococoTokens.rstr, isNative: false },
	],
	endpoint: "wss://rpc.turing-staging.oak.tech",
	relayChain: "rococo",
	xcm: {
		network: "rococo",
		instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
	},
});

export default { mangataRococo, turingStaging, rocstar };
