import BN from 'bn.js';
// import '@polkadot/api-augment';
import type { ApiPromise } from '@polkadot/api';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { SubmittableExtrinsic, AddressOrPair } from '@polkadot/api/types';
import type { u32 } from '@polkadot/types';
import type { HexString } from '@polkadot/util/types';
import { ChainAsset, Weight, Chain as ChainConfig } from '@oak-network/sdk-types';
import { SendExtrinsicResult, XcmInstructionNetworkType } from '../types';

export class ChainData {
  key: string | undefined;
  assets: ChainAsset [] = [];
  defaultAsset: ChainAsset | undefined;
  endpoint: string | undefined;
  relayChain: string | undefined;
  paraId: number | undefined;
  ss58Prefix: number | undefined;
  name: string | undefined;
  instructionWeight: Weight  | undefined;
  xcmInstructionNetworkType: XcmInstructionNetworkType = XcmInstructionNetworkType.Null; 
}

export abstract class ChainAdapter {
  api: ApiPromise | undefined;
  protected chainData: ChainData;

  constructor(api: ApiPromise, config: ChainConfig) {
    this.api = api;
    this.chainData = new ChainData();
    this.chainData.key = config.key;
    this.chainData.assets = config.assets;
    this.chainData.defaultAsset = config.defaultAsset;
    this.chainData.instructionWeight = config.instructionWeight;
    this.chainData.endpoint = config.endpoint;
    this.chainData.relayChain = config.relayChain;
  }
  
  public abstract initialize(): Promise<void>;
  public abstract getDerivativeAccount(accountId: HexString, paraId: number, options?: any): HexString;
  public abstract getXcmWeight(extrinsic: SubmittableExtrinsic<'promise'>, account: AddressOrPair, instructionCount: number): Promise<{ encodedCallWeight: Weight; overallWeight: Weight; }>;
  public abstract weightToFee(weight: Weight, assetLocation: any): Promise<BN>;
  public abstract crossChainTransfer(destination: any, recipient: HexString, assetLocation: any, assetAmount: BN, keyringPair: KeyringPair): Promise<SendExtrinsicResult>;

  public getApi(): ApiPromise {
    if (!this.api) throw new Error("Api not initialized");
    return this.api;
  }

  public async updateChainData(): Promise<void> {
    const api = this.getApi();
    this.chainData.ss58Prefix = (api.consts.system.ss58Prefix as unknown as u32).toNumber();
    const storageValue = await api.query.parachainInfo.parachainId();
    this.chainData.paraId = (storageValue as unknown as u32).toNumber();
  }

  public getChainData(): ChainData {
    return this.chainData;
  }

  public getLocation(): any {
    const { paraId } = this.chainData;
    if (!paraId) throw new Error("chainData.paraId not set");
    return { parents: 1, interior: { X1: { Parachain: paraId } } };
  }
}

export interface TaskScheduler {
  getTransactXcmInstructionCount(): number;
  scheduleTaskThroughXcm(destination: any, encodedCall: HexString, feeLocation: any, feeAmount: BN, encodedCallWeight: Weight, overallWeight: Weight, keyringPair: KeyringPair): Promise<SendExtrinsicResult>;
}
