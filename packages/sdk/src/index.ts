import _ from "lodash";
import BN from "bn.js";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import { u8aToHex } from "@polkadot/util";
import type { HexString } from "@polkadot/util/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import {
  ChainAdapter,
  OakAdapter,
  TaskSchedulerChainAdapter,
  SendExtrinsicResult,
  OakAdapterTransactType,
  AutomationPriceTriggerParams,
} from "@oak-network/adapter";
import { Weight } from "@oak-network/config";
import { TaskBuilder, AutomationTimeTaskBuilder, AutomationPriceTaskBuilder } from "./task-builder";

interface ScheduleXcmpTaskParams {
  oakAdapter: OakAdapter;
  destinationChainAdapter: ChainAdapter;
  taskPayloadExtrinsic: SubmittableExtrinsic<"promise">;
  scheduleFeeLocation: any;
  executionFeeLocation: any;
  xcmOptions?: {
    instructionCount?: number;
    overallWeight?: Weight;
    executionFeeAmount?: BN;
  };
  scheduleAs?: HexString;
  keyringPair: KeyringPair;
}

/**
 * The params for scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow
 * invoker is the chain adapter that will send the XCM message to Turing/OAK to schedule the task
 * invokeFeeLocation is the location of the fee asset for XCM message execution
 */
interface ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams extends ScheduleXcmpTaskParams {
  invoker: TaskSchedulerChainAdapter;
  invokeFeeLocation: any;
}

/**
 * Schedule XCMP task with PayThroughRemoteDerivativeAccount instruction sequances
 * @param params Operation params
 * @returns
 */
const scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow = async (
  params: ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams,
  taskBuilder: TaskBuilder,
): Promise<SendExtrinsicResult> => {
  const {
    oakAdapter,
    destinationChainAdapter,
    taskPayloadExtrinsic,
    scheduleFeeLocation,
    executionFeeLocation,
    invoker,
    invokeFeeLocation,
    keyringPair,
    xcmOptions,
    scheduleAs,
  } = params;

  const [defaultAsset] = oakAdapter.getChainConfig().assets;
  if (_.isUndefined(defaultAsset)) {
    throw new Error("chainConfig.defaultAsset not set");
  }

  const { paraId, xcm } = destinationChainAdapter.getChainConfig();
  if (_.isUndefined(paraId)) {
    throw new Error("chainConfig.paraId not set");
  }
  if (_.isUndefined(xcm)) {
    throw new Error("chainConfig.xcm not set");
  }

  // Caluculate weight and fee for task
  const destination = { V3: destinationChainAdapter.getLocation() };
  const encodedCall = taskPayloadExtrinsic.method.toHex();
  const oakTransactXcmInstructionCount =
    xcmOptions?.instructionCount || oakAdapter.getTransactXcmInstructionCount(OakAdapterTransactType.PayThroughRemoteDerivativeAccount);
  const taskPayloadEncodedCallWeight = await destinationChainAdapter.getExtrinsicWeight(taskPayloadExtrinsic, keyringPair);
  const taskPayloadOverallWeight =
    xcmOptions?.overallWeight ||
    (await destinationChainAdapter.calculateXcmOverallWeight(taskPayloadEncodedCallWeight, oakTransactXcmInstructionCount));
  const executionFeeAmout =
    xcmOptions?.executionFeeAmount || (await destinationChainAdapter.weightToFee(taskPayloadOverallWeight, executionFeeLocation));
  const executionFee = {
    amount: executionFeeAmout,
    assetLocation: { V3: executionFeeLocation },
  };

  // Calculate derive account on Turing/OAK
  const deriveAccountId = oakAdapter.getDerivativeAccount(u8aToHex(keyringPair.addressRaw), paraId);

  // Create task extrinsic
  const taskExtrinsic = taskBuilder.createTask({
    destination,
    encodedCall,
    encodedCallWeight: taskPayloadEncodedCallWeight,
    executionFee,
    oakApi: oakAdapter.getApi(),
    overallWeight: taskPayloadOverallWeight,
    scheduleAs,
    scheduleFeeLocation,
  });

  // Schedule task through XCM
  const taskEncodedCall = taskExtrinsic.method.toHex();
  // Get XCM instruction count for XCM message base on invoker implmentation
  const destinationTransactXcmInstructionCount = invoker.getTransactXcmInstructionCount();
  const taskEncodedCallWeight = await oakAdapter.getExtrinsicWeight(taskExtrinsic, deriveAccountId);
  const taskOverallWeight = await oakAdapter.calculateXcmOverallWeight(taskEncodedCallWeight, destinationTransactXcmInstructionCount);
  // Calculate fee for XCM message base on invoker fee location
  const taskExecutionFee = await oakAdapter.weightToFee(taskOverallWeight, invokeFeeLocation);
  const oakLocation = oakAdapter.getLocation();
  // Send XCM message from invoker chain to Turing/OAK
  const sendExtrinsicResult = await invoker.scheduleTaskThroughXcm(
    oakLocation,
    taskEncodedCall,
    invokeFeeLocation,
    taskExecutionFee,
    taskEncodedCallWeight,
    taskOverallWeight,
    keyringPair,
  );
  return sendExtrinsicResult;
};

