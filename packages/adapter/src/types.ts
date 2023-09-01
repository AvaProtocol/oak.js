import { ChainAdapter, TaskScheduler } from "./chains";
import { EventRecord } from '@polkadot/types/interfaces';

export interface SendExtrinsicResult {
  events: EventRecord[];
  blockHash: any;
}

export type TaskSchedulerChainAdapter = ChainAdapter & TaskScheduler;

export enum AccountType {
  AccountKey20 = 'AccountKey20',
  AccountId32 = 'AccountId32',
};

export enum XcmInstructionNetworkType {
  Null,
  Concrete,
};
