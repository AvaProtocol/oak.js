import { ChainAdapter, TaskScheduler } from "./chains";

export interface SendExtrinsicResult {
  events: any[];
  blockHash: any;
}

export type TaskSchedulerChainAdapter = ChainAdapter & TaskScheduler;

export enum AccountType {
  AccountKey20 = 'AccountKey20',
  AccountId32 = 'AccountId32',
};
