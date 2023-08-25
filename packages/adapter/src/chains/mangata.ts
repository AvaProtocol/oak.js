import _ from 'lodash';
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { u32, u64, Option } from '@polkadot/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type { HexString } from '@polkadot/util/types';
import { Weight } from '@oak-network/sdk-types';
import { ChainAdapter } from './chainAdapter';
import { getDeriveAccount } from '../util';
import { WEIGHT_REF_TIME_PER_SECOND } from '../constants';

// MangataAdapter implements ChainAdapter
export class MangataAdapter extends ChainAdapter {
  api: ApiPromise | undefined;

  async initialize() {
    const api = await ApiPromise.create({
      provider: new WsProvider(this.chainData.endpoint),
    });

    this.api = api;
    await this.updateChainData();
  }

  async destroy() {
    await this.getApi().disconnect();
    this.api = undefined;
  }

  public getApi(): ApiPromise {
    if (!this.api) throw new Error("Api not initialized");
    return this.api;
  }

  async getExtrinsicWeight(sender: string, extrinsic: SubmittableExtrinsic<'promise'>): Promise<Weight> {
    const { refTime, proofSize } = (await extrinsic.paymentInfo(sender)).weight as unknown as WeightV2;
    return new Weight(new BN(refTime.unwrap()), new BN(proofSize.unwrap()));
  }

  async getXcmWeight(sender: string, extrinsic: SubmittableExtrinsic<'promise'>): Promise<{ encodedCallWeight: Weight; overallWeight: Weight; }> {
    const { instructionWeight } = this.chainData;
    if (!instructionWeight) throw new Error("chainData.instructionWeight not set");
    const encodedCallWeight = await this.getExtrinsicWeight(sender, extrinsic);
    const overallWeight = encodedCallWeight.add(instructionWeight?.muln(6));
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
      const storageValue = await api.query.assetRegistry.locationToAssetId(assetLocation);
      const item = storageValue as unknown as Option<u32>;
      if (item.isNone) throw new Error("AssetTypeUnitsPerSecond not initialized");

      const assetId = item.unwrap();
      const metadataStorageValue = await api.query.assetRegistry.metadata(assetId);
      const metadataItem = metadataStorageValue as unknown as Option<any>;
      if (metadataItem.isNone) throw new Error("Metadata not initialized");

      const { additional } = metadataItem.unwrap().toJSON() as any;
      const { xcm: { feePerSecond } } = additional;
      
      return weight.refTime.mul(new BN(feePerSecond)).div(WEIGHT_REF_TIME_PER_SECOND);
    }
  }

  getDeriveAccount(accountId: HexString, paraId: number, options?: any): HexString {
    const api = this.getApi();
    return getDeriveAccount(api, accountId, paraId);
  }

  public transfer(destination: ChainAdapter, assetLocation: any, assetAmount: BN): void {
    throw new Error('Method not implemented.');
  }
}
