import { Asset } from "../asset";

export interface ChainAssetConstructorParams {
  asset: Asset;
	isNative: boolean;
}

export class ChainAsset extends Asset {
  id: any;
	isNative: boolean;

  constructor({ asset, isNative }: ChainAssetConstructorParams) {
    super(asset);
		this.isNative = isNative;
  }
}
