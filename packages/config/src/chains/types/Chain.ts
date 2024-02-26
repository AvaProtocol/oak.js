import { XToken } from "../../tokens/types/XToken";
import { Token } from "../../tokens/types/Token";
import { Weight } from "./Weight";
import { RelayChainType } from "./RelayChainType";
import { XcmInstructionNetworkType } from "./XcmInstructionNetworkType";

enum ChainFamily {
  oak = "oak",
  moonbeam = "moonbeam",
  astar = "astar",
  mangata = "mangata",
}

interface XcmConfig {
  instructionNetworkType?: XcmInstructionNetworkType;
  instructionWeight: Weight;
  network: RelayChainType;
}

type AssetInfo = {
  asset: Token;
  isNative: boolean;
  id?: string;
  contractAddress?: string;
};

interface ChainConstructorParams {
  assets: XToken[];
  endpoint: string;
  isEthereum?: boolean;
  key: string;
  family: ChainFamily;
  name: string;
  relayChain: RelayChainType;
  xcm: XcmConfig;
}

class Chain {
  readonly assets: XToken[];

  readonly endpoint: string;

  isEthereum: boolean;

  key: string;

  family: ChainFamily;

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
    family,
    name,
    relayChain,
    xcm,
  }: ChainConstructorParams) {
    this.assets = assets;
    this.endpoint = endpoint;
    this.isEthereum = isEthereum;
    this.key = key;
    this.family = family;
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
  family: ChainFamily;
  name: string;
  relayChain: RelayChainType;
  xcm: XcmConfig;
}): Chain {
  const { assets, endpoint, isEthereum, key, family, name, relayChain, xcm } = config;
  return new Chain({
    assets: assets.map((asset) => new XToken(asset)),
    endpoint,
    family,
    isEthereum,
    key,
    name,
    relayChain,
    xcm,
  });
}

export { ChainFamily, createChain };

export type { Chain, XcmConfig, ChainConstructorParams };
