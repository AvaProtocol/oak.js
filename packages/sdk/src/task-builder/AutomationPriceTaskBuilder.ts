import type { SubmittableExtrinsic } from "@polkadot/api/types";
import { AutomationPriceTriggerParams } from "@oak-network/adapter";
import { CreateTaskParams, TaskBuilder } from "./TaskBuilder";

/**
 * AutomationPriceTaskBuilder is a class that implements TaskBuilder interface to build AutomationPrice task
 */
class AutomationPriceTaskBuilder extends TaskBuilder {
  triggerParams: AutomationPriceTriggerParams;

  constructor(triggerParams: AutomationPriceTriggerParams) {
    super();
    this.triggerParams = triggerParams;
  }

  createTask(params: CreateTaskParams): SubmittableExtrinsic<"promise"> {
    const { oakApi, destination, encodedCall, encodedCallWeight, overallWeight, scheduleFeeLocation, executionFee, scheduleAs } = params;
    const { chain, exchange, asset1, asset2, submittedAt, triggerFunction, triggerParam } = this.triggerParams;
    const taskExtrinsic = oakApi.tx.automationPrice.scheduleXcmpTaskThroughProxy(
      chain,
      exchange,
      asset1,
      asset2,
      submittedAt,
      triggerFunction,
      triggerParam,
      destination,
      { V3: scheduleFeeLocation },
      executionFee,
      encodedCall,
      encodedCallWeight,
      overallWeight,
      "PayThroughRemoteDerivativeAccount",
      scheduleAs,
    );
    return taskExtrinsic;
  }
}

export { AutomationPriceTaskBuilder };
