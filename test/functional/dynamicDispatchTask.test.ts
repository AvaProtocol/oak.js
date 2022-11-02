import _ from 'lodash';
import { getContext, scheduleDynamicDispatchTaskAndVerify, cancelTaskAndVerify, getDynamicDispatchExtrinsicParams, SECTION_NAME, sendExtrinsic } from './helpFn';

beforeEach(() => { jest.setTimeout(540000); });

/**
 * dynamicDispatchTask.fixed schedule and cancel succeed
 */
test('dynamicDispatchTask.fixed schedule and cancel succeed', async () => {
  const { scheduler, observer, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { schedule: { fixed: { executionTimes } } } = extrinsicParams;

  const taskID = await scheduleDynamicDispatchTaskAndVerify(scheduler, observer, keyringPair, extrinsicParams);

  // Cancel task and verify
  await cancelTaskAndVerify(scheduler, observer, keyringPair, taskID, executionTimes[0]);
});

/**
 * dynamicDispatchTask.recurring schedule and cancel succeed
 */
test('dynamicDispatchTask.recurring schedule and cancel succeed', async () => {
  const { scheduler, observer, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { schedule: { recurring: { nextExecutionTime } } } = extrinsicParams;

  const taskID = await scheduleDynamicDispatchTaskAndVerify(scheduler, observer, keyringPair, extrinsicParams);

  // Cancel task and verify
  await cancelTaskAndVerify(scheduler, observer, keyringPair, taskID, nextExecutionTime);
});

/**
 * dynamicDispatchTask.recurring with frequency that is not a multiply of 3600(3600-1) fails
 */
test('dynamicDispatchTask.recurring with frequency that is not a multiply of 3600(3600-1) fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.frequency -= 1;

  // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
  const extrinsicHex = await scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.InvalidTime`);
});

/**
 * scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
 */
test('dynamicDispatchTask.recurring with frequency that is not a multiply of 3600(3600*0.5) fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.frequency *= 0.5;
  schedule.recurring.frequency = Math.ceil(schedule.recurring.frequency);

  // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
  const extrinsicHex = await scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.InvalidTime`);
});

/**
 * dynamicDispatchTask.recurring with frequency that is not a multiply of 3600(3600*3.3) fails
 */
test('dynamicDispatchTask.recurring with frequency that is not a multiply of 3600(3600*3.3) fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.frequency *= 1.3;
  schedule.recurring.frequency = Math.ceil(schedule.recurring.frequency);

  // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
  const extrinsicHex = await scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.InvalidTime`);
});

/**
 * dynamicDispatchTask.recurring with frequency that is 0 fails
 */
test('dynamicDispatchTask.recurring with frequency that is 0 fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.frequency = 0;

  // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
  // const extrinsicHex = await scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call);
  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with frequency that is negtive integer fails
 */
test('dynamicDispatchTask.recurring with frequency that is negtive integer fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.frequency = -1;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with frequency that is larger than Number.MAX_SAFE_INTEGER fails
 */
test('dynamicDispatchTask.recurring with frequency that is larger than Number.MAX_SAFE_INTEGER fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.frequency = Number.MAX_SAFE_INTEGER + 1;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with frequency that is string fails
 */
test('dynamicDispatchTask.recurring with frequency that is string fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.frequency = "123123";

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with frequency that is object fails
 */
test('dynamicDispatchTask.recurring with frequency that is object fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.frequency = {};

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with frequency that is null fails
 */
test('dynamicDispatchTask.recurring with frequency that is null fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.frequency = null;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with frequency that is undefined fails
 */
test('dynamicDispatchTask.recurring with frequency that is undefined fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.frequency = undefined;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring nextExecutionTime on non-o’clock(+5min) fails.
 */
test('dynamicDispatchTask.recurring nextExecutionTime on non-o’clock(+5min) fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.nextExecutionTime += 5*60;

  // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
  const extrinsicHex = await scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.InvalidTime`);
});

/**
 * dynamicDispatchTask.recurring nextExecutionTime on non-o’clock(+30min) fails.
 */
test('dynamicDispatchTask.recurring nextExecutionTime on non-o’clock(+30min) fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.nextExecutionTime += 30*60;

  // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
  const extrinsicHex = await scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.InvalidTime`);
});

/**
 * dynamicDispatchTask.recurring nextExecutionTime on non-o’clock(+45min) fails.
 */
test('dynamicDispatchTask.recurring nextExecutionTime on non-o’clock(+45min) fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.nextExecutionTime += 30*60;

  // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
  const extrinsicHex = await scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.InvalidTime`);
});


