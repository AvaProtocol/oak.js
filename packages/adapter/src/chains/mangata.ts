import _ from 'lodash';
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { u32, u64, u128, Option } from '@polkadot/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import type { HexString } from '@polkadot/util/types';
import { Weight } from '@oak-network/sdk-types';
import { Mangata } from '@mangata-finance/sdk';
import { ChainAdapter } from './chainAdapter';
import { convertAbsoluteLocationToRelative, getDeriveAccount, sendExtrinsic } from '../util';
import { WEIGHT_REF_TIME_PER_SECOND } from '../constants';
import { SendExtrinsicResult } from '../types';

// MangataAdapter implements ChainAdapter
export class MangataAdapter extends ChainAdapter {
  api: ApiPromise | undefined;
  mangata: Mangata | undefined;

  async initialize() {
    const { endpoint } = this.getChainData();
    if(!endpoint) throw new Error("chainData.endpoint not set");

    this.mangata = Mangata.getInstance([endpoint]);
    this.api = await this.mangata.getApi();

    await this.updateChainData();
  }

  async destroy() {
    await this.mangata?.disconnect();
    this.api = undefined;
    this.mangata = undefined;
  }

  public getApi(): ApiPromise {
    if (!this.api) throw new Error("Api not initialized");
    return this.api;
  }

  public getMangataSdk(): Mangata {
    if (!this.mangata) throw new Error("Mangata sdk not initialized");
    return this.mangata;
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

  getDeriveAccount(accountId: HexString, paraId: number, options?: any): HexString {
    const api = this.getApi();
    return getDeriveAccount(api, accountId, paraId);
  }

  isNativeAsset(assetLocation: any): boolean {
    const { defaultAsset, assets } = this.chainData;
    if (!defaultAsset) throw new Error('chainData.defaultAsset not set');
    const foundAsset = _.find(assets, ({ location: assetLocation }));
    return !!foundAsset && foundAsset.isNative;
  }

  async crossChainTransfer(destination: any, accountId: HexString, assetLocation: any, assetAmount: BN, keyPair: any): Promise<SendExtrinsicResult> {
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
    const result = await sendExtrinsic(api, extrinsic, keyPair);
    return result;
  }
}
