import _ from 'lodash';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { u8aToHex } from '@polkadot/util';
import type { HexString } from '@polkadot/util/types';
import type { KeyringPair } from '@polkadot/keyring/types';
import { ChainAdapter, OakAdapter, TaskSchedulerChainAdapter, SendExtrinsicResult, XcmInstructionNetworkType } from '@oak-network/adapter';

interface ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams {
  oakAdapter: OakAdapter;
  destinationChainAdapter: ChainAdapter;
  taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>;
  schedule: any;
  keyringPair: KeyringPair;
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
}

async function scheduleXcmpTaskWithPayThroughSoverignAccountFlow({
  oakAdapter,
  destinationChainAdapter,
  taskPayloadExtrinsic,
  schedule,
  keyringPair,
}: ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams) : Promise<SendExtrinsicResult> {
  const { defaultAsset } = oakAdapter.getChainData();
  if (_.isUndefined(defaultAsset)) throw new Error("chainData.defaultAsset not set");

  // Caluculate weight and fee for task
  const destination = { V3: destinationChainAdapter.getLocation() };
  const encodedCall = taskPayloadExtrinsic.method.toHex();
  const oakTransactXcmInstructionCount = oakAdapter.getTransactXcmInstructionCount();
  const { encodedCallWeight, overallWeight } = await destinationChainAdapter.getXcmWeight(taskPayloadExtrinsic, keyringPair.address, oakTransactXcmInstructionCount);
  const scheduleFee = { V3: defaultAsset.location }
  const xcmpFee = await destinationChainAdapter.weightToFee(overallWeight, defaultAsset.location);
  const executionFee = { assetLocation: { V3: defaultAsset.location }, amount: xcmpFee };

  // Schedule XCMP task
  const sendExtrinsicResult = oakAdapter.scheduleXcmpTask(
    destination,
    schedule,
    scheduleFee,
    executionFee,
    encodedCall,
    encodedCallWeight,
    overallWeight,
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
}: ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams): Promise<SendExtrinsicResult> {
  const oakApi = oakAdapter.getApi();
  const { paraId, xcmInstructionNetworkType, network } = destinationChainAdapter.getChainData();
  if (_.isUndefined(paraId)) throw new Error("chainData.paraId not set");
  if (_.isUndefined(xcmInstructionNetworkType)) throw new Error("chainData.xcmInstructionNetworkType not set");
  if (_.isUndefined(network)) throw new Error("chainData.network not set");

  // Caluculate weight and fee for task
  const destination = { V3: destinationChainAdapter.getLocation() };
  const encodedCall = taskPayloadExtrinsic.method.toHex();
  const oakTransactXcmInstructionCount = oakAdapter.getTransactXcmInstructionCount();
  const { encodedCallWeight, overallWeight } = await destinationChainAdapter.getXcmWeight(taskPayloadExtrinsic, keyringPair.address, oakTransactXcmInstructionCount);
  const scheduleFee = { V3: scheduleFeeLocation }
  const executionFeeAmout = await destinationChainAdapter.weightToFee(overallWeight, executionFeeLocation);
  const executionFee = { assetLocation: { V3: executionFeeLocation }, amount: executionFeeAmout };

  // Calculate derive account on Turing/OAK
  const options = xcmInstructionNetworkType === XcmInstructionNetworkType.Concrete ? { locationType: 'XcmV3MultiLocation', network } : undefined;
  const deriveAccountId = oakAdapter.getDerivativeAccount(u8aToHex(keyringPair.addressRaw), paraId, options);
  
  // Schedule task through proxy
  const taskExtrinsic = oakApi.tx.automationTime.scheduleXcmpTaskThroughProxy(
    schedule,
    destination,
    scheduleFee,
    executionFee,
    encodedCall,
    encodedCallWeight,
    overallWeight,
    scheduleAs,
  );
  
  // Schedule task through XCM
  const taskEncodedCall = taskExtrinsic.method.toHex();
  const destinationTransactXcmInstructionCount = destinationChainAdapter.getTransactXcmInstructionCount();
  const { encodedCallWeight: taskEncodedCallWeight, overallWeight: taskOverallWeight } = await oakAdapter.getXcmWeight(taskExtrinsic, deriveAccountId, destinationTransactXcmInstructionCount);
  const taskExecutionFee = await oakAdapter.weightToFee(taskOverallWeight, executionFeeLocation);
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