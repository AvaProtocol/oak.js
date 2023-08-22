import _ from 'lodash';
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { Chain as ChainConfig, TransactInfo, Weight } from '@oak-network/sdk-types';
import { Chain, ChainProvider, TaskRegister } from './chainProvider';
import type { u64, u128, Option } from '@polkadot/types';
import type { WeightV2 } from '@polkadot/types/interfaces';

// AstarChain implements Chain, TaskRegister interface
export class AstarChain extends Chain implements TaskRegister {
  api: ApiPromise | undefined;

  async initialize() {
    const api = await ApiPromise.create({
			provider: new WsProvider(this.chainData.endpoint),
		});

		this.api = api;
    await this.updateChainData();
  }

  public getApi(): ApiPromise {
    if (!this.api) throw new Error("Api not initialized");
    return this.api;
  }
  
  async destroy() {
    await this.getApi().disconnect();
    this.api = undefined;
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
		if (_.isEqual(defaultAsset.location, assetLocation)) {
      const fee = await api.call.transactionPaymentApi.queryWeightToFee(weight) as u64;
			return fee;
    } else {
			const AssetLocationUnitsPerSecond = await api.query.xcAssetConfig.assetLocationUnitsPerSecond(assetLocation);
			const metadataItem = AssetLocationUnitsPerSecond as unknown as Option<u128>;
			if (metadataItem.isNone) throw new Error("MetadatAssetLocationUnitsPerSeconda not initialized");
			const unitsPerSecond = metadataItem.unwrap();
			return weight.refTime.mul(unitsPerSecond).div(new BN(10 ** 12));
    }
  }

  public getLocation() {
    throw new Error('Method not implemented.');
  }

  async transfer(destination: Chain, assetLocation: any, assetAmount: BN) {
		// TODO
    // this.api.tx.xtokens.transfer(destination, assetLocation, assetAmount);
  }

  transact(transactInfo: TransactInfo) {
		// TODO
    // const { encodedCall, encodedCallWeight, overallWeight, fee } = transactInfo;
    // this.api.tx.xcmTransactor.transactThroughSigned(encodedCall, encodedCallWeight,overallWeight, fee);
  }

  // transfer(api: polkadotApi, destination, asset: Asset, assetAmount: BN): hash {
  //   // TODO
  // }
}

export class AstarProvider extends ChainProvider {
  constructor(config: ChainConfig) {
    const chain = new AstarChain(config);
    super(chain, chain);
  }
}