/**
 * dynamicDispatchTask.recurring with nextExecutionTime that is 0 fails
 */
 test('dynamicDispatchTask.recurring with nextExecutionTime that is 0 fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.nextExecutionTime = 0;

  // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
  // const extrinsicHex = await scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call);
  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with nextExecutionTime that is negtive integer fails
 */
test('dynamicDispatchTask.recurring with nextExecutionTime that is negtive integer fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.nextExecutionTime = -1;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with nextExecutionTime that is larger than Number.MAX_SAFE_INTEGER fails
 */
test('dynamicDispatchTask.recurring with nextExecutionTime that is larger than Number.MAX_SAFE_INTEGER fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.nextExecutionTime = Number.MAX_SAFE_INTEGER + 1;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with nextExecutionTime that is string fails
 */
test('dynamicDispatchTask.recurring with nextExecutionTime that is string fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.nextExecutionTime = "123123";

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with frequency that is object fails
 */
test('dynamicDispatchTask.recurring with nextExecutionTime that is object fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.nextExecutionTime = {};

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with nextExecutionTime that is null fails
 */
test('dynamicDispatchTask.recurring with nextExecutionTime that is null fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.nextExecutionTime = null;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with nextExecutionTime that is undefined fails
 */
test('dynamicDispatchTask.recurring with nextExecutionTime that is undefined fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.recurring.nextExecutionTime = undefined;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.fixed schedule with execution time on non-o’clock(+5min) fails
 */
test('dynamicDispatchTask.fixed schedule with execution time on non-o’clock(+5min) fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.fixed.executionTimes[0] += (60*5);

  // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
  const extrinsicHex = await scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.InvalidTime`);
});

/**
 * dynamicDispatchTask.fixed schedule with execution time on non-o’clock(+30min) fails
 */
test('dynamicDispatchTask.fixed schedule with execution time on non-o’clock(+30min) fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.fixed.executionTimes[0] += (60*30);

  // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
  const extrinsicHex = await scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.InvalidTime`);
});

/**
 * dynamicDispatchTask.fixed schedule with execution time on non-o’clock(+45min) fails
 */
test('dynamicDispatchTask.fixed schedule with execution time on non-o’clock(+45min) fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.fixed.executionTimes[0] += (60*30);

  const extrinsicHex = await scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call);
  await expect(sendExtrinsic(scheduler, extrinsicHex)).rejects.toThrow(`${SECTION_NAME}.InvalidTime`);
});

/**
 * dynamicDispatchTask.fixed schedule with execution time that is string fails
 */
test('dynamicDispatchTask.fixed schedule with filling execution time string fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.fixed.executionTimes = "abc";

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.fixed schedule with execution time that is  object fails
 */
test('dynamicDispatchTask.fixed schedule with filling execution time object fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.fixed.executionTimes = {};

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.fixed schedule with execution time that is null fails
 */
test('dynamicDispatchTask.fixed schedule with filling execution time null fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.fixed.executionTimes = null;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.fixed schedule with execution time that is undefined fails
 */
test('dynamicDispatchTask.fixed schedule with filling execution time undefined fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.fixed.executionTimes = undefined;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.fixed schedule with empty execution times array fails
 */
test('dynamicDispatchTask.fixed schedule with empty execution times array fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.fixed.executionTimes = [];

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.fixed schedule with execution times array that is string fails
 */
test('dynamicDispatchTask.fixed schedule with execution times array that is string fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.fixed.executionTimes = "abc";

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.fixed schedule with execution times array that is object fails
 */
test('dynamicDispatchTask.fixed schedule with execution times array that is object fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.fixed.executionTimes = {};

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.fixed schedule with execution times array that is null fails
 */
test('dynamicDispatchTask.fixed schedule with execution times array that is null fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.fixed.executionTimes = null;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.fixed schedule with execution times array that is undefined fails
 */
test('dynamicDispatchTask.fixed schedule with execution times array that is undefined fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule, call } = extrinsicParams;
  schedule.fixed.executionTimes = undefined;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.fixed with null call fails
 */
 test('dynamicDispatchTask.fixed with null call fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule } = extrinsicParams;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, null)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.fixed with undefined call fails
 */
 test('dynamicDispatchTask.fixed with undefined call fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, schedule } = extrinsicParams;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, undefined)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with null call fails
 */
 test('dynamicDispatchTask.recurring with null call fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule } = extrinsicParams;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, null)).rejects.toThrowError();
});


/**
 * dynamicDispatchTask.recurring with undefined call fails
 */
test('dynamicDispatchTask.recurring with undefined call fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, schedule } = extrinsicParams;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, undefined)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.fixed with null schedule fails
 */
 test('dynamicDispatchTask.fixed with null schedule fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, call } = extrinsicParams;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, null, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.fixed with undefined schedule fails
 */
 test('dynamicDispatchTask.fixed with undefined schedule fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('fixed');
  const { providedID, call } = extrinsicParams;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, undefined, call)).rejects.toThrowError();
});

/**
 * dynamicDispatchTask.recurring with null schedule fails
 */
 test('dynamicDispatchTask.recurring with null schedule fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, call } = extrinsicParams;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, null, call)).rejects.toThrowError();
});


/**
 * dynamicDispatchTask.recurring with undefined schedule fails
 */
test('dynamicDispatchTask.recurring with undefined schedule fails', async () => {
  const { scheduler, keyringPair } = await getContext();
  const extrinsicParams = await getDynamicDispatchExtrinsicParams('recurring');
  const { providedID, call } = extrinsicParams;

  await expect(scheduler.buildScheduleDynamicDispatchTask(keyringPair, providedID, undefined, call)).rejects.toThrowError();
});
