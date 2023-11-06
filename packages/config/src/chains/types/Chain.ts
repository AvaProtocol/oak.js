import { XToken } from "../../tokens/types/XToken";
import { Weight } from "./Weight";
import { RelayChainType } from "./RelayChainType";

interface XcmConfig {
	network: RelayChainType;
	instructionWeight: Weight;
}

interface ChainConstructorParams {
	key: string;
	assets: XToken[];
	defaultToken: XToken;
	endpoint: string;
	relayChain: RelayChainType;
	xcm: XcmConfig;
}

class Chain {
	key: string;
	readonly assets: XToken[];
	readonly defaultToken: XToken;
	readonly endpoint: string;
	paraId: number | undefined;
	ss58Prefix: number | undefined;
	name: string | undefined;
	relayChain: RelayChainType;
	xcm: XcmConfig;

	constructor({ key, assets, defaultToken, endpoint, relayChain, xcm }: ChainConstructorParams) {
		this.key = key;
		this.assets = assets;
		this.defaultToken = defaultToken;
		this.endpoint = endpoint;
		this.relayChain = relayChain;
		this.xcm = xcm;
	}
}

function createChain(config: {
	key: string;
	assets: XToken[];
	defaultToken: XToken;
	endpoint: string;
	relayChain: RelayChainType;
	xcm: XcmConfig;
}): Chain {
	const { key, assets, defaultToken, endpoint, relayChain, xcm } = config;
	return new Chain({
		key,
		assets,
		defaultToken,
		endpoint,
		relayChain,
		xcm: xcm,
	});
}

export { createChain, Chain, XcmConfig, ChainConstructorParams };
