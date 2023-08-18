import { Asset } from "../asset";

export interface ChainAssetConstructorParams {
  asset: Asset;
	isNative: boolean;
}

export class ChainAsset extends Asset {
	isNative: boolean;

  constructor({ asset, isNative }: ChainAssetConstructorParams) {
    super(asset);
		this.isNative = isNative;
  }
}
