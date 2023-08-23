import _ from 'lodash';
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type { u64, u128, Option } from '@polkadot/types';
import type { HexString } from '@polkadot/util/types';
import { Asset, ChainAsset, Chain as ChainConfig, Weight } from '@oak-network/sdk-types';
import { Chain, ChainProvider, TaskRegister } from './chainProvider';
import { sendExtrinsic } from '../util';
import { SendExtrinsicResult } from '../types';

// MoonbeamChain implements Chain, TaskRegister interface
export class MoonbeamChain extends Chain implements TaskRegister {
  api: ApiPromise | undefined;

  async initialize() {
    const api = await ApiPromise.create({
      provider: new WsProvider(this.chainData.endpoint),
    });

    this.api = api;
    await this.updateChainData();
    await this.updateAssets();
  }
  
  async destroy() {
    await this.getApi().disconnect();
    this.api = undefined;
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
      this.chainData.assets.push(chainAsset);
    })
  }

  async getExtrinsicWeight(sender: string, extrinsic: SubmittableExtrinsic<'promise'>): Promise<Weight> {
    const { refTime, proofSize } = (await extrinsic.paymentInfo(sender)).weight as unknown as WeightV2;
    return new Weight(new BN(refTime.unwrap()), new BN(proofSize.unwrap()));
  }

  async getXcmWeight(sender: string, extrinsic: SubmittableExtrinsic<'promise'>): Promise<{ encodedCallWeight: Weight; overallWeight: Weight; }> {
    const { instructionWeight } = this.chainData;
    if (!instructionWeight) throw new Error("chainData.instructionWeight not set");
    const encodedCallWeight = await this.getExtrinsicWeight(sender, extrinsic);
    const overallWeight = encodedCallWeight.add(instructionWeight.muln(4));
    return { encodedCallWeight, overallWeight };
  }

  async weightToFee(weight: Weight, assetLocation: any): Promise<BN> {
    const { defaultAsset } = this.chainData;
    if (!defaultAsset) throw new Error("chainData.defaultAsset not set");
    const api = this.getApi();
    if (_.isEqual(defaultAsset.location, assetLocation)) {
      const fee = await api.call.transactionPaymentApi.queryWeightToFee(weight) as u64;
      return fee;
    } else {
      const storageValue = await api.query.assetManager.assetTypeUnitsPerSecond({ Xcm: assetLocation });
      const item = storageValue as unknown as Option<any>;
      if (item.isNone) throw new Error("AssetTypeUnitsPerSecond not initialized");
      const unitsPerSecond = item.unwrap() as u128;
      return weight.refTime.mul(unitsPerSecond).div(new BN(10 ** 12));
    }
  }

  async transfer(destination: Chain, assetLocation: any, assetAmount: BN) {
    // TODO
    // this.api.tx.xtokens.transfer(destination, assetLocation, assetAmount);
  }

  async scheduleTaskThroughXcm(destination: any, encodedCall: HexString, feeLocation: any, feeAmount: BN, encodedCallWeight: Weight, overallWeight: Weight, deriveAccount: string, keyPair: any): Promise<SendExtrinsicResult> {
    const api = this.getApi();
    const { key } = this.chainData;
    if (!key) throw new Error('chainData.key not set');

    const { defaultAsset } = this.chainData;
    if (!defaultAsset) throw new Error("chainData.defaultAsset not set");
    const currency = _.isEqual(feeLocation, defaultAsset.location)
      ? { AsCurrencyId: 'SelfReserve' }
      : { AsMultiLocation: { V3: feeLocation } };
    const extrinsic = this.getApi().tx.xcmTransactor.transactThroughSigned(
      { V3: destination },
      { currency, feeAmount },
      encodedCall,
      { transactRequiredWeightAtMost: encodedCallWeight, overallWeight },
    );

    console.log(`Send extrinsic to ${key} to schedule task. extrinsic:`, extrinsic.method.toHex());
    const result = await sendExtrinsic(api, extrinsic, keyPair);
    return result;
  }

  public getDeriveAccount(accountId: string, paraId: number, options: any): string {
    throw new Error('Method not implemented.');
  }
}

export class MoonbeamProvider extends ChainProvider {
  constructor(config: ChainConfig) {
    const chain = new MoonbeamChain(config);
    super(chain, chain);
  }
}
