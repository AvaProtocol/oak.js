import _ from 'lodash';
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { Asset, ChainAsset, Chain as ChainConfig, TransactInfo, Weight } from '@oak-foundation/xcm-types';
import { Chain, TaskRegister } from './chainProvider';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type { u64, u128, Option } from '@polkadot/types';

function keysToLowerCase(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('Input is not an object');
  }

  const newObj: any = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null) {
        newObj[key.toLowerCase()] = keysToLowerCase(value);
      } else {
        newObj[key.toLowerCase()] = value;
      }
    }
  }

  return newObj;
}

// MoonbeamChain implements Chain, TaskRegister interface
export class MoonbeamChain extends Chain implements TaskRegister {
  readonly config: ChainConfig;
  api: ApiPromise | undefined;

  constructor(config: ChainConfig) {
    super(config.assets, config.defaultAsset, config.instructionWeight);
    this.config = config;
  }

  async initialize() {
    const api = await ApiPromise.create({
			provider: new WsProvider(this.config.endpoint),
		});

		this.api = api;
    await this.updateAssets();
  }

  public getApi(): ApiPromise {
    if (!this.api) throw new Error("Api not initialized");
    return this.api;
  }

  async getAssetManagerItems(): Promise<any[]> {
    const entries = await this.api?.query.assetManager.assetIdType.entries();
    const items: any[] = [];
    _.each(entries, ([storageKey, storageValue]) => {
      const key = storageKey.args[0] as unknown as u128;
      const item = storageValue as unknown as Option<any>;
      if (item.isSome) {
        const value = item.unwrap().toJSON();
        items.push({ key, value });
      }
    });
    return items;
  }

  async getAssets(): Promise<any[]> {
    const entries = await this.api?.query.assets.metadata.entries();
    const items: any[] = [];
    _.each(entries, ([storageKey, storageValue]) => {
      const key = storageKey.args[0] as unknown as u128;
      const value = storageValue.toJSON();
      items.push({ key, value });
    });
    return items;
  }

  async updateAssets() {
    const assets = await this.getAssets();
    const assetManagerItems = await this.getAssetManagerItems();
    _.each(assets, ({ key, value }) => {
      const item =  _.find(assetManagerItems, { key });
      const { value: { xcm: location } } = item;
      const { name, symbol, decimals } = value;
      const asset = new Asset({ key: name, symbol, decimals, location });
      const chainAsset = new ChainAsset({ asset, isNative: false });
      this.assets.push(chainAsset);
    })
  }

  async getExtrinsicWeight(sender: string, extrinsic: SubmittableExtrinsic<'promise'>): Promise<Weight> {
		const { refTime, proofSize: proofSize } = (await extrinsic.paymentInfo(sender)).weight as unknown as WeightV2;
		return new Weight(new BN(refTime.unwrap()), new BN(proofSize.unwrap()));
  }

  async getXcmWeight(sender: string, extrinsic: SubmittableExtrinsic<'promise'>): Promise<{ extrinsicWeight: Weight; overallWeight: Weight; }> {
    const extrinsicWeight = await this.getExtrinsicWeight(sender, extrinsic);
    const overallWeight = extrinsicWeight.add(this.config.instructionWeight.muln(4));
    return { extrinsicWeight, overallWeight };
  }

  async weightToFee(weight: Weight, assetLocation: any): Promise<BN> {
    if (!this.api) {
      throw new Error("Api not initialized");
    }
    if (_.isEqual(this.defaultAsset.location, assetLocation)) {
      const fee = await this.api.call.transactionPaymentApi.queryWeightToFee(weight) as u64;
			return fee;
    } else {
      const storageValue = await this.api?.query.assetManager.assetTypeUnitsPerSecond({ Xcm: assetLocation });
      const item = storageValue as unknown as Option<any>;
      if (item.isNone) {
        throw new Error("AssetTypeUnitsPerSecond not initialized");
      }
      const unitsPerSecond = item.unwrap() as u128;
      return weight.refTime.mul(unitsPerSecond).div(new BN(10 * 12));
    }
  }

  async transfer(destination: Chain, assetLocation: any, assetAmount: BN) {
    if (!this.api) {
      throw new Error("Api not initialized");
    }
    this.api.tx.xtokens.transfer(destination, assetLocation, assetAmount);
  }

  transact(transactInfo: TransactInfo) {
    if (!this.api) {
      throw new Error("Api not initialized");
    }
    const { encodedCall, encodedCallWeight, overallWeight, fee } = transactInfo;
    this.api.tx.xcmTransactor.transactThroughSigned(encodedCall, encodedCallWeight,overallWeight, fee);
  }

  // transfer(api: polkadotApi, destination, asset: Asset, assetAmount: BN): hash {
  //   // TODO
  // }
}
