import { XToken } from "../../tokens/types/XToken";
import { Token } from "../../tokens/types/Token";
import { Weight } from "./Weight";
import { RelayChainType } from "./RelayChainType";

interface XcmConfig {
	network: RelayChainType;
	instructionWeight: Weight;
}

type AssetInfo = {
	asset: Token;
	isNative: boolean;
};

interface ChainConstructorParams {
	key: string;
	name: string;
	assets: XToken[];
	endpoint: string;
	relayChain: RelayChainType;
	xcm: XcmConfig;
}

class Chain {
	key: string;
	readonly assets: XToken[];
	readonly endpoint: string;
	paraId: number | undefined;
	ss58Prefix: number | undefined;
	name: string | undefined;
	relayChain: RelayChainType;
	xcm: XcmConfig;

	constructor({ key, name, assets, endpoint, relayChain, xcm }: ChainConstructorParams) {
		this.key = key;
		this.name = name;
		this.assets = assets;
		this.endpoint = endpoint;
		this.relayChain = relayChain;
		this.xcm = xcm;
	}
}

function createChain(config: { key: string; name: string; assets: AssetInfo[]; endpoint: string; relayChain: RelayChainType; xcm: XcmConfig }): Chain {
	const { key, name, assets, endpoint, relayChain, xcm } = config;
	return new Chain({
		key,
		name,
		assets: assets.map((asset) => new XToken(asset)),
		endpoint,
		relayChain,
		xcm: xcm,
	});
}

export { createChain, Chain, XcmConfig, ChainConstructorParams };
