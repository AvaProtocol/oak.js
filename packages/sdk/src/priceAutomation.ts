import _ from "lodash";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import { SendExtrinsicResult, OakAdapterTransactType, AutomationPriceTriggerParams } from "@oak-network/adapter";
import {
  ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams,
  ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams,
  CreateTaskFuncParams,
  scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow,
} from "./utils";

const priceScheduler = {
  /**
   * Schedule XCMP price task with PayThroughRemoteDerivativeAccount instruction sequances
   * @param params Operation params
   * @returns
   */
  scheduleXcmpPriceTaskWithPayThroughRemoteDerivativeAccountFlow: async (
    params: ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams,
    automationPriceTriggerParams: AutomationPriceTriggerParams,
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
    } = params;
    if (_.isEmpty(scheduleAs)) {
      throw new Error("The scheduleAs parameter should not be empty");
    }

    const createTaskFunc = (funcParams: CreateTaskFuncParams): SubmittableExtrinsic<"promise"> => {
      const { oakApi, destination, executionFee, encodedCall, encodedCallWeight, overallWeight } = funcParams;
      const taskExtrinsic = oakApi.tx.automationPrice.scheduleXcmpTaskThroughProxy(
        automationPriceTriggerParams.chain,
        automationPriceTriggerParams.exchange,
        automationPriceTriggerParams.asset1,
        automationPriceTriggerParams.asset2,
        automationPriceTriggerParams.submittedAt,
        automationPriceTriggerParams.triggerFunction,
        automationPriceTriggerParams.triggerParam,
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

  scheduleXcmpPriceTaskWithPayThroughSoverignAccountFlow: async (
    params: ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams,
    automationPriceTriggerParams: AutomationPriceTriggerParams,
  ): Promise<SendExtrinsicResult> => {
    const { oakAdapter, destinationChainAdapter, taskPayloadExtrinsic, scheduleFeeLocation, executionFeeLocation, keyringPair, xcmOptions } = params;
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
};

// eslint-disable-next-line import/no-default-export
export default priceScheduler;
