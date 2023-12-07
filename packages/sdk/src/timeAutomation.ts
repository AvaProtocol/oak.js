import _ from "lodash";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import { SendExtrinsicResult, OakAdapterTransactType } from "@oak-network/adapter";
import {
  ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams,
  ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams,
  CreateTaskFuncParams,
  scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow,
} from "./utils";

const timeScheduler = {
  getXcmpTimeFeeWithPayThroughRemoteDerivativeAccountFlow: async (
    scheduleXcmpTaskParams: ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams,
    schedule: any,
  ): Promise<any> => {
    const { oakAdapter, destinationChainAdapter, taskPayloadExtrinsic, scheduleFeeLocation, executionFeeLocation, keyringPair, xcmOptions } =
      scheduleXcmpTaskParams;
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

    if (_.isUndefined(oakAdapter.api)) {
      throw new Error("oakAdapter.api not set");
    }

    // Schedule XCMP task
    const { extrinsic, feeDetails } = await oakAdapter.createXcmpTimeTask(
      schedule,
      destination,
      schedule,
      executionFee,
      encodedCall,
      taskPayloadEncodedCallWeight,
      taskPayloadOverallWeight,
    );

    const scheduleFee = { amount: feeDetails.scheduleFee, assetLocation: { V3: scheduleFeeLocation } };

    return { executionFee, extrinsic, scheduleFee };
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
    const {
      oakAdapter,
      destinationChainAdapter,
      taskPayloadExtrinsic,
      scheduleFeeLocation,
      executionFeeLocation,
      keyringPair,
      xcmOptions,
      scheduleAs,
    } = scheduleXcmpTaskParams;
    if (_.isEmpty(scheduleAs)) {
      throw new Error("The scheduleAs parameter should not be empty");
    }

    const createTaskFunc = (funcParams: CreateTaskFuncParams): SubmittableExtrinsic<"promise"> => {
      const { oakApi, destination, executionFee, encodedCall, encodedCallWeight, overallWeight } = funcParams;
      const taskExtrinsic = oakApi.tx.automationTime.scheduleXcmpTaskThroughProxy(
        schedule,
        destination,
        { V3: scheduleFeeLocation },
        executionFee,
        encodedCall,
        encodedCallWeight,
        overallWeight,
        scheduleAs,
      );
      return taskExtrinsic;
    };
    const sendExtrinsicResult = scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow(
      {
        executionFeeLocation,
        keyringPair,
        oakAdapter,
        scheduleFeeLocation,
        taskPayloadExtrinsic,
        xcmOptions,
      },
      destinationChainAdapter,
      createTaskFunc,
    );
    return sendExtrinsicResult;
  },

  /**
   * Schedule XCMP task with PayThroughSoverignAccount instruction sequances
   * @param params Operation params
   * @returns
   */
  scheduleXcmpTimeTaskWithPayThroughSoverignAccountFlow: async (
    scheduleXcmpTaskParams: ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams,
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

// eslint-disable-next-line import/no-default-export
export default timeScheduler;
