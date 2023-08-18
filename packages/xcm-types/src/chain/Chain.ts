import { ChainAsset } from './ChainAsset';
import { Weight } from '../types';

export interface ChainConstructorParams {
  assets: ChainAsset[];
  endpoint: string;
	instructionWeight: Weight;
}

export class Chain {
  readonly assets: ChainAsset [];
	readonly endpoint: string;
	instructionWeight: Weight;

	constructor({assets, endpoint, instructionWeight }: ChainConstructorParams) {
		this.assets = assets;
		this.endpoint = endpoint;
		this.instructionWeight = instructionWeight;
	}
}
