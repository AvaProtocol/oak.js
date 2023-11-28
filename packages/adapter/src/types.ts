import { EventRecord } from "@polkadot/types/interfaces";
import { ChainAdapter, TaskScheduler } from "./chains";

export interface SendExtrinsicResult {
  events: EventRecord[];
  blockHash: any;
}

export type TaskSchedulerChainAdapter = ChainAdapter & TaskScheduler;

export enum AccountType {
  AccountKey20 = "AccountKey20",
  AccountId32 = "AccountId32",
}
