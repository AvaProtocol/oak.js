import _ from 'lodash';
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { u64, u128, Option } from '@polkadot/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type { HexString } from '@polkadot/util/types';
import { Chain as ChainConfig, Weight } from '@oak-network/sdk-types';
import { Chain, ChainProvider, TaskScheduler } from './chainProvider';
import { getDeriveAccountV3, sendExtrinsic } from '../util';
import { SendExtrinsicResult } from '../types';

// AstarChain implements Chain, TaskScheduler interface
export class AstarChain extends Chain implements TaskScheduler {
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

  async transfer(destination: Chain, assetLocation: any, assetAmount: BN) {
    // TODO
    // this.api.tx.xtokens.transfer(destination, assetLocation, assetAmount);
  }

  public getDeriveAccount(accountId: HexString, paraId: number): HexString {
    return getDeriveAccountV3(accountId, paraId);
  }

  async scheduleTaskThroughXcm(destination: any, encodedCall: HexString, feeLocation: any, feeAmount: BN, encodedCallWeight: Weight, overallWeight: Weight, deriveAccount: string, keyPair: any): Promise<SendExtrinsicResult> {
    const api = this.getApi();
    const { key } = this.chainData;
    if (!key) throw new Error('chainData.key not set.');

    const extrinsic = api.tx.polkadotXcm.send(
      { V3: destination },
      {
        V3: [
          {
            WithdrawAsset: [
              {
                fun: { Fungible: feeAmount },
                id: {
                  Concrete: feeLocation,
                },
              },
            ],
          },
          {
            BuyExecution: {
              fees: {
                fun: { Fungible: feeAmount },
                id: {
                  Concrete: feeLocation,
                },
              },
              weightLimit: { Limited: overallWeight },
            },
          },
          {
            Transact: {
              originKind: 'SovereignAccount',
              requireWeightAtMost: encodedCallWeight,
              call: { encoded: encodedCall },
            },
          },
          { RefundSurplus: '' },
          {
            DepositAsset: {
              assets: { Wild: 'All' },
              maxAssets: 1,
              beneficiary: {
                parents: 1,
                interior: { X1: { AccountId32: { network: null, id: deriveAccount } } },
              },
            },
          },
        ],
      },
    );

    console.log(`Send extrinsic to ${key} to schedule task. extrinsic:`, extrinsic.method.toHex());
    const result = await sendExtrinsic(api, extrinsic, keyPair);
    return result;
  }
}

export class AstarProvider extends ChainProvider {
  constructor(config: ChainConfig) {
    const chain = new AstarChain(config);
    super(chain, chain);
  }
}
