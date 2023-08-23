import _ from 'lodash';
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { HexString } from '@polkadot/util/types';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { u32, Option } from '@polkadot/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import { rpc, types, runtime } from '@oak-network/types';
import { Chain as ChainConfig, Weight } from '@oak-network/sdk-types';
import { Chain, ChainProvider } from './chainProvider';
import { getProxyAccount } from '../util';

// OakChain implements Chain
export class OakChain extends Chain {
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

  async transfer(destination: Chain, assetLocation: any, assetAmount: BN) {
    // TODO
    // this.api.tx.xtokens.transfer(destination, assetLocation, assetAmount);
  }

  async scheduleXcmpTask(schedule: any, encodedCall: HexString, encodedCallWeight: Weight, overallWeight: Weight, scheduleFee: BN, executionFee: BN) {
    // TODO
    // const extrinsic = this.api.tx.automationTime.scheduleXcmpTask(schedule, encodedCall, encodedCallWeight, overallWeight, scheduleFee, executionFee);
    // extrinsic.signAndSend('');
  }

  getDeriveAccount(address: string, paraId: number, options: any): string {
    const api = this.getApi();
    const { accountId32 } = getProxyAccount(api, paraId, address, options);
    return accountId32;
  };
}

export class OakProvider extends ChainProvider {
  constructor(config: ChainConfig) {
    const chain = new OakChain(config);
    super(chain, undefined);
  }
}
