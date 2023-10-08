import { ChainAsset } from "./ChainAsset";
import { Weight, RelayChainType } from "../types";

export interface ChainXcmInfo {
  network: RelayChainType;
  instructionWeight: Weight;
}

export interface ChainConstructorParams {
  key: string;
  assets: ChainAsset[];
  defaultAsset: ChainAsset;
  endpoint: string;
  relayChain: RelayChainType;
  xcm: ChainXcmInfo;
}

export class Chain {
  key: string;

  readonly assets: ChainAsset[];

  readonly defaultAsset: ChainAsset;

  readonly endpoint: string;

  paraId: number | undefined;

  ss58Prefix: number | undefined;

  name: string | undefined;

  relayChain: RelayChainType;

  xcm: ChainXcmInfo;

  constructor({
    key,
    assets,
    defaultAsset,
    endpoint,
    relayChain,
    xcm,
  }: ChainConstructorParams) {
    this.key = key;
    this.assets = assets;
    this.defaultAsset = defaultAsset;
    this.endpoint = endpoint;
    this.relayChain = relayChain;
    this.xcm = xcm;
  }
}
