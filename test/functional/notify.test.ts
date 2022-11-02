import _ from 'lodash';
import { SECTION_NAME, sendExtrinsic, getNotifyExtrinsicParams, cancelTaskAndVerify, scheduleNotifyTaskAndVerify, getContext, checkBalance } from './helpFn';

beforeEach(() => {
  jest.setTimeout(540000);
});

test('scheduler.buildScheduleNotifyExtrinsic works', async () => {
  const { scheduler, observer, keyringPair } = await getContext();
  await checkBalance(keyringPair);
  const extrinsicParams = getNotifyExtrinsicParams();
  const { executionTimestamps } = extrinsicParams;

  // schedule notify task and verify
  const taskID = await scheduleNotifyTaskAndVerify(scheduler, observer, keyringPair, extrinsicParams);

  // Cancel task and verify
  await cancelTaskAndVerify(scheduler, observer, keyringPair, taskID, executionTimestamps[0]);
});

test('scheduler.buildScheduleNotifyExtrinsic will fail with duplicate providerID', async () => {
  const { scheduler, observer, keyringPair } = await getContext();
  await checkBalance(keyringPair);
  const extrinsicParams = getNotifyExtrinsicParams();
  const { providedID,  executionTimestamps, message } = extrinsicParams;
  
  // schedule notify task and verify
  await scheduleNotifyTaskAndVerify(scheduler, observer, keyringPair, extrinsicParams);

  // scheduler.buildScheduleNotifyExtrinsic will fail with duplicate providerID
  const extrinsicHex = await scheduler.buildScheduleNotifyExtrinsic(keyringPair, providedID, executionTimestamps, message);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.DuplicateTask`);
});

test('scheduler.buildScheduleNotifyExtrinsic will fail with empty message', async () => {
  const { scheduler, keyringPair } = await getContext();
  await checkBalance(keyringPair);
  const { providedID,  executionTimestamps } = getNotifyExtrinsicParams();
  const message = null;
  
  // scheduler.buildScheduleNotifyExtrinsic will fail with empty message
  const extrinsicHex = await scheduler.buildScheduleNotifyExtrinsic(keyringPair, providedID, executionTimestamps, message);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.EmptyMessage`);
});

test('scheduler.buildScheduleNotifyExtrinsic will fail with empty providedID', async () => {
  const { scheduler, keyringPair } = await getContext();
  await checkBalance(keyringPair);
  const { message, executionTimestamps } = getNotifyExtrinsicParams();
  const providedID = null;
  
  // scheduler.buildScheduleNotifyExtrinsic will fail with empty providedID
  const extrinsicHex = await scheduler.buildScheduleNotifyExtrinsic(keyringPair, providedID, executionTimestamps, message);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.EmptyProvidedId`);
});
