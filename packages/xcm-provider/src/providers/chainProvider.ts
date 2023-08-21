import BN from 'bn.js';
// import '@polkadot/api-augment';
import { ApiPromise } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { ChainAsset, TransactInfo, Weight } from '@oak-foundation/xcm-types';

// Every chain implements ChainProvider
// If you want to use PayThroughRemoteDerivativeAccount instructionSequence to schedule task, implements TaskRegister
// For example, MoonbeamChain implements TaskRegister, Mangata does not implement TaskRegister
export class ChainProvider {
  readonly chain: Chain;
  readonly taskRegister: TaskRegister | undefined;
  constructor(chain: Chain, taskRegister: TaskRegister | undefined) {
    this.chain = chain;
    this.taskRegister = taskRegister;
  }
}

export abstract class Chain {
  protected assets: ChainAsset [];
  readonly instructionWeight: Weight;
  readonly defaultAsset: ChainAsset;

  constructor(assets: ChainAsset [], defaultAsset: ChainAsset, instructionWeight: Weight) {
    this.assets = assets;
    this.defaultAsset = defaultAsset;
    this.instructionWeight = instructionWeight;
  }

  public abstract initialize(): void;
  public abstract getApi(): ApiPromise;
  public abstract getXcmWeight(sender: string, extrinsic: SubmittableExtrinsic<'promise'>): Promise<{ extrinsicWeight: Weight; overallWeight: Weight; }>;
  public abstract weightToFee(weight: Weight, assetLocation: any): Promise<BN>;
  public abstract transfer(destination: Chain, assetLocation: any, assetAmount: BN): void;
}

export interface TaskRegister {
  transact(transactInfo: TransactInfo): void;
}
