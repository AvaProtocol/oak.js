import { Weight } from "@oak-network/config";
import type { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import { HexString } from "@polkadot/util/types";

interface CreateTaskParams {
  oakApi: ApiPromise;
  destination: any;
  encodedCall: HexString;
  encodedCallWeight: Weight;
  overallWeight: Weight;
  scheduleFeeLocation: any;
  executionFee: any;
  scheduleAs: HexString | undefined;
}

/**
 * TaskBuilder is an abstract class that defines the interface for building tasks
 */
abstract class TaskBuilder {
  abstract createTask(params: CreateTaskParams): SubmittableExtrinsic<"promise">;
}

export { TaskBuilder, CreateTaskParams };
