import BN from "bn.js";
import { Weight } from "./types/Weight";
import { createChain } from "./types/Chain";
import { DevTokens } from "../tokens";

const shibuya = createChain({
	key: "shibuya",
	assets: [{ asset: DevTokens.sby, isNative: true }],
	endpoint: "ws://127.0.0.1:9948",
	relayChain: "local",
	xcm: {
		network: "rococo",
        instructionWeight: new Weight(new BN("1000000000"), new BN(64 * 1024)),
	},
});

const turingLocal = createChain({
	key: "turing-local",
	assets: [
        { asset: DevTokens.tur, isNative: true },
        { asset: DevTokens.sby, isNative: false },
    ],
	endpoint: "ws://127.0.0.1:9946",
	relayChain: "local",
	xcm: {
		network: "rococo",
		instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
	},
});

const mangataLocal = createChain({
	key: "mangata-local",
	assets: [
        { asset: DevTokens.mgr, isNative: true },
        { asset: DevTokens.tur, isNative: false },
    ],
	endpoint: "ws://127.0.0.1:9947",
	relayChain: "local",
	xcm: {
		network: "rococo",
		instructionWeight: new Weight(new BN("150000000"), new BN("0")),
	},
});

const moonbaseLocal = createChain({
    key: "moonbase-local",
    assets: [{ asset: DevTokens.moonbaseLocal, isNative: true }],
    endpoint: "ws://127.0.0.1:9949",
    relayChain: "local",
    xcm: {
      network: "rococo",
      instructionWeight: new Weight(new BN("250000000"), new BN("10000")),
    },
  });

export default { turingLocal, shibuya, mangataLocal, moonbaseLocal };
