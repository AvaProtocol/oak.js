import _ from 'lodash';
import { sendExtrinsic, getNativeTransferExtrinsicParams, getNotifyExtrinsicParams, cancelTaskAndVerify, SECTION_NAME, checkBalance, getContext, scheduleNotifyTaskAndVerify, scheduleNativeTransferAndVerify } from './helpFn';

beforeEach(() => {
  jest.setTimeout(540000);
});

test('Cancel failed with incorrect format taskID', async () => {
  const nonexistentTaskID = "A string(<32 bytes).";

  const { scheduler, keyringPair } = await getContext();
  await checkBalance(keyringPair);

  // Cancel failed with incorrect format taskID
  await expect(scheduler.buildCancelTaskExtrinsic(keyringPair, nonexistentTaskID)).rejects.toBeInstanceOf(Error);
});

test('Cancel failed with nonexistent taskID', async () => {
  // Please put a string of length greater than or equal to 32 bytes here, and make sure it is a non-existing taskID.
  const nonexistentTaskID = "12345678901234567890123456789012";
  
  const { scheduler, keyringPair } = await getContext();
  await checkBalance(keyringPair);

  const cancelExtrinsicHex = await scheduler.buildCancelTaskExtrinsic(keyringPair, nonexistentTaskID);
  await expect(sendExtrinsic(scheduler, cancelExtrinsicHex)).rejects.toThrow(`${SECTION_NAME}.TaskDoesNotExist`);
});

test('Repeated cancellation of scheduleNotifyExtrinsic will fail.', async () => {
  const { scheduler, observer, keyringPair } = await getContext();
  await checkBalance(keyringPair);
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
  const { scheduler, observer, keyringPair } = await getContext();
  await checkBalance(keyringPair);
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
