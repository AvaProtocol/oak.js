import _ from 'lodash';
import { sendExtrinsic, SECTION_NAME, getNativeTransferExtrinsicParams, getContext, cancelTaskAndVerify, checkBalance, scheduleNativeTransferAndVerify } from './helpFn';

beforeEach(() => {
  jest.setTimeout(540000);
});

test('scheduler.buildScheduleNativeTransferExtrinsic works', async () => {
  const { scheduler, observer, keyringPair } = await getContext();
  await checkBalance(keyringPair);
  const extrinsicParams = getNativeTransferExtrinsicParams();
  const { executionTimestamps } = extrinsicParams;

  // schedule notify task and verify
  const taskID = await scheduleNativeTransferAndVerify(scheduler, observer, keyringPair, extrinsicParams);

  // Cancel task and verify
  await cancelTaskAndVerify(scheduler, observer, keyringPair, taskID, executionTimestamps[0]);
});

test('scheduler.buildScheduleNativeTransferExtrinsic will fail with duplicate providerID', async () => {
  const { scheduler, observer, keyringPair } = await getContext();
  await checkBalance(keyringPair);
  const extrinsicParams = getNativeTransferExtrinsicParams();
  const { executionTimestamps, providedID, receiverAddress, amount } = extrinsicParams;

  // schedule notify task and verify
  await scheduleNativeTransferAndVerify(scheduler, observer, keyringPair, extrinsicParams);

  // scheduler.buildScheduleNativeTransferExtrinsic will fail with duplicate providerID
  const extrinsicHex = await scheduler.buildScheduleNativeTransferExtrinsic(keyringPair, providedID, executionTimestamps, receiverAddress, amount);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.DuplicateTask`);
});

test('scheduler.buildScheduleNativeTransferExtrinsic will fail with incorrect format receiver address', async () => {
  const { scheduler, keyringPair } = await getContext();
  await checkBalance(keyringPair);
  const { amount, providedID, executionTimestamps } = getNativeTransferExtrinsicParams();
  const receiverAddress = 'incorrect format receiver address';

  // scheduler.buildScheduleNativeTransferExtrinsic will fail with incorrect format receiver address
  await expect(scheduler.buildScheduleNativeTransferExtrinsic(keyringPair, providedID, executionTimestamps, receiverAddress, amount)).rejects.toBeInstanceOf(Error);
});

test('scheduler.buildScheduleNativeTransferExtrinsic will fail with empty providedID', async () => {
  const { scheduler, keyringPair } = await getContext();
  await checkBalance(keyringPair);
  const { amount, receiverAddress, executionTimestamps } = getNativeTransferExtrinsicParams();
  const providedID = null;

  //scheduler.buildScheduleNativeTransferExtrinsic will fail with empty providedID
  const extrinsicHex = await scheduler.buildScheduleNativeTransferExtrinsic(keyringPair, providedID, executionTimestamps, receiverAddress, amount);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.EmptyProvidedId`);
});