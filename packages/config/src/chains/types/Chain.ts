import { XToken } from "../../tokens/types/XToken";
import { Token } from "../../tokens/types/Token";
import { Weight } from "./Weight";
import { RelayChainType } from "./RelayChainType";
import { XcmInstructionNetworkType } from "./XcmInstructionNetworkType";

interface XcmConfig {
  instructionNetworkType?: XcmInstructionNetworkType;
  instructionWeight: Weight;
  network: RelayChainType;
}

type AssetInfo = {
  asset: Token;
  isNative: boolean;
};

interface ChainConstructorParams {
  assets: XToken[];
  endpoint: string;
  isEthereum?: boolean;
  key: string;
  name: string;
  relayChain: RelayChainType;
  xcm: XcmConfig;
}

class Chain {
  readonly assets: XToken[];

  readonly endpoint: string;

  isEthereum: boolean;

  key: string;

  name: string | undefined;

  paraId: number | undefined;

  relayChain: RelayChainType;

  ss58Prefix: number | undefined;

  xcm: XcmConfig;

  constructor({
    assets,
    endpoint,
    isEthereum = false, // Set default value to false
    key,
    name,
    relayChain,
    xcm,
  }: ChainConstructorParams) {
    this.assets = assets;
    this.endpoint = endpoint;
    this.isEthereum = isEthereum;
    this.key = key;
    this.name = name;
    this.relayChain = relayChain;
    this.xcm = xcm;
  }
}

function createChain(config: {
  assets: AssetInfo[];
  endpoint: string;
  isEthereum?: boolean;
  key: string;
  name: string;
  relayChain: RelayChainType;
  xcm: XcmConfig;
}): Chain {
  const { assets, endpoint, isEthereum, key, name, relayChain, xcm } = config;
  return new Chain({
    assets: assets.map((asset) => new XToken(asset)),
    endpoint,
    isEthereum,
    key,
    name,
    relayChain,
    xcm,
  });
}

export { createChain };

export type { Chain, XcmConfig, ChainConstructorParams };
