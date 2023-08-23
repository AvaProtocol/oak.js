import BN from 'bn.js';
// import '@polkadot/api-augment';
import { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { u32 } from '@polkadot/types';
import type { HexString } from '@polkadot/util/types';
import { ChainAsset, Weight, Chain as ChainConfig } from '@oak-network/sdk-types';
import { SendExtrinsicResult } from '../types';

export class ChainData {
  key: string | undefined;
  assets: ChainAsset [] = [];
  defaultAsset: ChainAsset | undefined;
  endpoint: string | undefined;
  relayChain: string | undefined;
  paraId: number | undefined;
  ss58: number | undefined;
  name: string | undefined;
  instructionWeight: Weight  | undefined;
}

// Every chain implements ChainProvider
// If you want to use PayThroughRemoteDerivativeAccount instructionSequence to schedule task, implements TaskRegister
// For example, MoonbeamChain implements TaskRegister, Mangata does not implement TaskRegister
export class ChainProvider {
  readonly chain: Chain;
  readonly taskScheduler: TaskScheduler | undefined;
  constructor(chain: Chain, taskScheduler: TaskScheduler | undefined) {
    this.chain = chain;
    this.taskScheduler = taskScheduler;
  }

  async initialize() {
    await this.chain.initialize();
  }

  async destroy() {
    await this.chain.destroy();
  }
}

export abstract class Chain {
  protected chainData: ChainData;

  constructor(config: ChainConfig) {
    this.chainData = new ChainData();
    this.chainData.key = config.key;
    this.chainData.assets = config.assets;
    this.chainData.defaultAsset = config.defaultAsset;
    this.chainData.instructionWeight = config.instructionWeight;
    this.chainData.endpoint = config.endpoint;
  }
  
  public abstract initialize(): Promise<void>;
  public abstract destroy(): Promise<void>;
  public abstract getApi(): ApiPromise;
  
  public abstract getDeriveAccount(accountId: HexString, paraId: number): HexString;
  public abstract getXcmWeight(sender: string, extrinsic: SubmittableExtrinsic<'promise'>): Promise<{ encodedCallWeight: Weight; overallWeight: Weight; }>;
  public abstract weightToFee(weight: Weight, assetLocation: any): Promise<BN>;
  public abstract transfer(destination: Chain, assetLocation: any, assetAmount: BN): void;

  public async updateChainData(): Promise<void> {
    const api = this.getApi();
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
  scheduleTaskThroughXcm(destination: any, encodedCall: HexString, feeLocation: any, feeAmount: BN, encodedCallWeight: Weight, overallWeight: Weight, deriveAccount: string, keyPair: any): Promise<SendExtrinsicResult>;
}
