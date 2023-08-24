import { ChainAdapter, TaskScheduler } from "./chains";

export interface SendExtrinsicResult {
  events: any[];
  blockHash: any;
}

export type TaskSchedulerChainAdapter = ChainAdapter & TaskScheduler;
