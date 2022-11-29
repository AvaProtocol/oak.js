import _ from 'lodash';
import { ApiPromise } from '@polkadot/api';
import type { KeyringPair } from '@polkadot/keyring/types';

import { sendExtrinsic, getNativeTransferExtrinsicParams, getNotifyExtrinsicParams, cancelTaskAndVerify, SECTION_NAME, checkBalance, getContext, scheduleNotifyTaskAndVerify, scheduleNativeTransferAndVerify } from './helpFn';
import { getPolkadotApi } from '../utils/helpFn';
import { OakChains } from '../utils/constants'
import { Observer, Scheduler } from '../utils';

let api: ApiPromise;
let scheduler: Scheduler;
let observer: Observer;
let keyringPair: KeyringPair;

const initialize = async () => {
  jest.setTimeout(540000);
  api = await getPolkadotApi(OakChains.STUR, { providerUrl: process.env.PROVIDER_URL });
  const { scheduler: contextSchduler, observer: contextObserver, keyringPair: contextkeyringPair } = await getContext(api);
  scheduler = contextSchduler;
  observer = contextObserver;
  keyringPair = contextkeyringPair;
}

beforeEach(() => initialize());
afterEach(() => api.disconnect());

test('Cancel failed with incorrect format taskID', async () => {
  const nonexistentTaskID = "A string(<32 bytes).";
  await checkBalance(api, keyringPair);

  // Cancel failed with incorrect format taskID
  await expect(scheduler.buildCancelTaskExtrinsic(keyringPair, nonexistentTaskID)).rejects.toBeInstanceOf(Error);
});

test('Cancel failed with nonexistent taskID', async () => {
  // Please put a string of length greater than or equal to 32 bytes here, and make sure it is a non-existing taskID.
  const nonexistentTaskID = "12345678901234567890123456789012";
  
  const { scheduler, keyringPair } = await getContext(api);
  await checkBalance(api, keyringPair);

  const cancelExtrinsicHex = await scheduler.buildCancelTaskExtrinsic(keyringPair, nonexistentTaskID);
  await expect(sendExtrinsic(scheduler, cancelExtrinsicHex)).rejects.toThrow(`${SECTION_NAME}.TaskDoesNotExist`);
});

test('Repeated cancellation of scheduleNotifyExtrinsic will fail.', async () => {
  await checkBalance(api, keyringPair);
  const extrinsicParams = getNotifyExtrinsicParams();
  const { executionTimestamps } = extrinsicParams;

  // Send notify extrinsic
  const taskID = await scheduleNotifyTaskAndVerify(scheduler, observer, keyringPair, extrinsicParams);

  // Cancel task
  await cancelTaskAndVerify(scheduler, observer, keyringPair, taskID, executionTimestamps[0]);

  // Repeated cancellation of scheduleNotifyExtrinsic will fail.
  const cancelExtrinsicHex = await scheduler.buildCancelTaskExtrinsic(keyringPair, taskID);
  await expect(sendExtrinsic(scheduler, cancelExtrinsicHex)).rejects.toThrow(`${SECTION_NAME}.TaskDoesNotExist`);
});

test('Repeated cancellation of scheduleNativeTransferExtrinsic will fail.', async () => {
  await checkBalance(api, keyringPair);
  const extrinsicParams = getNativeTransferExtrinsicParams();
  const { executionTimestamps } = extrinsicParams;

  // Send transfer extrinsic
  const taskID = await scheduleNativeTransferAndVerify(scheduler, observer,  keyringPair, extrinsicParams);

  // Cancel task
  await cancelTaskAndVerify(scheduler, observer, keyringPair, taskID, executionTimestamps[0]);

  // Repeated cancellation of scheduleNativeTransferExtrinsic will fail.
  const cancelExtrinsicHex = await scheduler.buildCancelTaskExtrinsic(keyringPair, taskID);
  await expect(sendExtrinsic(scheduler, cancelExtrinsicHex)).rejects.toThrow(`${SECTION_NAME}.TaskDoesNotExist`);
});
