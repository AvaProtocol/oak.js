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
import { convertAbsoluteLocationToRelative, getDerivativeAccountV3, sendExtrinsic } from '../util';
import { SendExtrinsicResult, XcmInstructionNetworkType } from '../types';
import { WEIGHT_REF_TIME_PER_SECOND } from '../constants';

const TRANSACT_XCM_INSTRUCTION_COUNT = 6;

// AstarAdapter implements ChainAdapter, TaskScheduler interface
export class AstarAdapter extends ChainAdapter implements TaskScheduler {
  /**
   * Initialize adapter
   */
  async initialize() {
    await this.updateChainData();
  }

  /**
   * Update chain data
   */
  public async updateChainData(): Promise<void> {
    await super.updateChainData();
    this.chainData.xcmInstructionNetworkType = XcmInstructionNetworkType.Concrete;
  }

  /**
   * Get extrinsic weight
   * @param extrinsic 
   * @param account 
   * @returns Extrinsic weight
   */
  async getExtrinsicWeight(extrinsic: SubmittableExtrinsic<'promise'>, account: AddressOrPair): Promise<Weight> {
    const { refTime, proofSize } = (await extrinsic.paymentInfo(account)).weight as unknown as WeightV2;
    return new Weight(new BN(refTime.unwrap()), new BN(proofSize.unwrap()));
  }

   /**
   * Calculate encoded call weight and overall weight for transact an extrinsic call through XCM message
   * @param extrinsic The extrinsic that needs to be transacted
   * @param account 
   * @param instructionCount The number of XCM instructions
   * returns { encodedCallWeight, overallWeight }
   */
  async getXcmWeight(extrinsic: SubmittableExtrinsic<'promise'>, account: AddressOrPair, instructionCount: number): Promise<{ encodedCallWeight: Weight; overallWeight: Weight; }> {
    const { xcm } = this.chainData;
    if (_.isUndefined(xcm)) throw new Error("chainData.xcm not set");
    const encodedCallWeight = await this.getExtrinsicWeight(extrinsic, account);
    const overallWeight = encodedCallWeight.add(xcm.instructionWeight.muln(instructionCount));
    return { encodedCallWeight, overallWeight };
  }

  /**
   * Calculate XCM execution fee based on weight
   * @param weight 
   * @param assetLocation 
   * @returns XCM execution fee
   */
  async weightToFee(weight: Weight, assetLocation: any): Promise<BN> {
    const { defaultAsset } = this.chainData;
    if (_.isUndefined(defaultAsset)) throw new Error("chainData.defaultAsset not set");

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

  /**
   * Calculate the derivative account ID of a certain account ID
   * @param accountId 
   * @param paraId The paraId of the XCM message sender
   * @returns Derivative account
   */
  getDerivativeAccount(accountId: HexString, paraId: number): HexString {
    return getDerivativeAccountV3(accountId, paraId);
  }

  /**
   * Get the instruction number of XCM instructions for transact
   */
  getTransactXcmInstructionCount() { return TRANSACT_XCM_INSTRUCTION_COUNT; }

  /**
   * Schedule Task through XCM message
   * @param destination The location of the destination chain
   * @param encodedTaskExtrinsic encoded task extrinsic
   * @param feeLocation Fee location
   * @param feeAmount Fee amount
   * @param encodedCallWeight The encoded call weight weight of the XCM instructions
   * @param overallWeight The overall weight of the XCM instructions
   * @param keyringPair Operator's keyring pair
   * @returns SendExtrinsicResult
   */
  async scheduleTaskThroughXcm(destination: any, encodedTaskExtrinsic: HexString, feeLocation: any, feeAmount: BN, encodedCallWeight: Weight, overallWeight: Weight, keyringPair: KeyringPair): Promise<SendExtrinsicResult> {
    const api = this.getApi();
    const { key } = this.chainData;
    if (_.isUndefined(key)) throw new Error('chainData.key not set.');

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
              call: { encoded: encodedTaskExtrinsic },
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

  /**
   * Check if it is a native asset
   * @param assetLocation 
   * @returns A bool value indicating whether it is a native asset
   */
  isNativeAsset(assetLocation: any): boolean {
    const { defaultAsset, assets } = this.chainData;
    if (_.isUndefined(defaultAsset)) throw new Error('chainData.defaultAsset not set');
    const foundAsset = _.find(assets, ({ location: assetLocation }));
    return !_.isUndefined(foundAsset) && foundAsset.isNative;
  }

  /**
   * Execute a cross-chain transfer
   * @param destination The location of the destination chain
   * @param recipient recipient account
   * @param assetLocation Asset location
   * @param assetAmount Asset amount
   * @param keyringPair Operator's keyring pair
   */
  async crossChainTransfer(destination: any, recipient: HexString, assetLocation: any, assetAmount: BN, keyringPair: KeyringPair): Promise<SendExtrinsicResult> {
    const { key } = this.chainData;
    if (_.isUndefined(key)) throw new Error('chainData.key not set');
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
              { AccountId32: { network: null, id: recipient } },
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
