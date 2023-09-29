import { ChainAsset } from "./ChainAsset";
import { Weight, relayChainType } from "../types";

export interface ChainXcmInfo {
  network: relayChainType;
  instructionWeight: Weight;
}

export interface ChainConstructorParams {
  key: string;
  assets: ChainAsset[];
  defaultAsset: ChainAsset;
  endpoint: string;
  relayChain: relayChainType;
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

  relayChain: relayChainType;

  xcm: ChainXcmInfo;

  constructor({
    key,
    assets,
    defaultAsset,
    endpoint,
    relayChain,
    xcm,
  }: ChainConstructorParams) {
    (this.key = key), (this.assets = assets);
    this.defaultAsset = defaultAsset;
    this.endpoint = endpoint;
    this.relayChain = relayChain;
    this.xcm = xcm;
  }
}
