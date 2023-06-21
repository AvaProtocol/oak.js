// Auto-generated via `yarn polkadot-types-from-chain`, do not edit
/* eslint-disable */

// import type lookup before we augment - in some environments
// this is required to allow for ambient/previous definitions
import '@polkadot/api-base/types/calls';

import type { AutomationAction, AutostakingResult } from '@oak-foundation/api-augment/interfaces/automationTime';
import type { ApiTypes, AugmentedCall, DecoratedCallBase } from '@polkadot/api-base/types';
import type { Bytes, Null, Option, Text, Vec, i128, u32, u64 } from '@polkadot/types-codec';
import type { ITuple } from '@polkadot/types-codec/types';
import type { CheckInherentsResult, InherentData } from '@polkadot/types/interfaces/blockbuilder';
import type { BlockHash } from '@polkadot/types/interfaces/chain';
import type { AuthorityId } from '@polkadot/types/interfaces/consensus';
import type { CollationInfo } from '@polkadot/types/interfaces/cumulus';
import type { Extrinsic } from '@polkadot/types/interfaces/extrinsics';
import type { OpaqueMetadata } from '@polkadot/types/interfaces/metadata';
import type { FeeDetails, RuntimeDispatchInfo } from '@polkadot/types/interfaces/payment';
import type { AccountId, AccountId32, Balance, Block, Hash, Header, Index, KeyTypeId, SlotDuration, Weight } from '@polkadot/types/interfaces/runtime';
import type { RuntimeVersion } from '@polkadot/types/interfaces/state';
import type { ApplyExtrinsicResult } from '@polkadot/types/interfaces/system';
import type { TransactionSource, TransactionValidity } from '@polkadot/types/interfaces/txqueue';
import type { IExtrinsic, Observable } from '@polkadot/types/types';

export type __AugmentedCall<ApiType extends ApiTypes> = AugmentedCall<ApiType>;
export type __DecoratedCallBase<ApiType extends ApiTypes> = DecoratedCallBase<ApiType>;

