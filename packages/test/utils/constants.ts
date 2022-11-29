export const MS_IN_SEC = 1000
export const SEC_IN_MIN = 60
export const MIN_IN_HOUR = 60
export const HOUR_IN_DAY = 24
export const DAYS_IN_WEEK = 7
export const ADDITIONAL_UNIT = 1
export const NO_DIFF = 0
export const RECURRING_TASK_LIMIT = 24
export const LOWEST_TRANSFERRABLE_AMOUNT = 1000000000
export const SS58_PREFIX = 51

export enum OakChainWebsockets {
  STUR = 'wss://rpc.turing-staging.oak.tech',
  TUR = 'wss://rpc.turing.oak.tech',
}

export enum OakChainSchedulingLimit {
  STUR = 6 * 30 * 24 * 60 * 60 * 1000,
  TUR = 6 * 30 * 24 * 60 * 60 * 1000,
}

export enum OakChains {
  STUR = 'STUR',
  TUR = 'TUR',
}

export enum AutomationAction {
  Notify = 'Notify',
  NativeTransfer = 'NativeTransfer',
  XCMP = 'XCMP',
  AutoCompoundDelegatedStake = 'AutoCompoundDelegatedStake',
}
