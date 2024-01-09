import type { SubmittableExtrinsic } from "@polkadot/api/types";
import { CreateTaskParams, TaskBuilder } from "./TaskBuilder";

/**
 * AutomationTimeTaskBuilder is a class that implements TaskBuilder interface to build AutomationTime task
 */
class AutomationTimeTaskBuilder extends TaskBuilder {
  schedule: any;

  constructor(schedule: any) {
    super();
    this.schedule = schedule;
  }

  createTask(params: CreateTaskParams): SubmittableExtrinsic<"promise"> {
    const { oakApi, destination, encodedCall, encodedCallWeight, overallWeight, scheduleFeeLocation, executionFee, scheduleAs } = params;
    const taskExtrinsic = oakApi.tx.automationTime.scheduleXcmpTask(
      this.schedule,
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

export { AutomationTimeTaskBuilder };
