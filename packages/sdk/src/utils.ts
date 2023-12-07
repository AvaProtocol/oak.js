import _ from "lodash";
import BN from "bn.js";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import { u8aToHex } from "@polkadot/util";
import type { HexString } from "@polkadot/util/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { ApiPromise } from "@polkadot/api";
import { ChainAdapter, OakAdapter, TaskSchedulerChainAdapter, SendExtrinsicResult, OakAdapterTransactType } from "@oak-network/adapter";
import { Weight } from "@oak-network/config";

interface ScheduleXcmpTaskParams {
  oakAdapter: OakAdapter;
  taskPayloadExtrinsic: SubmittableExtrinsic<"promise">;
  scheduleFeeLocation: any;
  executionFeeLocation: any;
  xcmOptions?: {
    instructionCount?: number;
    overallWeight?: Weight;
    executionFeeAmount?: BN;
  };
  keyringPair: KeyringPair;
}

export interface ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams extends ScheduleXcmpTaskParams {
  destinationChainAdapter: ChainAdapter;
}

export interface ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams extends ScheduleXcmpTaskParams {
  destinationChainAdapter: TaskSchedulerChainAdapter;
  scheduleAs: HexString;
}

export interface CreateTaskFuncParams {
  oakApi: ApiPromise;
  destination: any;
  executionFee: any;
  encodedCall: HexString;
  encodedCallWeight: Weight;
  overallWeight: Weight;
}

/**
 * Schedule XCMP task with PayThroughRemoteDerivativeAccount instruction sequances
 * @param params Operation params
 * @returns
 */
export const scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow = async (
  params: ScheduleXcmpTaskParams,
  destinationChainAdapter: TaskSchedulerChainAdapter,
  createTaskFunc: (params: CreateTaskFuncParams) => SubmittableExtrinsic<"promise">,
): Promise<SendExtrinsicResult> => {
  const { oakAdapter, taskPayloadExtrinsic, executionFeeLocation, keyringPair, xcmOptions } = params;

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
  const deriveAccountId = oakAdapter.getDerivativeAccount(u8aToHex(keyringPair.addressRaw), paraId, xcm.instructionNetworkType);

  // Create task extrinsic
  const taskExtrinsic = createTaskFunc({
    destination,
    encodedCall,
    encodedCallWeight: taskPayloadEncodedCallWeight,
    executionFee,
    oakApi: oakAdapter.getApi(),
    overallWeight: taskPayloadOverallWeight,
  });

  // Schedule task through XCM
  const taskEncodedCall = taskExtrinsic.method.toHex();
  const destinationTransactXcmInstructionCount = destinationChainAdapter.getTransactXcmInstructionCount();
  const taskEncodedCallWeight = await oakAdapter.getExtrinsicWeight(taskExtrinsic, deriveAccountId);
  const taskOverallWeight = await oakAdapter.calculateXcmOverallWeight(taskEncodedCallWeight, destinationTransactXcmInstructionCount);
  const taskExecutionFee = await oakAdapter.weightToFee(taskOverallWeight, executionFeeLocation);
  const oakLocation = oakAdapter.getLocation();
  const sendExtrinsicResult = await destinationChainAdapter.scheduleTaskThroughXcm(
    oakLocation,
    taskEncodedCall,
    executionFeeLocation,
    taskExecutionFee,
    taskEncodedCallWeight,
    taskOverallWeight,
    keyringPair,
  );
  return sendExtrinsicResult;
};
