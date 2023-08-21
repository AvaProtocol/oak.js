import { Asset } from "../asset";

export interface ChainAssetConstructorParams {
  asset: Asset;
	isNative: boolean;
  contractAddress?: string | undefined;
  otherSymbol?: string | undefined;
  existentialDeposit?: number | undefined;
  unitPerSecond?: number | undefined;
}

export class ChainAsset extends Asset {
  id: any;
	isNative: boolean;
  contractAddress: string | undefined;
  otherSymbol: string | undefined;
  unitPerSecond: number | undefined;
  existentialDeposit: number | undefined;

  constructor({ asset, isNative, contractAddress, otherSymbol, unitPerSecond, existentialDeposit }: ChainAssetConstructorParams) {
    super(asset);
		this.isNative = isNative;
    this.contractAddress = contractAddress;
    this.otherSymbol = otherSymbol;
    this.unitPerSecond = unitPerSecond;
    this.existentialDeposit = existentialDeposit;
  }
}
