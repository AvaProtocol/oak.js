import BN from "bn.js";
import { Weight } from "./types/Weight";
import { createChain } from "./types/Chain";
import { XToken } from "../tokens/types/XToken";
import { KusamaTokens } from "../tokens";

const shidenTokens = [{ asset: KusamaTokens.sdn, isNative: true }].map((data) => new XToken(data));

const shiden = createChain({
	key: "shiden",
	assets: shidenTokens,
	defaultToken: shidenTokens[0],
	endpoint: "wss://shiden-rpc.dwellir.com",
	relayChain: "kusama",
	xcm: {
		network: "kusama",
		instructionWeight: new Weight(new BN("1000000000"), new BN(64 * 1024)),
	},
});

const turingTokens = [
	{ asset: KusamaTokens.tur, isNative: true },
	{ asset: KusamaTokens.sdn, isNative: false },
].map((data) => new XToken(data));

const turing = createChain({
	key: "turing",
	assets: turingTokens,
	defaultToken: turingTokens[0],
	endpoint: "wss://rpc.turing.oak.tech",
	relayChain: "kusama",
	xcm: {
		network: "kusama",
		instructionWeight: new Weight(new BN("1000000000"), new BN(0)),
	},
});

export { turing, shiden };
