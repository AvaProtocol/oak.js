import { EventRecord } from "@polkadot/types/interfaces";
import { ChainAdapter, TaskScheduler } from "./chains";

export interface SendExtrinsicResult {
  events: EventRecord[];
  blockHash: any;
}

export type TaskSchedulerChainAdapter = ChainAdapter & TaskScheduler;

/**
 * Account type
 * AccountKey20 — an account ID that is 20-bytes in length, including Ethereum-compatible account IDs such as those on Moonbeam
 * AccountId32 — an account ID that is 32-bytes in length, standard in Polkadot and its parachains
 */
export enum AccountType {
  AccountKey20 = "AccountKey20",
  AccountId32 = "AccountId32",
}
