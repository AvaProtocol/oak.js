import { ChainAsset } from './ChainAsset';
import { Weight, relayChainType } from '../types';

export interface ChainConstructorParams {
  key: string;
  assets: ChainAsset[];
  defaultAsset: ChainAsset;
  endpoint: string;
  relayChain: relayChainType;
  instructionWeight: Weight;
}

export class Chain {
  key: string;
  readonly assets: ChainAsset [];
  readonly defaultAsset: ChainAsset;
  readonly endpoint: string;
  readonly relayChain: string;
  paraId: number | undefined;
  ss58: number | undefined;
  name: string | undefined;
  instructionWeight: Weight;

  constructor({key, assets, defaultAsset, endpoint, instructionWeight, relayChain }: ChainConstructorParams) {
    this.key = key,
    this.assets = assets;
    this.defaultAsset = defaultAsset;
    this.endpoint = endpoint;
    this.relayChain = relayChain;
    this.instructionWeight = instructionWeight;
  }
}
