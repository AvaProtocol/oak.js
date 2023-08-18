import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { SubmittableExtrinsic  } from '@polkadot/api-base/types';
import { Chain as ChainConfig, TransactInfo, Weight } from '@oak-foundation/xcm-types';
import { Chain, TaskRegister } from './chainProvider';

// MoonbeamChain implements Chain, TaskRegister interface
export class MoonbeamChain extends Chain implements TaskRegister {
  readonly config: ChainConfig;
  api: ApiPromise | undefined;

  constructor(config: ChainConfig) {
    super(config.assets, config.instructionWeight);
    this.config = config;
  }

  async initialize() {
    const api = await ApiPromise.create({
			provider: new WsProvider(this.config.endpoint),
		});

		this.api = api;
  }

  public getApi(): ApiPromise {
    if (!this.api) throw new Error("Api not initialized");
    return this.api;
  }

  async getExtrinsicWeight(sender: string, extrinsic: SubmittableExtrinsic<'promise'>): Promise<Weight> {
    return (await extrinsic.paymentInfo(sender)).weight as unknown as Weight;
  }

  async getXcmWeight(sender: string, extrinsic: SubmittableExtrinsic<'promise'>): Promise<{ extrinsicWeight: Weight; overallWeight: Weight; }> {
    const extrinsicWeight = await this.getExtrinsicWeight(sender, extrinsic);
    const overallWeight = extrinsicWeight.add(this.config.instructionWeight.muln(4));
    return { extrinsicWeight, overallWeight };
  }

  async metadata(assetId: number): Promise<any> {
    if (!this.api) {
      throw new Error("Api not initialized");
    }
    const metadata = await this.api.query.assetRegistry.metadata(assetId);
    return metadata;
  }

  async weightToFee(weight: Weight, assetId: number): Promise<BN> {
    if (!this.api) {
      throw new Error("Api not initialized");
    }
    const metadata = await this.metadata(assetId);
    const feePerSecond = metadata.additional.feePerSecond;
    return new BN(1234);
    // return weight.refTime.muln(feePerSecond);
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
