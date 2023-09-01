import _ from 'lodash';
import BN from 'bn.js';
import type { SubmittableExtrinsic, AddressOrPair } from '@polkadot/api/types';
import type { u32, u64, u128, Option } from '@polkadot/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type { HexString } from '@polkadot/util/types';
import type { KeyringPair } from '@polkadot/keyring/types';
import { Weight } from '@oak-network/sdk-types';
import { ChainAdapter } from './chainAdapter';
import { convertAbsoluteLocationToRelative, getDerivativeAccountV2, sendExtrinsic } from '../util';
import { WEIGHT_REF_TIME_PER_SECOND } from '../constants';
import { SendExtrinsicResult } from '../types';

// MangataAdapter implements ChainAdapter
export class MangataAdapter extends ChainAdapter {
  async initialize() {
    await this.updateChainData();
  }

  async getExtrinsicWeight(extrinsic: SubmittableExtrinsic<'promise'>, account: AddressOrPair): Promise<Weight> {
    const { refTime, proofSize } = (await extrinsic.paymentInfo(account)).weight as unknown as WeightV2;
    return new Weight(new BN(refTime.unwrap()), new BN(proofSize.unwrap()));
  }

  async getXcmWeight(extrinsic: SubmittableExtrinsic<'promise'>, account: AddressOrPair, instructionCount: number): Promise<{ encodedCallWeight: Weight; overallWeight: Weight; }> {
    const { instructionWeight } = this.chainData;
    if (!instructionWeight) throw new Error("chainData.instructionWeight not set");
    const encodedCallWeight = await this.getExtrinsicWeight(extrinsic, account);
    const overallWeight = encodedCallWeight.add(instructionWeight?.muln(instructionCount));
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
      if (item.isNone) throw new Error("AssetTypeUnitsPerSecond is null");

      const assetId = item.unwrap();
      const metadataStorageValue = await api.query.assetRegistry.metadata(assetId);
      const metadataItem = metadataStorageValue as unknown as Option<any>;
      if (metadataItem.isNone) throw new Error("Metadata is null");

      const { additional: { xcm } } = metadataItem.unwrap() as { additional: { xcm: Option<any> } };
      if (!xcm) throw new Error("Metadata additional.xcm is null");
      const feePerSecond = xcm.unwrap().feePerSecond as u128;
      
      return weight.refTime.mul(feePerSecond).div(WEIGHT_REF_TIME_PER_SECOND);
    }
  }

  getDerivativeAccount(accountId: HexString, paraId: number, options?: any): HexString {
    const api = this.getApi();
    return getDerivativeAccountV2(api, accountId, paraId);
  }

  isNativeAsset(assetLocation: any): boolean {
    const { defaultAsset, assets } = this.chainData;
    if (!defaultAsset) throw new Error('chainData.defaultAsset not set');
    const foundAsset = _.find(assets, ({ location: assetLocation }));
    return !!foundAsset && foundAsset.isNative;
  }

  async crossChainTransfer(destination: any, recipient: HexString, assetLocation: any, assetAmount: BN, keyringPair: KeyringPair): Promise<SendExtrinsicResult> {
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
