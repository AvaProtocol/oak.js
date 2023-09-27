import _ from 'lodash';
import BN from 'bn.js';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { u8aToHex } from '@polkadot/util';
import type { HexString } from '@polkadot/util/types';
import type { KeyringPair } from '@polkadot/keyring/types';
import { ChainAdapter, OakAdapter, TaskSchedulerChainAdapter, SendExtrinsicResult, XcmInstructionNetworkType } from '@oak-network/adapter';
import { Weight } from '@oak-network/sdk-types';

interface ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams {
  oakAdapter: OakAdapter;
  destinationChainAdapter: ChainAdapter;
  taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>;
  schedule: any;
  keyringPair: KeyringPair;
  options?: {
    taskPayloadEncodedCallWeight?: Weight;
    taskPayloadOverallWeight?: Weight;
    taskPayloadExecutionFeeAmount?: BN;
    taskPayloadInstructionCount?: number,
  };
}

interface ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams {
  oakAdapter: OakAdapter;
  destinationChainAdapter: TaskSchedulerChainAdapter;
  taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>;
  scheduleFeeLocation: any,
  executionFeeLocation: any,
  schedule: any;
  scheduleAs: HexString;
  keyringPair: KeyringPair;
  options?: {
    taskPayloadEncodedCallWeight?: Weight;
    taskPayloadOverallWeight?: Weight;
    taskPayloadExecutionFeeAmount?: BN;
    taskPayloadInstructionCount?: number,
    taskEncodedCallWeight?: Weight;
    taskOverallWeight?: Weight;
    taskExecutionFeeAmount?: BN;
    taskInstructionCount?: number,
  };
}

async function scheduleXcmpTaskWithPayThroughSoverignAccountFlow({
  oakAdapter,
  destinationChainAdapter,
  taskPayloadExtrinsic,
  schedule,
  keyringPair,
  options,
}: ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams) : Promise<SendExtrinsicResult> {
  const { defaultAsset } = oakAdapter.getChainData();
  if (_.isUndefined(defaultAsset)) throw new Error("chainData.defaultAsset not set");

  // Caluculate weight and fee for task
  const destination = { V3: destinationChainAdapter.getLocation() };
  const encodedCall = taskPayloadExtrinsic.method.toHex();
  const oakTransactXcmInstructionCount = options?.taskPayloadInstructionCount || oakAdapter.getTransactXcmInstructionCount();
  const taskPayloadEncodedCallWeight = options?.taskPayloadEncodedCallWeight || await destinationChainAdapter.getExtrinsicWeight(taskPayloadExtrinsic, keyringPair);
  const taskPayloadOverallWeight = options?.taskPayloadOverallWeight || await destinationChainAdapter.calculateXcmOverallWeight(taskPayloadEncodedCallWeight, oakTransactXcmInstructionCount);
  const scheduleFee = { V3: defaultAsset.location }
  const executionFeeAmout = options?.taskPayloadExecutionFeeAmount || await destinationChainAdapter.weightToFee(taskPayloadOverallWeight, defaultAsset.location);
  const executionFee = { assetLocation: { V3: defaultAsset.location }, amount: executionFeeAmout };

  // Schedule XCMP task
  const sendExtrinsicResult = oakAdapter.scheduleXcmpTask(
    destination,
    schedule,
    scheduleFee,
    executionFee,
    encodedCall,
    taskPayloadEncodedCallWeight,
    taskPayloadOverallWeight,
    keyringPair,
  )

  return sendExtrinsicResult;
}

