
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { HexString } from '@polkadot/util/types';
import type { SubmittableExtrinsic } from '@polkadot/api-base/types';
import { rpc, types, runtime } from '@oak-network/types';
import { Chain as ChainConfig, Weight } from '@oak-foundation/xcm-types';
import { Chain } from './chainProvider';

// TuringChain implements Chain
export class TuringChain extends Chain {
  readonly config: ChainConfig;
  api: ApiPromise | undefined;

  constructor(config: ChainConfig) {
    super(config.assets, config.instructionWeight);
    this.config = config;
  }

  async initialize() {
    const api = await ApiPromise.create({
			provider: new WsProvider(this.config.endpoint), rpc, types, runtime,
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

  async scheduleXcmpTask(schedule: any, encodedCall: HexString, encodedCallWeight: Weight, overallWeight: Weight, scheduleFee: BN, executionFee: BN) {
    if (!this.api) {
      throw new Error("Api not initialized");
    }
    const extrinsic = this.api.tx.automationTime.scheduleXcmpTask(schedule, encodedCall, encodedCallWeight, overallWeight, scheduleFee, executionFee);
    extrinsic.signAndSend('');
  }

  async scheduleXcmpTaskThroughProxy(schedule: any, encodedCall: HexString, encodedCallWeight: Weight, overallWeight: Weight, scheduleFee: BN, executionFee: BN) {
    if (!this.api) {
      throw new Error("Api not initialized");
    }
    const extrinsic = this.api.tx.automationTime.scheduleXcmpTaskThroughProxy(schedule, encodedCall, encodedCallWeight, overallWeight, scheduleFee, executionFee);
    extrinsic.signAndSend('');
  }
}
