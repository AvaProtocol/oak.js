import BN from "bn.js";
import { Weight } from "./types/Weight";
import { createChain } from "./types/Chain";
import { MoonbaseTokens } from "../tokens";

const turingMoonbase = createChain({
	key: "turing-moonbase",
	name: "Moonbase Turing",
	assets: [{ asset: MoonbaseTokens.tur, isNative: true }],
	endpoint: "ws://167.99.226.24:8846",
	relayChain: "moonbase-alpha-relay",
	xcm: {
		network: "rococo",
		instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
	},
});

const moonbaseAlpha = createChain({
	key: "moonbase-alpha",
	name: "Moonbase Alpha",
	assets: [
		{ asset: MoonbaseTokens.dev, isNative: true },
		{ asset: MoonbaseTokens.tur, isNative: false },
	],
	endpoint: "wss://wss.api.moonbase.moonbeam.network",
	relayChain: "moonbase-alpha-relay",
	xcm: {
		network: "rococo",
		instructionWeight: new Weight(new BN("250000000"), new BN("10000")),
	},
});

export default { turingMoonbase, moonbaseAlpha };
