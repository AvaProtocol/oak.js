import _ from 'lodash';
import BN from 'bn.js';
import type { SubmittableExtrinsic, AddressOrPair } from '@polkadot/api/types';
import type { u64, u128, Option } from '@polkadot/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type { HexString } from '@polkadot/util/types';
import { u8aToHex } from '@polkadot/util';
import type { KeyringPair } from '@polkadot/keyring/types';
import { Weight } from '@oak-network/sdk-types';
import { ChainAdapter, TaskScheduler } from './chainAdapter';
import { convertAbsoluteLocationToRelative, getDeriveAccountV3, sendExtrinsic } from '../util';
import { SendExtrinsicResult } from '../types';
import { WEIGHT_REF_TIME_PER_SECOND } from '../constants';

const TRANSACT_XCM_INSTRUCTION_COUNT = 6;

// AstarAdapter implements ChainAdapter, TaskScheduler interface
export class AstarAdapter extends ChainAdapter implements TaskScheduler {

  async initialize() {
    await this.updateChainData();
  }

  public async updateChainData(): Promise<void> {
    await super.updateChainData();
    this.chainData.xcmInstructionNetworkType = 'concrete';
  }

  async getExtrinsicWeight(extrinsic: SubmittableExtrinsic<'promise'>, account: AddressOrPair): Promise<Weight> {
    const { refTime, proofSize } = (await extrinsic.paymentInfo(account)).weight as unknown as WeightV2;
    return new Weight(new BN(refTime.unwrap()), new BN(proofSize.unwrap()));
  }

  async getXcmWeight(extrinsic: SubmittableExtrinsic<'promise'>, account: AddressOrPair, instructionCount: number): Promise<{ encodedCallWeight: Weight; overallWeight: Weight; }> {
    const { instructionWeight } = this.chainData;
    if (!instructionWeight) throw new Error("chainData.instructionWeight not set");
    const encodedCallWeight = await this.getExtrinsicWeight(extrinsic, account);
    const overallWeight = encodedCallWeight.add(instructionWeight.muln(instructionCount));
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
      if (metadataItem.isNone) throw new Error("MetadatAssetLocationUnitsPerSecond is null");
      const unitsPerSecond = metadataItem.unwrap();
      return weight.refTime.mul(unitsPerSecond).div(WEIGHT_REF_TIME_PER_SECOND);
    }
  }

  getDeriveAccount(accountId: HexString, paraId: number, options?: any): HexString {
    return getDeriveAccountV3(accountId, paraId);
  }

  getTransactXcmInstructionCount() { return TRANSACT_XCM_INSTRUCTION_COUNT; }

  async scheduleTaskThroughXcm(destination: any, encodedCall: HexString, feeLocation: any, feeAmount: BN, encodedCallWeight: Weight, overallWeight: Weight, keyringPair: KeyringPair): Promise<SendExtrinsicResult> {
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
                id: { Concrete: feeLocation },
              },
            ],
          },
          {
            BuyExecution: {
              fees: {
                fun: { Fungible: feeAmount },
                id: { Concrete: feeLocation },
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
              assets: { Wild: { AllCounted: 1 } },
              maxAssets: 1,
              beneficiary: {
                parents: 1,
                interior: { X1: { AccountId32: { network: null, id: u8aToHex(keyringPair.addressRaw) } } },
              },
            },
          },
        ],
      },
    );

    console.log(`Send extrinsic from ${key} to schedule task. extrinsic:`, extrinsic.method.toHex());

    const result = await sendExtrinsic(api, extrinsic, keyringPair);
    return result;
  }

  isNativeAsset(assetLocation: any): boolean {
    const { defaultAsset, assets } = this.chainData;
    if (!defaultAsset) throw new Error('chainData.defaultAsset not set');
    const foundAsset = _.find(assets, ({ location: assetLocation }));
    return !!foundAsset && foundAsset.isNative;
  }

  async crossChainTransfer(destination: any, accountId: HexString, assetLocation: any, assetAmount: BN, keyringPair: KeyringPair): Promise<SendExtrinsicResult> {
    const { key } = this.chainData;
    if (!key) throw new Error('chainData.key not set');
    const api = this.getApi();

    const transferAssetLocation = this.isNativeAsset(assetLocation)
      ? convertAbsoluteLocationToRelative(assetLocation)
      : assetLocation;
    
    const extrinsic = api.tx.xtokens.transferMultiasset(
      {
        V3: {
          id: { Concrete: transferAssetLocation },
          fun: { Fungible: assetAmount },
        },
      },
      {
        V3: {
          parents: 1,
          interior: {
            X2: [
              destination.interior.X1,
              { AccountId32: { network: null, id: accountId } },
            ],
          },
        }
      },
      'Unlimited',
    );

    console.log(`Transfer from ${key}, extrinsic:`, extrinsic.method.toHex());
    const result = await sendExtrinsic(api, extrinsic, keyringPair);
    return result;
  }
}
