import _ from 'lodash';
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { HexString } from '@polkadot/util/types';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { rpc, types, runtime } from '@oak-network/types';
import { Chain as ChainConfig, Weight } from '@oak-network/xcm-types';
import { Chain, ChainProvider } from './chainProvider';
import type { u32, Option } from '@polkadot/types';
import type { WeightV2 } from '@polkadot/types/interfaces';

// OakChain implements Chain
export class OakChain extends Chain {
  readonly config: ChainConfig;
  api: ApiPromise | undefined;

  constructor(config: ChainConfig) {
    super(config.assets, config.defaultAsset, config.instructionWeight);
    this.config = config;
  }

  async initialize() {
    const api = await ApiPromise.create({
			provider: new WsProvider(this.config.endpoint), rpc, types, runtime,
		});

		this.api = api;
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
    const { refTime, proofSize: proofSize } = (await extrinsic.paymentInfo(sender)).weight as unknown as WeightV2;
		return new Weight(new BN(refTime.unwrap()), new BN(proofSize.unwrap()));
  }

  async getXcmWeight(sender: string, extrinsic: SubmittableExtrinsic<'promise'>): Promise<{ extrinsicWeight: Weight; overallWeight: Weight; }> {
    const extrinsicWeight = await this.getExtrinsicWeight(sender, extrinsic);
    const overallWeight = extrinsicWeight.add(this.config.instructionWeight.muln(6));
    return { extrinsicWeight, overallWeight };
  }

  async weightToFee(weight: Weight, assetLocation: any): Promise<BN> {
		if (!this.api) {
      throw new Error("Api not initialized");
    }
    const location = _.isEqual(assetLocation, this.defaultAsset.location)
      ? { parents: 0, interior: 'Here' } : assetLocation;
		const storageValue = await this.api.query.assetRegistry.locationToAssetId(location);
		const item = storageValue as unknown as Option<u32>;
		if (item.isNone) {
			throw new Error("AssetTypeUnitsPerSecond not initialized");
		}
		const assetId = item.unwrap();
		const metadataStorageValue = await this.api.query.assetRegistry.metadata(assetId);
		const metadataItem = metadataStorageValue as unknown as Option<any>;
		if (metadataItem.isNone) {
			throw new Error("Metadata not initialized");
		}

    const { additional } = metadataItem.unwrap().toJSON() as any;
    const { feePerSecond } = additional;
		
		return weight.refTime.mul(new BN(feePerSecond)).div(new BN(10 * 12));
  }

  async transfer(destination: Chain, assetLocation: any, assetAmount: BN) {
    if (!this.api) {
      throw new Error("Api not initialized");
    }
		// TODO
    // this.api.tx.xtokens.transfer(destination, assetLocation, assetAmount);
  }

  async scheduleXcmpTask(schedule: any, encodedCall: HexString, encodedCallWeight: Weight, overallWeight: Weight, scheduleFee: BN, executionFee: BN) {
    if (!this.api) {
      throw new Error("Api not initialized");
    }
		// TODO
    // const extrinsic = this.api.tx.automationTime.scheduleXcmpTask(schedule, encodedCall, encodedCallWeight, overallWeight, scheduleFee, executionFee);
    // extrinsic.signAndSend('');
  }

  async scheduleXcmpTaskThroughProxy(schedule: any, encodedCall: HexString, encodedCallWeight: Weight, overallWeight: Weight, scheduleFee: BN, executionFee: BN) {
    if (!this.api) {
      throw new Error("Api not initialized");
    }
		// TODO
    // const extrinsic = this.api.tx.automationTime.scheduleXcmpTaskThroughProxy(schedule, encodedCall, encodedCallWeight, overallWeight, scheduleFee, executionFee);
    // extrinsic.signAndSend('');
  }
}

export class OakProvider extends ChainProvider {
  constructor(config: ChainConfig) {
    const chain = new OakChain(config);
    super(chain, undefined);
  }
}
