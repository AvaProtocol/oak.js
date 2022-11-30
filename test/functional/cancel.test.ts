import _ from 'lodash';
import { ApiPromise } from '@polkadot/api';
import type { KeyringPair } from '@polkadot/keyring/types';

import { getPolkadotApi, sendExtrinsic, getDynamicDispatchExtrinsicParams, scheduleDynamicDispatchTaskAndVerify, cancelTaskAndVerify, SECTION_NAME, checkBalance, getContext } from '../utils/helpFn';
import { AutomationTimeApi } from '../utils';

let polkadotApi: ApiPromise;
let automationTimeApi: AutomationTimeApi;
let keyringPair: KeyringPair;

const initialize = async () => {
  jest.setTimeout(540000);
  polkadotApi = await getPolkadotApi();
  const context = await getContext(polkadotApi);
  automationTimeApi = context.automationTimeApi;
  keyringPair = context.keyringPair;
}

beforeEach(() => initialize());
afterEach(() => polkadotApi.disconnect());

test('Cancel failed with incorrect format taskID', async () => {
  const nonexistentTaskID = "A string(<32 bytes).";
  await checkBalance(polkadotApi, keyringPair);

  // Cancel failed with incorrect format taskID
  await expect(automationTimeApi.buildCancelTaskExtrinsic(keyringPair, nonexistentTaskID)).rejects.toBeInstanceOf(Error);
});

test('Cancel failed with nonexistent taskID', async () => {
  // Please put a string of length greater than or equal to 32 bytes here, and make sure it is a non-existing taskID.
  const nonexistentTaskID = "12345678901234567890123456789012";
  await checkBalance(polkadotApi, keyringPair);

  const cancelExtrinsicHex = await automationTimeApi.buildCancelTaskExtrinsic(keyringPair, nonexistentTaskID);
  await expect(sendExtrinsic(polkadotApi, cancelExtrinsicHex)).rejects.toThrow(`${SECTION_NAME}.TaskDoesNotExist`);
});

test('Repeated cancellation of scheduleDynamicDispatchTaskExtrinsic will fail.', async () => {
  await checkBalance(polkadotApi, keyringPair);
  // Send transfer extrinsic
  const extrinsicParams = await getDynamicDispatchExtrinsicParams(polkadotApi, 'fixed');
  const { schedule: { fixed: { executionTimes } } } = extrinsicParams;

  const taskID = await scheduleDynamicDispatchTaskAndVerify(automationTimeApi, keyringPair, extrinsicParams);

  // Cancel task
  await cancelTaskAndVerify(automationTimeApi, keyringPair, taskID, executionTimes[0]);

  // Repeated cancellation of scheduleNativeTransferExtrinsic will fail.
  const cancelExtrinsicHex = await automationTimeApi.buildCancelTaskExtrinsic(keyringPair, taskID);
  await expect(sendExtrinsic(polkadotApi, cancelExtrinsicHex)).rejects.toThrow(`${SECTION_NAME}.TaskDoesNotExist`);
});