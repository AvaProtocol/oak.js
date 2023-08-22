import _ from 'lodash';
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { Chain as ChainConfig, TransactInfo, Weight } from '@oak-network/sdk-types';
import { Chain, ChainProvider } from './chainProvider';
import type { u32, u64, Option } from '@polkadot/types';
import type { WeightV2 } from '@polkadot/types/interfaces';

// MangataChain implements Chain
export class MangataChain extends Chain {
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
			
			return weight.refTime.mul(new BN(feePerSecond)).div(new BN(10 ** 12));
    }
  }

  async transfer(destination: Chain, assetLocation: any, assetAmount: BN) {
		// TODO
    // const api = this.getApi();
    // api.tx.xtokens.transfer(destination, assetLocation, assetAmount);
  }

  transact(transactInfo: TransactInfo) {
		// TODO
    // const api = this.getApi();
    // const { encodedCall, encodedCallWeight, overallWeight, fee } = transactInfo;
    // api.tx.xcmTransactor.transactThroughSigned(encodedCall, encodedCallWeight,overallWeight, fee);
  }
}

export class MangataProvider extends ChainProvider {
  constructor(config: ChainConfig) {
    const chain = new MangataChain(config);
    super(chain, undefined);
  }
}