async function scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow({
  oakAdapter,
  destinationChainAdapter,
  taskPayloadExtrinsic,
  scheduleFeeLocation,
  executionFeeLocation,
  schedule,
  scheduleAs,
  keyringPair,
  options,
}: ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams): Promise<SendExtrinsicResult> {
  const oakApi = oakAdapter.getApi();
  const { paraId, xcmInstructionNetworkType, xcm } = destinationChainAdapter.getChainData();
  if (_.isUndefined(paraId)) throw new Error("chainData.paraId not set");
  if (_.isUndefined(xcmInstructionNetworkType)) throw new Error("chainData.xcmInstructionNetworkType not set");
  if (_.isUndefined(xcm)) throw new Error("chainData.xcm not set");

  // Caluculate weight and fee for task
  const destination = { V3: destinationChainAdapter.getLocation() };
  const encodedCall = taskPayloadExtrinsic.method.toHex();
  const oakTransactXcmInstructionCount = options?.taskPayloadInstructionCount || oakAdapter.getTransactXcmInstructionCount();
  const taskPayloadEncodedCallWeight = options?.taskPayloadEncodedCallWeight || await destinationChainAdapter.getExtrinsicWeight(taskPayloadExtrinsic, keyringPair);
  const taskPayloadOverallWeight = options?.taskPayloadOverallWeight || await destinationChainAdapter.calculateXcmOverallWeight(taskPayloadEncodedCallWeight, oakTransactXcmInstructionCount);
  const scheduleFee = { V3: scheduleFeeLocation }
  const executionFeeAmout = options?.taskPayloadExecutionFeeAmount || await destinationChainAdapter.weightToFee(taskPayloadOverallWeight, executionFeeLocation);
  const executionFee = { assetLocation: { V3: executionFeeLocation }, amount: executionFeeAmout };

  // Calculate derive account on Turing/OAK
  const accountOptions = xcmInstructionNetworkType === XcmInstructionNetworkType.Concrete ? { locationType: 'XcmV3MultiLocation', network: xcm.network } : undefined;
  const deriveAccountId = oakAdapter.getDerivativeAccount(u8aToHex(keyringPair.addressRaw), paraId, accountOptions);

  // Schedule task through proxy
  const taskExtrinsic = oakApi.tx.automationTime.scheduleXcmpTaskThroughProxy(
    schedule,
    destination,
    scheduleFee,
    executionFee,
    encodedCall,
    taskPayloadEncodedCallWeight,
    taskPayloadOverallWeight,
    scheduleAs,
  );
  
  // Schedule task through XCM
  const taskEncodedCall = taskExtrinsic.method.toHex();
  const destinationTransactXcmInstructionCount = options?.taskInstructionCount || destinationChainAdapter.getTransactXcmInstructionCount();
  const taskEncodedCallWeight = options?.taskEncodedCallWeight || await oakAdapter.getExtrinsicWeight(taskExtrinsic, deriveAccountId);
  const taskOverallWeight = options?.taskOverallWeight || await oakAdapter.calculateXcmOverallWeight(taskEncodedCallWeight, destinationTransactXcmInstructionCount);
  const taskExecutionFee = options?.taskExecutionFeeAmount || await oakAdapter.weightToFee(taskOverallWeight, executionFeeLocation);
  const oakLocation = oakAdapter.getLocation(); 
  const sendExtrinsicResult = await destinationChainAdapter.scheduleTaskThroughXcm(oakLocation, taskEncodedCall, executionFeeLocation, taskExecutionFee, taskEncodedCallWeight, taskOverallWeight, keyringPair);
  return sendExtrinsicResult;
}

export function Sdk() {
  return {
    /**
     * Schedule XCMP task with PayThroughSoverignAccount instruction sequances
     * @param params Operation params
     * @returns 
     */
    scheduleXcmpTaskWithPayThroughSoverignAccountFlow: async (params: ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams): Promise<SendExtrinsicResult> => {
      const result = await scheduleXcmpTaskWithPayThroughSoverignAccountFlow(params);
      return result;
    },
    /**
     * Schedule XCMP task with PayThroughRemoteDerivativeAccount instruction sequances
     * @param params Operation params
     * @returns 
     */
    scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow: async (params: ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams): Promise<SendExtrinsicResult> => {
      const result = await scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow(params);
      return result;
    },
  }
}