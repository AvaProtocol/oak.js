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
   * dynamicDispatchTask.recurring with nextExecutionTime that is is a past time fails
   */
  it(
    "dynamicDispatchTask.recurring with nextExecutionTime that is a past time fails",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime = Math.floor(
        new Date().valueOf() / 1000 - 1,
      );

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
    "dynamicDispatchTask.recurring with frequency that is not a multiply of 3600(3600*0.5) fails",
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
   * dynamicDispatchTask.recurring with frequency that is 0 fails
   */
  it(
    "dynamicDispatchTask.recurring with frequency that is 0 fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with frequency that is negtive integer fails
   */
  it(
    "dynamicDispatchTask.recurring with frequency that is negtive integer fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with frequency that is larger than Number.MAX_SAFE_INTEGER fails
   */
  it(
    "dynamicDispatchTask.recurring with frequency that is larger than Number.MAX_SAFE_INTEGER fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with frequency that is string fails
   */
  it(
    "dynamicDispatchTask.recurring with frequency that is string fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with frequency that is object fails
   */
  it(
    "dynamicDispatchTask.recurring with frequency that is object fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with frequency that is null fails
   */
  it(
    "dynamicDispatchTask.recurring with frequency that is null fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with frequency that is undefined fails
   */
  it(
    "dynamicDispatchTask.recurring with frequency that is undefined fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring nextExecutionTime on non-o’clock(+5min) fails.
   */
  it(
    "dynamicDispatchTask.recurring nextExecutionTime on non-o’clock(+5min) fails",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime += 5 * 60;

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
   * dynamicDispatchTask.recurring nextExecutionTime on non-o’clock(+30min) fails.
   */
  it(
    "dynamicDispatchTask.recurring nextExecutionTime on non-o’clock(+30min) fails",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime += 30 * 60;

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
   * dynamicDispatchTask.recurring nextExecutionTime on non-o’clock(+45min) fails.
   */
  it(
    "dynamicDispatchTask.recurring nextExecutionTime on non-o’clock(+45min) fails",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "recurring",
      );
      const { schedule, call } = extrinsicParams;
      schedule.recurring.nextExecutionTime += 30 * 60;

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
   * dynamicDispatchTask.recurring with nextExecutionTime that is 0 fails
   */
  it(
    "dynamicDispatchTask.recurring with nextExecutionTime that is 0 fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with nextExecutionTime that is negtive integer fails
   */
  it(
    "dynamicDispatchTask.recurring with nextExecutionTime that is negtive integer fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with nextExecutionTime that is larger than Number.MAX_SAFE_INTEGER fails
   */
  it(
    "dynamicDispatchTask.recurring with nextExecutionTime that is larger than Number.MAX_SAFE_INTEGER fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with nextExecutionTime that is string fails
   */
  it(
    "dynamicDispatchTask.recurring with nextExecutionTime that is string fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with frequency that is object fails
   */
  it(
    "dynamicDispatchTask.recurring with nextExecutionTime that is object fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with nextExecutionTime that is null fails
   */
  it(
    "dynamicDispatchTask.recurring with nextExecutionTime that is null fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with nextExecutionTime that is undefined fails
   */
  it(
    "dynamicDispatchTask.recurring with nextExecutionTime that is undefined fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.fixed schedule with execution time on non-o’clock(+5min) fails
   */
  it(
    "dynamicDispatchTask.fixed schedule with execution time on non-o’clock(+5min) fails",
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
   * dynamicDispatchTask.fixed schedule with execution time on non-o’clock(+30min) fails
   */
  it(
    "dynamicDispatchTask.fixed schedule with execution time on non-o’clock(+30min) fails",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes[0] += 60 * 30;

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
   * dynamicDispatchTask.fixed schedule with execution time on non-o’clock(+45min) fails
   */
  it(
    "dynamicDispatchTask.fixed schedule with execution time on non-o’clock(+45min) fails",
    async () => {
      const extrinsicParams = await getDynamicDispatchExtrinsicParams(
        polkadotApi,
        "fixed",
      );
      const { schedule, call } = extrinsicParams;
      schedule.fixed.executionTimes[0] += 60 * 30;

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
   * dynamicDispatchTask.fixed schedule with execution time that is string fails
   */
  it(
    "dynamicDispatchTask.fixed schedule with filling execution time string fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.fixed schedule with execution time that is  object fails
   */
  it(
    "dynamicDispatchTask.fixed schedule with filling execution time object fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.fixed schedule with execution time that is null fails
   */
  it(
    "dynamicDispatchTask.fixed schedule with filling execution time null fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.fixed schedule with execution time that is undefined fails
   */
  it(
    "dynamicDispatchTask.fixed schedule with filling execution time undefined fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.fixed schedule with empty execution times array fails
   */
  it(
    "dynamicDispatchTask.fixed schedule with empty execution times array fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.fixed schedule with execution times array that is string fails
   */
  it(
    "dynamicDispatchTask.fixed schedule with execution times array that is string fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.fixed schedule with execution times array that is object fails
   */
  it(
    "dynamicDispatchTask.fixed schedule with execution times array that is object fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.fixed schedule with execution times array that is null fails
   */
  it(
    "dynamicDispatchTask.fixed schedule with execution times array that is null fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.fixed schedule with execution times array that is undefined fails
   */
  it(
    "dynamicDispatchTask.fixed schedule with execution times array that is undefined fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.fixed with null call fails
   */
  it(
    "dynamicDispatchTask.fixed with null call fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.fixed with undefined call fails
   */
  it(
    "dynamicDispatchTask.fixed with undefined call fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with null call fails
   */
  it(
    "dynamicDispatchTask.recurring with null call fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with undefined call fails
   */
  it(
    "dynamicDispatchTask.recurring with undefined call fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.fixed with null schedule fails
   */
  it(
    "dynamicDispatchTask.fixed with null schedule fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.fixed with undefined schedule fails
   */
  it(
    "dynamicDispatchTask.fixed with undefined schedule fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with null schedule fails
   */
  it(
    "dynamicDispatchTask.recurring with null schedule fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  /**
   * dynamicDispatchTask.recurring with undefined schedule fails
   */
  it(
    "dynamicDispatchTask.recurring with undefined schedule fails",
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
      ).rejects.toThrow(undefined);
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );
});
