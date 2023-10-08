// Auto-generated via `yarn polkadot-types-from-defs`, do not edit
/* eslint-disable */

import type { Struct, f64, i32 } from '@polkadot/types-codec';
import type { Balance } from '@polkadot/types/interfaces/runtime';

/** @name AutomationFeeDetails */
export interface AutomationFeeDetails extends Struct {
  readonly scheduleFee: Balance;
  readonly executionFee: Balance;
}

/** @name AutostakingResult */
export interface AutostakingResult extends Struct {
  readonly period: i32;
  readonly apy: f64;
}

export type PHANTOM_AUTOMATIONTIME = 'automationTime';
