import _ from 'lodash';
import BN from 'bn.js';
import type { SubmittableExtrinsic, AddressOrPair } from '@polkadot/api/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type { u64, u128, Option } from '@polkadot/types';
import type { HexString } from '@polkadot/util/types';
import type { KeyringPair } from '@polkadot/keyring/types';
import { Asset, ChainAsset, Weight } from '@oak-network/sdk-types';
import { ChainAdapter, TaskScheduler } from './chainAdapter';
import { convertAbsoluteLocationToRelative, getDeriveAccountV3, sendExtrinsic } from '../util';
import { AccountType, SendExtrinsicResult } from '../types';
import { WEIGHT_REF_TIME_PER_SECOND } from '../constants';

const TRANSACT_XCM_INSTRUCTION_COUNT = 4;

// MoonbeamAdapter implements ChainAdapter, TaskScheduler interface
export class MoonbeamAdapter extends ChainAdapter implements TaskScheduler {
  async initialize() {
    await this.updateChainData();
    await this.updateAssets();
  }

  async getAssetManagerItems(): Promise<any[]> {
    const entries = await this.api?.query.assetManager.assetIdType.entries();
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

  async getAssets(): Promise<any[]> {
    const entries = await this.api?.query.assets.metadata.entries();
    const items: any[] = [];
    _.each(entries, ([storageKey, storageValue]) => {
      const key = storageKey.args[0] as unknown as u128;
      const value = storageValue.toJSON();
      items.push({ key, value });
    });
    return items;
  }

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
      const storageValue = await api.query.assetManager.assetTypeUnitsPerSecond({ Xcm: assetLocation });
      const item = storageValue as unknown as Option<u128>;
      if (item.isNone) throw new Error("AssetTypeUnitsPerSecond is null");
      const unitsPerSecond = item.unwrap();
      return weight.refTime.mul(unitsPerSecond).div(WEIGHT_REF_TIME_PER_SECOND);
    }
  }

  getTransactXcmInstructionCount() { return TRANSACT_XCM_INSTRUCTION_COUNT; }

  async scheduleTaskThroughXcm(destination: any, encodedCall: HexString, feeLocation: any, feeAmount: BN, encodedCallWeight: Weight, overallWeight: Weight, keyringPair: KeyringPair): Promise<SendExtrinsicResult> {
    const api = this.getApi();
    const { key } = this.chainData;
    if (!key) throw new Error('chainData.key not set');

    const { defaultAsset } = this.chainData;
    if (!defaultAsset) throw new Error("chainData.defaultAsset not set");
    const currency = _.isEqual(feeLocation, defaultAsset.location)
      ? { AsCurrencyId: 'SelfReserve' }
      : { AsMultiLocation: { V3: feeLocation } };
    const extrinsic = this.getApi().tx.xcmTransactor.transactThroughSigned(
      { V3: destination },
      { currency, feeAmount },
      encodedCall,
      { transactRequiredWeightAtMost: encodedCallWeight, overallWeight },
    );

    console.log(`Send extrinsic from ${key} to schedule task. extrinsic:`, extrinsic.method.toHex());
    const result = await sendExtrinsic(api, extrinsic, keyringPair);
    return result;
  }

  getDeriveAccount(accountId: HexString, paraId: number, options?: any): HexString {
    return getDeriveAccountV3(accountId, paraId, AccountType.AccountKey20);
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

