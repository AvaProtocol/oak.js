export const ADDITIONAL_UNIT = 1
export const NO_DIFF = 0
export const RECURRING_TASK_LIMIT = 24
export const LOWEST_TRANSFERRABLE_AMOUNT = 1000000000
export const SS58_PREFIX = 51

export ChainConfig:object {
  "Turing Dev": {
    endpoint: 'ws://127.0.0.1:9946',
    mnemonic: '<use Alice’s mnemonic is Turing dev chain config>',
    symbol: 'TUR',
    scheduleLimit: 6 * 30 * 24 * 60 * 60 * 1000,  // 6 months
  },
  "Turing Staging": {
    endpoint: 'wss://rpc.turing-staging.oak.tech',
    symbol: 'TUR',
    scheduleLimit: 6 * 30 * 24 * 60 * 60 * 1000,  // 6 months
  },
  "Turing": {
    endpoint: 'wss://rpc.turing.oak.tech',
    symbol: 'TUR',
    scheduleLimit: 6 * 30 * 24 * 60 * 60 * 1000,  // 6 months
  }
}

export enum AutomationAction {
  Notify = 'Notify',
  NativeTransfer = 'NativeTransfer',
  XCMP = 'XCMP',
  AutoCompoundDelegatedStake = 'AutoCompoundDelegatedStake',
}
