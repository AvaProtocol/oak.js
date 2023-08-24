import _ from 'lodash';
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { HexString } from '@polkadot/util/types';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { u32, Option } from '@polkadot/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import { rpc, types, runtime } from '@oak-network/types';
import { Weight } from '@oak-network/sdk-types';
import { ChainAdapter } from './chainAdapter';
import { getDeriveAccount, sendExtrinsic } from '../util';
import { SendExtrinsicResult } from '../types';

// OakAdapter implements ChainAdapter
export class OakAdapter extends ChainAdapter {
  api: ApiPromise | undefined;

  async initialize() {
    const api = await ApiPromise.create({
      provider: new WsProvider(this.chainData.endpoint), rpc, types, runtime,
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
    const overallWeight = encodedCallWeight.add(instructionWeight.muln(6));
    return { encodedCallWeight, overallWeight };
  }

  async weightToFee(weight: Weight, assetLocation: any): Promise<BN> {
    const { defaultAsset } = this.chainData;
    if (!defaultAsset) throw new Error("chainData.defaultAsset not set");

    const api = this.getApi();
    const location = _.isEqual(assetLocation, defaultAsset.location)
      ? { parents: 0, interior: 'Here' } : assetLocation;
    const storageValue = await api.query.assetRegistry.locationToAssetId(location);
    const item = storageValue as unknown as Option<u32>;
    if (item.isNone) throw new Error("AssetId not set");

    const assetId = item.unwrap();
    const metadataStorageValue = await api.query.assetRegistry.metadata(assetId);
    const metadataItem = metadataStorageValue as unknown as Option<any>;
    if (metadataItem.isNone) throw new Error("Metadata not set");

    const { additional } = metadataItem.unwrap().toHuman() as any;
    const feePerSecond = additional.feePerSecond.replace(/,/g, '');

    return weight.refTime.mul(new BN(feePerSecond)).div(new BN(10 ** 12));
  }

  async transfer(destination: ChainAdapter, assetLocation: any, assetAmount: BN) {
    throw new Error('Method not implemented.');
  }

  async scheduleXcmpTask(schedule: any, destination: any, scheduleFee: any, executionFee: any, encodedCall: HexString, encodedCallWeight: Weight, overallWeight: Weight, keyPair: any) : Promise<SendExtrinsicResult> {
    const api = this.getApi();
    const { key } = this.chainData;
    if (!key) throw new Error('chainData.key not set');

    const extrinsic = api.tx.automationTime.scheduleXcmpTask(
      schedule,
      destination,
      scheduleFee,
      executionFee,
      encodedCall,
      encodedCallWeight,
      overallWeight,
    );
  
    console.log(`Send extrinsic to ${key} to schedule task. extrinsic:`, extrinsic.method.toHex());
    const result = await sendExtrinsic(api, extrinsic, keyPair);
    return result;
  }

  getDeriveAccount(accountId: HexString, paraId: number): HexString {
    const api = this.getApi();
    return getDeriveAccount(api, accountId, paraId);
  };
}

