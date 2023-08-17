import { Asset } from '../asset';

export class Chain {

  readonly assets: Asset [];

	constructor(assets: Asset []) {
		this.assets = assets;
	}
}
