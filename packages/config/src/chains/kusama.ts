import BN from "bn.js";
import { Weight } from "./types/Weight";
import { createChain } from "./types/Chain";
import { KusamaTokens } from "../tokens";

const shiden = createChain({
	key: "shiden",
	assets: [{ asset: KusamaTokens.sdn, isNative: true }],
	endpoint: "wss://shiden-rpc.dwellir.com",
	relayChain: "kusama",
	xcm: {
		network: "kusama",
		instructionWeight: new Weight(new BN("1000000000"), new BN(64 * 1024)),
	},
});

const turing = createChain({
	key: "turing",
	assets: [
		{ asset: KusamaTokens.tur, isNative: true },
		{ asset: KusamaTokens.sdn, isNative: false },
		{ asset: KusamaTokens.movr, isNative: false },
		{ asset: KusamaTokens.mgx, isNative: false },
	],
	endpoint: "wss://rpc.turing.oak.tech",
	relayChain: "kusama",
	xcm: {
		network: "kusama",
		instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
	},
});

const mangata = createChain({
	key: "mangata",
	assets: [
		{ asset: KusamaTokens.mgx, isNative: true },
		{ asset: KusamaTokens.tur, isNative: false },
	],
	endpoint: "wss://kusama-rpc.mangata.online",
	relayChain: "kusama",
	xcm: {
		network: "kusama",
		instructionWeight: new Weight(new BN("150000000"), new BN("0")),
	},
});

const moonriver = createChain({
	key: "moonriver",
	assets: [
		{ asset: KusamaTokens.movr, isNative: true },
		{ asset: KusamaTokens.tur, isNative: false },
	],
	endpoint: "wss://wss.api.moonriver.moonbeam.network",
	relayChain: "kusama",
	xcm: {
		network: "kusama",
		instructionWeight: new Weight(new BN("250000000"), new BN("10000")),
	},
});

export default { turing, shiden, mangata, moonriver };
