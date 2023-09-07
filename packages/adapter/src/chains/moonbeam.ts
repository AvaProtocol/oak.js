import _ from 'lodash';
import BN from 'bn.js';
import type { SubmittableExtrinsic, AddressOrPair } from '@polkadot/api/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type { u64, u128, Option } from '@polkadot/types';
import type { HexString } from '@polkadot/util/types';
import type { KeyringPair } from '@polkadot/keyring/types';
import { Asset, ChainAsset, Weight } from '@oak-network/sdk-types';
import { ChainAdapter, TaskScheduler } from './chainAdapter';
import { convertAbsoluteLocationToRelative, getDerivativeAccountV3, sendExtrinsic } from '../util';
import { AccountType, SendExtrinsicResult } from '../types';
import { WEIGHT_REF_TIME_PER_SECOND } from '../constants';

const TRANSACT_XCM_INSTRUCTION_COUNT = 4;

// MoonbeamAdapter implements ChainAdapter, TaskScheduler interface
export class MoonbeamAdapter extends ChainAdapter implements TaskScheduler {
  /**
   * Initialize adapter
   */
  async initialize() {
    await this.updateChainData();
    await this.updateAssets();
  }

  /**
   * Get asset data from assetManager storage
   * @returns asset data items
   */
  async getAssetManagerItems(): Promise<any[]> {
    const api = this.getApi();
    const entries = await api.query.assetManager.assetIdType.entries();
    const items: any[] = [];
    _.each(entries, ([storageKey, storageValue]) => {
      const key = storageKey.args[0] as unknown as u128;
      const item = storageValue as unknown as Option<any>;
      if (item.isSome) {
        const value = item.unwrap().toJSON();
        items.push({ key, value });
      }
    });
    return items;
  }

  /**
   * Get assets from chain
   * @returns assets
   */
  async getAssets(): Promise<any[]> {
    const api = this.getApi();
    const entries = await api.query.assets.metadata.entries();
    const items: any[] = [];
    _.each(entries, ([storageKey, storageValue]) => {
      const key = storageKey.args[0] as unknown as u128;
      const value = storageValue.toJSON();
      items.push({ key, value });
    });
    return items;
  }

  /**
   * Update assets from chain
   */
  async updateAssets() {
    const assets = await this.getAssets();
    const assetManagerItems = await this.getAssetManagerItems();
    _.each(assets, ({ key, value }) => {
      const item =  _.find(assetManagerItems, { key });
      const { value: { xcm: location } } = item;
      const { name, symbol, decimals } = value;
      const asset = new Asset({ key: name, symbol, decimals, location });
      const chainAsset = new ChainAsset({ asset, isNative: false });
      this.chainData.assets.push(chainAsset);
    })
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
      const storageValue = await api.query.assetManager.assetTypeUnitsPerSecond({ Xcm: assetLocation });
      const item = storageValue as unknown as Option<u128>;
      if (item.isNone) throw new Error("AssetTypeUnitsPerSecond is null");
      const unitsPerSecond = item.unwrap();
      return weight.refTime.mul(unitsPerSecond).div(WEIGHT_REF_TIME_PER_SECOND);
    }
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
   */
  async scheduleTaskThroughXcm(destination: any, encodedTaskExtrinsic: HexString, feeLocation: any, feeAmount: BN, encodedCallWeight: Weight, overallWeight: Weight, keyringPair: KeyringPair): Promise<SendExtrinsicResult> {
    const api = this.getApi();
    const { key } = this.chainData;
    if (_.isUndefined(key)) throw new Error('chainData.key not set');

    const { defaultAsset } = this.chainData;
    if (_.isUndefined(defaultAsset)) throw new Error("chainData.defaultAsset not set");
    const currency = _.isEqual(feeLocation, defaultAsset.location)
      ? { AsCurrencyId: 'SelfReserve' }
      : { AsMultiLocation: { V3: feeLocation } };
    const extrinsic = this.getApi().tx.xcmTransactor.transactThroughSigned(
      { V3: destination },
      { currency, feeAmount },
      encodedTaskExtrinsic,
      { transactRequiredWeightAtMost: encodedCallWeight, overallWeight },
      false,
    );

    console.log(`Send extrinsic from ${key} to schedule task. extrinsic:`, extrinsic.method.toHex());
    const result = await sendExtrinsic(api, extrinsic, keyringPair);
    return result;
  }

  /**
   * Calculate the derivative account ID of a certain account ID
   * @param api Polkadot API
   * @param accountId 
   * @param paraId The paraId of the XCM message sender
   * @param options Optional operation options
   * @returns Derivative account
   */
  getDerivativeAccount(accountId: HexString, paraId: number): HexString {
    return getDerivativeAccountV3(accountId, paraId, AccountType.AccountKey20);
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
   * @returns SendExtrinsicResult
   */
  async crossChainTransfer(destination: any, recipient: HexString, assetLocation: any, assetAmount: BN, keyringPair: KeyringPair): Promise<SendExtrinsicResult> {
    const { key } = this.chainData;
    if (_.isUndefined(key)) throw new Error('chainData.key not set');
    
    const transferAssetLocation = this.isNativeAsset(assetLocation)
      ? convertAbsoluteLocationToRelative(assetLocation)
      : assetLocation;

    const api = this.getApi();
    const extrinsic = api.tx.xTokens.transferMultiasset(
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

