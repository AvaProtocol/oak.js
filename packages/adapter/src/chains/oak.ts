import _ from 'lodash';
import BN from 'bn.js';
import type { HexString } from '@polkadot/util/types';
import type { SubmittableExtrinsic, AddressOrPair } from '@polkadot/api/types';
import type { u32, u128, Option } from '@polkadot/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import { Weight } from '@oak-network/sdk-types';
import { ChainAdapter } from './chainAdapter';
import { getDeriveAccount, sendExtrinsic } from '../util';
import { SendExtrinsicResult } from '../types';
import { WEIGHT_REF_TIME_PER_SECOND } from '../constants';

const TRANSACT_XCM_INSTRUCTION_COUNT = 6;

// OakAdapter implements ChainAdapter
export class OakAdapter extends ChainAdapter {
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
    const overallWeight = encodedCallWeight.add(instructionWeight.muln(instructionCount));
    return { encodedCallWeight, overallWeight };
  }

  async weightToFee(weight: Weight, assetLocation: any): Promise<BN> {
    const { defaultAsset } = this.chainData;
    if (!defaultAsset) throw new Error("chainData.defaultAsset not set");

    const api = this.getApi();
    const location = _.isEqual(assetLocation, defaultAsset.location)
      ? { parents: 0, interior: 'Here' } : assetLocation;
    const storageValue = await api.query.assetRegistry.locationToAssetId(location);
    const item = storageValue as unknown as Option<u32>;
    if (item.isNone) throw new Error("AssetId not set");

    const assetId = item.unwrap();
    const metadataStorageValue = await api.query.assetRegistry.metadata(assetId);
    const metadataItem = metadataStorageValue as unknown as Option<any>;
    if (metadataItem.isNone) throw new Error("Metadata not set");

    const { additional } = metadataItem.unwrap();
    const feePerSecond = additional.feePerSecond as unknown as Option<u128>;
    if (feePerSecond.isNone) throw new Error("feePerSecond is null");

    return weight.refTime.mul(feePerSecond.unwrap()).div(WEIGHT_REF_TIME_PER_SECOND);
  }

  async crossChainTransfer(destination: any, accountId: HexString, assetLocation: any, assetAmount: BN, keyPair: any): Promise<SendExtrinsicResult> {
    const { key } = this.chainData;
    if (!key) throw new Error('chainData.key not set');
    const api = this.getApi();
    
    const extrinsic = api.tx.xTokens.transferMultiasset(
      {
        V3: {
          id: { Concrete: assetLocation },
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

  getTransactXcmInstructionCount() { return TRANSACT_XCM_INSTRUCTION_COUNT; }

  async scheduleXcmpTask(schedule: any, destination: any, scheduleFee: any, executionFee: any, encodedCall: HexString, encodedCallWeight: Weight, overallWeight: Weight, keyPair: any) : Promise<SendExtrinsicResult> {
    const api = this.getApi();
    const { key } = this.chainData;
    if (!key) throw new Error('chainData.key not set');

    const extrinsic = api.tx.automationTime.scheduleXcmpTask(
      schedule,
      destination,
      scheduleFee,
      executionFee,
      encodedCall,
      encodedCallWeight,
      overallWeight,
    );
  
    console.log(`Send extrinsic from ${key} to schedule task. extrinsic:`, extrinsic.method.toHex());
    const result = await sendExtrinsic(api, extrinsic, keyPair);
    return result;
  }

  getDeriveAccount(accountId: HexString, paraId: number, options?: any): HexString {
    const api = this.getApi();
    return getDeriveAccount(api, accountId, paraId, options);
  };
}

