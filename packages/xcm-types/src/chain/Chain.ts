import { ChainAsset } from './ChainAsset';
import { Weight } from '../types';

export interface ChainConstructorParams {
  assets: ChainAsset[];
	defaultAsset: ChainAsset;
  endpoint: string;
	instructionWeight: Weight;
}

export class Chain {
  readonly assets: ChainAsset [];
	readonly defaultAsset: ChainAsset;
	readonly endpoint: string;
	instructionWeight: Weight;

	constructor({assets, defaultAsset, endpoint, instructionWeight }: ChainConstructorParams) {
		this.assets = assets;
		this.defaultAsset = defaultAsset;
		this.endpoint = endpoint;
		this.instructionWeight = instructionWeight;
	}
}
