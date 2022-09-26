// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { Enum, Struct, f64, i32 } from '@polkadot/types-codec';

/** @name AutomationAction */
export interface AutomationAction extends Enum {
  readonly isNotify: boolean;
  readonly isNativeTransfer: boolean;
  readonly isXcmp: boolean;
  readonly isAutoCompoundDelegatedStake: boolean;
  readonly type: 'Notify' | 'NativeTransfer' | 'Xcmp' | 'AutoCompoundDelegatedStake';
}

/** @name AutostakingResult */
export interface AutostakingResult extends Struct {
  readonly period: i32;
  readonly apy: f64;
}

export type PHANTOM_AUTOMATIONTIME = 'automationTime';
