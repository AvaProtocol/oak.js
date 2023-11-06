import BN from "bn.js";
import { Weight } from "./types/Weight";
import { createChain } from "./types/Chain";
import { XToken } from "../tokens/types/XToken";
import { RococoTokens } from "../tokens";

const rocstarTokens = [{ asset: RococoTokens.rstr, isNative: true }].map((data) => new XToken(data));

const rocstar = createChain({
	key: "rocstar",
	assets: rocstarTokens,
	defaultToken: rocstarTokens[0],
	endpoint: "wss://rocstar.astar.network",
	relayChain: "rococo",
	xcm: {
		network: "rococo",
		instructionWeight: new Weight(new BN("1000000000"), new BN(64 * 1024)),
	},
});

const turingTokens = [
	{ asset: RococoTokens.tur, isNative: true },
	{ asset: RococoTokens.rstr, isNative: false },
].map((data) => new XToken(data));

const turingStaging = createChain({
	key: "turing",
	assets: turingTokens,
	defaultToken: turingTokens[0],
	endpoint: "wss://rpc.turing-staging.oak.tech",
	relayChain: "rococo",
	xcm: {
		network: "rococo",
		instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
	},
});

export { turingStaging, rocstar };
