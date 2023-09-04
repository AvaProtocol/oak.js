import { ChainAsset } from './ChainAsset';
import { Weight, relayChainType } from '../types';

export interface ChainConstructorParams {
  key: string;
  assets: ChainAsset[];
  defaultAsset: ChainAsset;
  endpoint: string;
  relayChain: relayChainType;
  network: relayChainType;
  instructionWeight: Weight;
}

export class Chain {
  key: string;
  readonly assets: ChainAsset [];
  readonly defaultAsset: ChainAsset;
  readonly endpoint: string;
  readonly relayChain: string;
  readonly network: string;
  paraId: number | undefined;
  ss58Prefix: number | undefined;
  name: string | undefined;
  instructionWeight: Weight;

  constructor({key, assets, defaultAsset, endpoint, instructionWeight, relayChain, network }: ChainConstructorParams) {
    this.key = key,
    this.assets = assets;
    this.defaultAsset = defaultAsset;
    this.endpoint = endpoint;
    this.relayChain = relayChain;
    this.network = network;
    this.instructionWeight = instructionWeight;
  }
}
