export const ADDITIONAL_UNIT = 1;
export const NO_DIFF = 0;
export const RECURRING_TASK_LIMIT = 24;
export const LOWEST_TRANSFERRABLE_AMOUNT = 1000000000;
export const SS58_PREFIX = 51;
export const DEFAULT_TIMEOUT_PER_TEST = 540000;
export const DEFAULT_TIMEOUT_INITIALIZE = 10000;

const mnemonic = process.env.MNEMONIC;

export const chainConfigs = {
  Turing: {
    endpoint: "wss://rpc.turing.oak.tech",
    mnemonic,
    scheduleLimit: 6 * 30 * 24 * 60 * 60 * 1000,
  },
  "Turing Dev": {
    endpoint: process.env.ENDPOINT || "ws://127.0.0.1:9946",
    mnemonic: mnemonic || "//Alice",
    scheduleLimit: 6 * 30 * 24 * 60 * 60 * 1000, // 6 months
  },
  "Turing Staging": {
    endpoint: "wss://rpc.turing-staging.oak.tech",
    mnemonic,
    scheduleLimit: 6 * 30 * 24 * 60 * 60 * 1000,
  },
};
