export interface AssetConstructorParams {
  key: string;
  symbol: string;
  decimals: number;
  location: any;
}

export class Asset {
  key: string;
  symbol: string;
  decimals: number;
  location: any;

  constructor({ key, symbol, decimals, location }: AssetConstructorParams) {
    this.key = key;
    this.symbol = symbol;
    this.decimals = decimals;
    this.location = location;
  }
}