export function Sdk() {
  return {
    /**
     * Schedule XCMP price task with PayThroughRemoteDerivativeAccount instruction sequances
     * @param params Operation params
     * @returns
     */
    scheduleXcmpPriceTaskWithPayThroughRemoteDerivativeAccountFlow: async (
      params: ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams,
      automationPriceTriggerParams: AutomationPriceTriggerParams,
    ): Promise<SendExtrinsicResult> => {
      const taskBuilder = new AutomationPriceTaskBuilder(automationPriceTriggerParams);
      const sendExtrinsicResult = scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow(params, taskBuilder);
      return sendExtrinsicResult;
    },

    scheduleXcmpPriceTaskWithPayThroughSoverignAccountFlow: async (
      params: ScheduleXcmpTaskParams,
      automationPriceTriggerParams: AutomationPriceTriggerParams,
    ): Promise<SendExtrinsicResult> => {
      const { oakAdapter, destinationChainAdapter, taskPayloadExtrinsic, scheduleFeeLocation, executionFeeLocation, keyringPair, xcmOptions } =
        params;
      const [defaultAsset] = oakAdapter.getChainConfig().assets;
      if (_.isUndefined(defaultAsset)) {
        throw new Error("chainConfig.defaultAsset not set");
      }

      // Caluculate weight and fee for task
      const destination = { V3: destinationChainAdapter.getLocation() };
      const encodedCall = taskPayloadExtrinsic.method.toHex();
      const oakTransactXcmInstructionCount =
        xcmOptions?.instructionCount || oakAdapter.getTransactXcmInstructionCount(OakAdapterTransactType.PayThroughSoverignAccount);
      const taskPayloadEncodedCallWeight = await destinationChainAdapter.getExtrinsicWeight(taskPayloadExtrinsic, keyringPair);
      const taskPayloadOverallWeight =
        xcmOptions?.overallWeight ||
        (await destinationChainAdapter.calculateXcmOverallWeight(taskPayloadEncodedCallWeight, oakTransactXcmInstructionCount));
      const executionFeeAmout =
        xcmOptions?.executionFeeAmount || (await destinationChainAdapter.weightToFee(taskPayloadOverallWeight, executionFeeLocation));
      const executionFee = {
        amount: executionFeeAmout,
        assetLocation: { V3: executionFeeLocation },
      };

      // Schedule XCMP task
      const sendExtrinsicResult = oakAdapter.scheduleXcmpPriceTask(
        automationPriceTriggerParams,
        destination,
        { V3: scheduleFeeLocation },
        executionFee,
        encodedCall,
        taskPayloadEncodedCallWeight,
        taskPayloadOverallWeight,
        keyringPair,
      );

      return sendExtrinsicResult;
    },

    /**
     * Schedule XCMP time task with PayThroughRemoteDerivativeAccount instruction sequances
     * @param params Operation params
     * @returns
     */
    scheduleXcmpTimeTaskWithPayThroughRemoteDerivativeAccountFlow: async (
      scheduleXcmpTaskParams: ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams,
      schedule: any,
    ): Promise<SendExtrinsicResult> => {
      const taskBuilder = new AutomationTimeTaskBuilder(schedule);
      const sendExtrinsicResult = scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow(scheduleXcmpTaskParams, taskBuilder);
      return sendExtrinsicResult;
    },

    /**
     * Schedule XCMP task with PayThroughSoverignAccount instruction sequances
     * @param params Operation params
     * @returns
     */
    scheduleXcmpTimeTaskWithPayThroughSoverignAccountFlow: async (
      scheduleXcmpTaskParams: ScheduleXcmpTaskParams,
      schedule: any,
    ): Promise<SendExtrinsicResult> => {
      const { oakAdapter, destinationChainAdapter, taskPayloadExtrinsic, scheduleFeeLocation, executionFeeLocation, keyringPair, xcmOptions } =
        scheduleXcmpTaskParams;
      const [defaultAsset] = oakAdapter.getChainConfig().assets;
      if (_.isUndefined(defaultAsset)) {
        throw new Error("chainData.defaultAsset not set");
      }

      // Caluculate weight and fee for task
      const destination = { V3: destinationChainAdapter.getLocation() };
      const encodedCall = taskPayloadExtrinsic.method.toHex();
      const oakTransactXcmInstructionCount =
        xcmOptions?.instructionCount || oakAdapter.getTransactXcmInstructionCount(OakAdapterTransactType.PayThroughSoverignAccount);
      const taskPayloadEncodedCallWeight = await destinationChainAdapter.getExtrinsicWeight(taskPayloadExtrinsic, keyringPair);
      const taskPayloadOverallWeight =
        xcmOptions?.overallWeight ||
        (await destinationChainAdapter.calculateXcmOverallWeight(taskPayloadEncodedCallWeight, oakTransactXcmInstructionCount));
      const executionFeeAmout =
        xcmOptions?.executionFeeAmount || (await destinationChainAdapter.weightToFee(taskPayloadOverallWeight, executionFeeLocation));
      const executionFee = {
        amount: executionFeeAmout,
        assetLocation: { V3: executionFeeLocation },
      };

      // Schedule XCMP task
      const sendExtrinsicResult = oakAdapter.scheduleXcmpTask(
        destination,
        schedule,
        { V3: scheduleFeeLocation },
        executionFee,
        encodedCall,
        taskPayloadEncodedCallWeight,
        taskPayloadOverallWeight,
        keyringPair,
      );

      return sendExtrinsicResult;
    },
  };
}