declare module '@polkadot/api-base/types/calls' {
  interface AugmentedCalls<ApiType extends ApiTypes> {
    /** 0xbc9d89904f5b923f/1 */
    accountNonceApi: {
      /**
       * The API to query account nonce (aka transaction index)
       **/
      accountNonce: AugmentedCall<ApiType, (accountId: AccountId | string | Uint8Array) => Observable<Index>>;
      /**
       * Generic call
       **/
      [key: string]: DecoratedCallBase<ApiType>;
    };
    /** 0xdd718d5cc53262d4/1 */
    auraApi: {
      /**
       * Return the current set of authorities.
       **/
      authorities: AugmentedCall<ApiType, () => Observable<Vec<AuthorityId>>>;
      /**
       * Returns the slot duration for Aura.
       **/
      slotDuration: AugmentedCall<ApiType, () => Observable<SlotDuration>>;
      /**
       * Generic call
       **/
      [key: string]: DecoratedCallBase<ApiType>;
    };
    /** 0x889fffe29b918d24/1 */
    automationTimeApi: {
      /**
       * Calculate the optimal period to restake
       **/
      calculateOptimalAutostaking: AugmentedCall<ApiType, (principal: i128, collator: AccountId | string | Uint8Array) => Observable<AutostakingResult>>;
      /**
       * Getting task ID given account ID and provided ID
       **/
      generateTaskId: AugmentedCall<ApiType, (accountId: AccountId | string | Uint8Array, providedId: Text | string) => Observable<Hash>>;
      /**
       * Return autocompounding tasks by account
       **/
      getAutoCompoundDelegatedStakeTaskIds: AugmentedCall<ApiType, (account_id: AccountId | string | Uint8Array) => Observable<Vec<Hash>>>;
      /**
       * Retrieve automation fees
       **/
      getTimeAutomationFees: AugmentedCall<ApiType, (action: AutomationAction, executions: u32) => Observable<Balance>>;
      /**
       * Generic call
       **/
      [key: string]: DecoratedCallBase<ApiType>;
    };
    /** 0x40fe3ad401f8959a/6 */
    blockBuilder: {
      /**
       * Apply the given extrinsic.
       **/
      applyExtrinsic: AugmentedCall<ApiType, (extrinsic: Extrinsic | IExtrinsic | string | Uint8Array) => Observable<ApplyExtrinsicResult>>;
      /**
       * Check that the inherents are valid.
       **/
      checkInherents: AugmentedCall<ApiType, (block: Block, data: InherentData) => Observable<CheckInherentsResult>>;
      /**
       * Finish the current block.
       **/
      finalizeBlock: AugmentedCall<ApiType, () => Observable<Header>>;
      /**
       * Generate inherent extrinsics.
       **/
      inherentExtrinsics: AugmentedCall<ApiType, (inherent: InherentData) => Observable<Vec<Extrinsic>>>;
      /**
       * Generic call
       **/
      [key: string]: DecoratedCallBase<ApiType>;
    };
    /** 0xea93e3f16f3d6962/2 */
    collectCollationInfo: {
      /**
       * Collect information about a collation.
       **/
      collectCollationInfo: AugmentedCall<ApiType, (header: Header) => Observable<CollationInfo>>;
      /**
       * Generic call
       **/
      [key: string]: DecoratedCallBase<ApiType>;
    };
    /** 0xdf6acb689907609b/4 */
    core: {
      /**
       * Execute the given block.
       **/
      executeBlock: AugmentedCall<ApiType, (block: Block) => Observable<Null>>;
      /**
       * Initialize a block with the given header.
       **/
      initializeBlock: AugmentedCall<ApiType, (header: Header) => Observable<Null>>;
      /**
       * Returns the version of the runtime.
       **/
      version: AugmentedCall<ApiType, () => Observable<RuntimeVersion>>;
      /**
       * Generic call
       **/
      [key: string]: DecoratedCallBase<ApiType>;
    };
    /** 0x37e397fc7c91f5e4/1 */
    metadata: {
      /**
       * Returns the metadata of a runtime
       **/
      metadata: AugmentedCall<ApiType, () => Observable<OpaqueMetadata>>;
      /**
       * Generic call
       **/
      [key: string]: DecoratedCallBase<ApiType>;
    };
    /** 0xf78b278be53f454c/2 */
    offchainWorkerApi: {
      /**
       * Starts the off-chain task for given block header.
       **/
      offchainWorker: AugmentedCall<ApiType, (header: Header) => Observable<Null>>;
      /**
       * Generic call
       **/
      [key: string]: DecoratedCallBase<ApiType>;
    };
    /** 0xab3c0572291feb8b/1 */
    sessionKeys: {
      /**
       * Decode the given public session keys.
       **/
      decodeSessionKeys: AugmentedCall<ApiType, (encoded: Bytes | string | Uint8Array) => Observable<Option<Vec<ITuple<[Bytes, KeyTypeId]>>>>>;
      /**
       * Generate a set of session keys with optionally using the given seed.
       **/
      generateSessionKeys: AugmentedCall<ApiType, (seed: Option<Bytes>) => Observable<Bytes>>;
      /**
       * Generic call
       **/
      [key: string]: DecoratedCallBase<ApiType>;
    };
    /** 0xd2bc9897eed08f15/3 */
    taggedTransactionQueue: {
      /**
       * Validate the transaction.
       **/
      validateTransaction: AugmentedCall<ApiType, (source: TransactionSource, tx: Extrinsic | IExtrinsic | string | Uint8Array, blockHash: BlockHash | string | Uint8Array) => Observable<TransactionValidity>>;
      /**
       * Generic call
       **/
      [key: string]: DecoratedCallBase<ApiType>;
    };
    /** 0x37c8bb1350a9a2a8/3 */
    transactionPaymentApi: {
      /**
       * The transaction fee details
       **/
      queryFeeDetails: AugmentedCall<ApiType, (uxt: Extrinsic | IExtrinsic | string | Uint8Array, len: u32) => Observable<FeeDetails>>;
      /**
       * The transaction info
       **/
      queryInfo: AugmentedCall<ApiType, (uxt: Extrinsic | IExtrinsic | string | Uint8Array, len: u32) => Observable<RuntimeDispatchInfo>>;
      /**
       * Query the output of the current LengthToFee given some input
       **/
      queryLengthToFee: AugmentedCall<ApiType, (length: u32) => Observable<Balance>>;
      /**
       * Query the output of the current WeightToFee given some input
       **/
      queryWeightToFee: AugmentedCall<ApiType, (weight: Weight) => Observable<Balance>>;
      /**
       * Generic call
       **/
      [key: string]: DecoratedCallBase<ApiType>;
    };
    /** 0x8efeb658e7eac37d/1 */
    xcmpHandlerApi: {
      /**
       * Find xcmp account id
       **/
      generateTaskId: AugmentedCall<ApiType, (accountId: AccountId32 | string | Uint8Array) => Observable<AccountId32>>;
      /**
       * Determine fees for a scheduled xcmp task
       **/
      getTimeAutomationFees: AugmentedCall<ApiType, (encodedXt: Bytes | string | Uint8Array) => Observable<u64>>;
      /**
       * Generic call
       **/
      [key: string]: DecoratedCallBase<ApiType>;
    };
  } // AugmentedCalls
} // declare module
