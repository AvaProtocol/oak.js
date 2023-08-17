export interface AssetConstructorParams {
  key: string;
  symbol: string;
  location: any;
}

export class Asset {
  key: string;

  readonly symbol: string;

  readonly location: any;

  constructor({ key, symbol, location }: AssetConstructorParams) {
    this.key = key;
    this.symbol = symbol;
    this.location = location;
  }

  isEqual(asset: Asset): boolean {
    return this.key === asset.key && this.symbol === asset.symbol;
  }
}
