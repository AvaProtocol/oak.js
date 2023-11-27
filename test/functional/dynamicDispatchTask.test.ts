import { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";

import {
  getPolkadotApi,
  getContext,
  scheduleDynamicDispatchTaskAndVerify,
  cancelTaskAndVerify,
  getDynamicDispatchExtrinsicParams,
  SECTION_NAME,
  sendExtrinsic,
  getPastTime,
} from "../utils/helpFn";
import { AutomationTimeApi } from "../utils";
import {
  DEFAULT_TIMEOUT_INITIALIZE,
  DEFAULT_TIMEOUT_PER_TEST,
} from "../utils/constants";

let polkadotApi: ApiPromise;
let automationTimeApi: AutomationTimeApi;
let keyringPair: KeyringPair;

const initialize = async () => {
  polkadotApi = await getPolkadotApi();
  const context = await getContext(polkadotApi);
  automationTimeApi = context.automationTimeApi;
  keyringPair = context.keyringPair;
};

describe("test-dynamic-dispatch-task", () => {
  beforeAll(() => initialize(), DEFAULT_TIMEOUT_INITIALIZE);
  afterAll(() => polkadotApi?.disconnect());

  /**
   * dynamicDispatchTask.fixed schedule and cancel succeed
   */
  it(
    "dynamicDispatchTask.fixed schedule and cancel succeed",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );

      const {
        schedule: {
          fixed: { executionTimes },
        },
      } = extrinsicParams;

      const taskID = await scheduleDynamicDispatchTaskAndVerify(
        automationTimeApi,
        keyringPair,
        extrinsicParams,
      );

      expect(typeof taskID).toBe("string");

      // Cancel task and verify
      await cancelTaskAndVerify(
        automationTimeApi,
        keyringPair,
        taskID,
        executionTimes[0],
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring schedule and cancel succeed
   */
  it(
    "dynamicDispatchTask.recurring schedule and cancel succeed",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const {
        schedule: {
          recurring: { nextExecutionTime },
        },
      } = extrinsicParams;

      const taskID = await scheduleDynamicDispatchTaskAndVerify(
        automationTimeApi,
        keyringPair,
        extrinsicParams,
      );

      expect(typeof taskID).toBe("string");

      // Cancel task and verify
      await cancelTaskAndVerify(
        automationTimeApi,
        keyringPair,
        taskID,
        nextExecutionTime,
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Call dynamicDispatchTask.recurring task with nextExecutionTime that is is a past time will throw automationTime.PastTime error
   */
  it(
    "call dynamicDispatchTask.recurring task with nextExecutionTime that is a past time will throw automationTime.PastTime error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime = getPastTime();

      // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
      const extrinsicHex =
        await automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        );
      await expect(sendExtrinsic(polkadotApi, extrinsicHex)).rejects.toThrow(
        `${SECTION_NAME}.PastTime`,
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with frequency that is not a multiply of 3600(3600-1) fails
   */
  it(
    "dynamicDispatchTask.recurring with frequency that is not a multiply of 3600(3600-1) fails",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.frequency -= 1;

      // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
      const extrinsicHex =
        await automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        );
      await expect(sendExtrinsic(polkadotApi, extrinsicHex)).rejects.toThrow(
        `${SECTION_NAME}.InvalidTime`,
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
   */
  it(
    "dynamicDispatchTask.recurring with frequency that is not a multiply of a timeslot fails",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.frequency *= 0.5;
      schedule.recurring.frequency = Math.ceil(schedule.recurring.frequency);

      // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
      const extrinsicHex =
        await automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        );
      await expect(sendExtrinsic(polkadotApi, extrinsicHex)).rejects.toThrow(
        `${SECTION_NAME}.InvalidTime`,
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with frequency that is not a multiply of 3600(3600*3.3) fails
   */
  it(
    "dynamicDispatchTask.recurring with frequency that is not a multiply of 3600(3600*3.3) fails",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.frequency *= 1.3;
      schedule.recurring.frequency = Math.ceil(schedule.recurring.frequency);

      // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
      const extrinsicHex =
        await automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        );
      await expect(sendExtrinsic(polkadotApi, extrinsicHex)).rejects.toThrow(
        `${SECTION_NAME}.InvalidTime`,
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with frequency that is 0 fails will throw not a positive integer error
   */
  it(
    "build dynamicDispatchTask.recurring task with frequency that is 0 fails will throw not a positive integer error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.frequency = 0;

      // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
      // const extrinsicHex = await scheduler.buildScheduleDynamicDispatchTask(keyringPair, schedule, call);
      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("frequency must be a positive integer");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with frequency that is negtive integer will throw not a positive integer error
   */
  it(
    "build dynamicDispatchTask.recurring task with frequency that is negtive integer will throw not a positive integer error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.frequency = -1;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("frequency must be a positive integer");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with frequency that is larger than Number.MAX_SAFE_INTEGER will throw too large error
   */
  it(
    "build dynamicDispatchTask.recurring task with frequency that is larger than Number.MAX_SAFE_INTEGER will throw too large error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.frequency = Number.MAX_SAFE_INTEGER + 1;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow(
        'createType(Call):: Call: failed decoding automationTime.scheduleDynamicDispatchTask:: Struct: failed on args: {"schedule":"{\\"_enum\\":{\\"Fixed\\":\\"{\\\\\\"executionTimes\\\\\\":\\\\\\"Vec<u64>\\\\\\"}\\",\\"Recurring\\":\\"{\\\\\\"nextExecutionTime\\\\\\":\\\\\\"u64\\\\\\",\\\\\\"frequency\\\\\\":\\\\\\"u64\\\\\\"}\\"}}","call":"Call"}:: Struct: failed on schedule: {"_enum":{"Fixed":"{\\"executionTimes\\":\\"Vec<u64>\\"}","Recurring":"{\\"nextExecutionTime\\":\\"u64\\",\\"frequency\\":\\"u64\\"}"}}:: Enum(recurring):: Struct: failed on frequency: u64:: Number needs to be an integer <= Number.MAX_SAFE_INTEGER, i.e. 2 ^ 53 - 1',
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with frequency that is string will throw not a positive integer error
   */
  it(
    "dynamicDispatchTask.recurring with frequency that is string will throw not a positive integer error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.frequency = "123123";

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("frequency must be a positive integer");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with frequency that is object will throw not a positive integer error
   */
  it(
    "build dynamicDispatchTask.recurring task with frequency that is object will throw not a positive integer error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.frequency = {};

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("frequency must be a positive integer");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring with frequency that is null will throw not a positive integer error
   */
  it(
    "build dynamicDispatchTask.recurring with frequency that is null will throw not a positive integer error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.frequency = null;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("frequency must be a positive integer");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with frequency that is undefined will throw not a positive integer error
   */
  it(
    "build dynamicDispatchTask.recurring task with frequency that is undefined will throw not a positive integer error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.frequency = undefined;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("frequency must be a positive integer");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * build dynamicDispatchTask.recurring task with nextExecutionTime not on 10 minutes time slot(+5min) will throw automationTime.InvalidTime error.
   */
  it(
    "build dynamicDispatchTask.recurring task with nextExecutionTime not on 10 minutes time slot(+1min) will throw automationTime.InvalidTime error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime += 60 * 1;

      // automationTimeApi.buildScheduleDynamicDispatchTask will fail with invalid frequency
      const extrinsicHex =
        await automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        );
      await expect(sendExtrinsic(polkadotApi, extrinsicHex)).rejects.toThrow(
        `${SECTION_NAME}.InvalidTime`,
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with nextExecutionTime not on non-o’clock(+7) will throw automationTime.InvalidTime error.
   */
  it(
    "build dynamicDispatchTask.recurring task with nextExecutionTime not on 10 minutes time slot(+5min) will throw automationTime.InvalidTime error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime += 30 * 5;

      // automationTimeApi.buildScheduleDynamicDispatchTask will fail with invalid frequency
      const extrinsicHex =
        await automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        );
      await expect(sendExtrinsic(polkadotApi, extrinsicHex)).rejects.toThrow(
        `${SECTION_NAME}.InvalidTime`,
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * build dynamicDispatchTask.recurring task nextExecutionTime not on 10 minutes time slot(+5min) will throw automationTime.InvalidTime error.
   */
  it(
    "build dynamicDispatchTask.recurring task with nextExecutionTime not on 10 minutes time slot(+7min) will throw automationTime.InvalidTime error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime += 30 * 7;

      // automationTimeApi.buildScheduleDynamicDispatchTask will fail with invalid frequency
      const extrinsicHex =
        await automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        );
      await expect(sendExtrinsic(polkadotApi, extrinsicHex)).rejects.toThrow(
        `${SECTION_NAME}.InvalidTime`,
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with nextExecutionTime that is 0 will throw not a positive integer error
   */
  it(
    "build dynamicDispatchTask.recurring task with nextExecutionTime that is 0 will throw not a positive integer error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime = 0;

      // automationTimeApi.buildScheduleDynamicDispatchTask will fail with invalid frequency
      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("nextExecutionTime must be a positive integer");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with nextExecutionTime that is negtive integer fails
   */
  it(
    "build dynamicDispatchTask.recurring task with nextExecutionTime that is negtive integer will throw not a positive integer error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime = -1;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("nextExecutionTime must be a positive integer");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with nextExecutionTime that is larger than Number.MAX_SAFE_INTEGER fails
   */
  it(
    "dynamicDispatchTask.recurring with nextExecutionTime that is larger than Number.MAX_SAFE_INTEGER will throw too large error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime = Number.MAX_SAFE_INTEGER + 1;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow(
        'createType(Call):: Call: failed decoding automationTime.scheduleDynamicDispatchTask:: Struct: failed on args: {"schedule":"{\\"_enum\\":{\\"Fixed\\":\\"{\\\\\\"executionTimes\\\\\\":\\\\\\"Vec<u64>\\\\\\"}\\",\\"Recurring\\":\\"{\\\\\\"nextExecutionTime\\\\\\":\\\\\\"u64\\\\\\",\\\\\\"frequency\\\\\\":\\\\\\"u64\\\\\\"}\\"}}","call":"Call"}:: Struct: failed on schedule: {"_enum":{"Fixed":"{\\"executionTimes\\":\\"Vec<u64>\\"}","Recurring":"{\\"nextExecutionTime\\":\\"u64\\",\\"frequency\\":\\"u64\\"}"}}:: Enum(recurring):: Struct: failed on nextExecutionTime: u64:: Number needs to be an integer <= Number.MAX_SAFE_INTEGER, i.e. 2 ^ 53 - 1',
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with nextExecutionTime that is string will throw not a positive integer error
   */
  it(
    "build dynamicDispatchTask.recurring task with nextExecutionTime that is string will throw not a positive integer error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime = "123123";

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("nextExecutionTime must be a positive integer");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with nextExecutionTime that is object will throw not a positive integer error
   */
  it(
    "build dynamicDispatchTask.recurring task with nextExecutionTime that is object will throw not a positive integer error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime = {};

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("nextExecutionTime must be a positive integer");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with nextExecutionTime that is null will throw not a positive integer error
   */
  it(
    "build dynamicDispatchTask.recurring task with nextExecutionTime that is null will throw not a positive integer error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime = null;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("nextExecutionTime must be a positive integer");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with nextExecutionTime that is undefined will throw not a positive integer error
   */
  it(
    "build dynamicDispatchTask.recurring task with nextExecutionTime that is undefined will throw not a positive integer error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime = undefined;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("nextExecutionTime must be a positive integer");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Send dynamicDispatchTask.fixed task with execution time not on 10 minutes time slot(+5min) will throw automationTime.InvalidTime error
   */
  it(
    "send dynamicDispatchTask.fixed task with execution time not on 10 minutes time slot(+1min) will throw automationTime.InvalidTime error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes[0] += 60 * 1;

      // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
      const extrinsicHex =
        await automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        );
      await expect(sendExtrinsic(polkadotApi, extrinsicHex)).rejects.toThrow(
        `${SECTION_NAME}.InvalidTime`,
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Send dynamicDispatchTask.fixed task with execution time not on 10 minutes time slot(+5min) will throw automationTime.InvalidTime error
   */
  it(
    "send dynamicDispatchTask.fixed task with execution time not on 10 minutes time slot(+5min) will throw automationTime.InvalidTime error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes[0] += 60 * 5;

      // scheduler.buildScheduleDynamicDispatchTask will fail with invalid frequency
      const extrinsicHex =
        await automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        );
      await expect(sendExtrinsic(polkadotApi, extrinsicHex)).rejects.toThrow(
        `${SECTION_NAME}.InvalidTime`,
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Send dynamicDispatchTask.fixed task with execution time not on 10 minutes time slot(+7min) will throw automationTime.InvalidTime error
   */
  it(
    "send dynamicDispatchTask.fixed task with execution time not on 10 minutes time slot(+7min) will throw automationTime.InvalidTime error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes[0] += 60 * 7;

      const extrinsicHex =
        await automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        );
      await expect(sendExtrinsic(polkadotApi, extrinsicHex)).rejects.toThrow(
        `${SECTION_NAME}.InvalidTime`,
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.fixed task with execution time that is string will throw not an array error
   */
  it(
    "build dynamicDispatchTask.fixed task with filling execution time string will throw not an array error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes = "abc";

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("executionTimes is not an array");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.fixed task schedule with execution time that is  object will throw not an array error
   */
  it(
    "build dynamicDispatchTask.fixed task with filling execution time object will throw not an array error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes = {};

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("executionTimes is not an array");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.fixed task with execution time that is null will throw not an array error
   */
  it(
    "build dynamicDispatchTask.fixed task with filling execution time null will throw not an array error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes = null;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("executionTimes is not an array");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.fixed task with execution time that is undefined will throw not an array error
   */
  it(
    "build dynamicDispatchTask.fixed task with filling execution time undefined will throw not an array error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes = undefined;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("executionTimes is not an array");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.fixed task with empty execution times array will throw empty array error
   */
  it(
    "build dynamicDispatchTask.fixed task schedule with empty execution times array will throw empty array error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes = [];

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("executionTimes is empty");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.fixed task with execution times array that is string will throw not an array error
   */
  it(
    "build dynamicDispatchTask.fixed task schedule with execution times array that is string will throw not an array error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes = "abc";

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("executionTimes is not an array");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.fixed task schedule with execution times array that is object fails
   */
  it(
    "build dynamicDispatchTask.fixed task schedule with execution times array that is object will throw not an array",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes = {};

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("executionTimes is not an array");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.fixed task with execution times array that is null will throw not an array task error
   */
  it(
    "build dynamicDispatchTask.fixed task with execution times array that is null will throw not an array task error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes = null;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("executionTimes is not an array");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.fixed task with execution times array that is undefined will throw not an array error
   */
  it(
    "build dynamicDispatchTask.fixed task with execution times array that is undefined will throw not an array error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes = undefined;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          call,
        ),
      ).rejects.toThrow("executionTimes is not an array");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.fixed task with null call will throw null call error
   */
  it(
    "build dynamicDispatchTask.fixed task with null  call will throw null call error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule } = extrinsicParams;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          null,
        ),
      ).rejects.toThrow(
        'createType(Call):: Call: failed decoding automationTime.scheduleDynamicDispatchTask:: Struct: failed on args: {"schedule":"{\\"_enum\\":{\\"Fixed\\":\\"{\\\\\\"executionTimes\\\\\\":\\\\\\"Vec<u64>\\\\\\"}\\",\\"Recurring\\":\\"{\\\\\\"nextExecutionTime\\\\\\":\\\\\\"u64\\\\\\",\\\\\\"frequency\\\\\\":\\\\\\"u64\\\\\\"}\\"}}","call":"Call"}:: Struct: failed on call: Call:: Call: Cannot decode value \'null\' of type object',
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.fixed task with undefined call will throw undefined call error
   */
  it(
    "build dynamicDispatchTask.fixed task with undefined call will throw undefined call error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule } = extrinsicParams;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          undefined,
        ),
      ).rejects.toThrow("call is null or undefined");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with null call will throw null call error
   */
  it(
    "build dynamicDispatchTask.recurring task with null call will throw null call error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule } = extrinsicParams;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          null,
        ),
      ).rejects.toThrow(
        'createType(Call):: Call: failed decoding automationTime.scheduleDynamicDispatchTask:: Struct: failed on args: {"schedule":"{\\"_enum\\":{\\"Fixed\\":\\"{\\\\\\"executionTimes\\\\\\":\\\\\\"Vec<u64>\\\\\\"}\\",\\"Recurring\\":\\"{\\\\\\"nextExecutionTime\\\\\\":\\\\\\"u64\\\\\\",\\\\\\"frequency\\\\\\":\\\\\\"u64\\\\\\"}\\"}}","call":"Call"}:: Struct: failed on call: Call:: Call: Cannot decode value \'null\' of type object',
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with undefined call fails
   */
  it(
    "build dynamicDispatchTask.recurrin task with undefined call will throw undefined call error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule } = extrinsicParams;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          schedule,
          undefined,
        ),
      ).rejects.toThrow("call is null or undefined");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.fixed task with null schedule will throw null object error
   */
  it(
    "build dynamicDispatchTask.fixed with null schedule will throw null object error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { call } = extrinsicParams;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          null,
          call,
        ),
      ).rejects.toThrow("Cannot read properties of null (reading 'recurring')");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.fixed task with undefined schedule will throw undefined object error
   */
  it(
    "build dynamicDispatchTask.fixed task with undefined schedule will throw undefined object error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { call } = extrinsicParams;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          undefined,
          call,
        ),
      ).rejects.toThrow(
        "Cannot read properties of undefined (reading 'recurring')",
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with null schedule fails will throw null object error
   */
  it(
    "build dynamicDispatchTask.recurring task with null schedule fails will throw null object error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { call } = extrinsicParams;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          null,
          call,
        ),
      ).rejects.toThrow("Cannot read properties of null (reading 'recurring')");
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * Build dynamicDispatchTask.recurring task with undefined schedule will throw undefind object error
   */
  it(
    "build dynamicDispatchTask.recurring task with undefined schedule will throw undefind object error",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { call } = extrinsicParams;

      await expect(
        automationTimeApi.buildScheduleDynamicDispatchTask(
          keyringPair,
          undefined,
          call,
        ),
      ).rejects.toThrow(
        "Cannot read properties of undefined (reading 'recurring')",
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );
});
