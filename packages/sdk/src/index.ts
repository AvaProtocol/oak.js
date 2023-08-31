import BN from 'bn.js';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { u8aToHex } from '@polkadot/util';
import type { HexString } from '@polkadot/util/types';
import { ChainAdapter, OakAdapter, TaskSchedulerChainAdapter, SendExtrinsicResult, AstarAdapter } from '@oak-network/adapter';
import { Asset } from '@oak-network/sdk-types';

interface ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams {
  oakAdapter: OakAdapter;
  destinationChainAdapter: ChainAdapter;
  taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>;
  schedule: any;
  keyPair: any;
}

interface ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams {
  oakAdapter: OakAdapter;
  destinationChainAdapter: TaskSchedulerChainAdapter;
  taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>;
  scheduleFeeLocation: any,
  executionFeeLocation: any,
  schedule: any;
  scheduleAs: HexString;
  keyPair: any;
}

async function scheduleXcmpTaskWithPayThroughSoverignAccountFlow({
  oakAdapter,
  destinationChainAdapter,
  taskPayloadExtrinsic,
  schedule,
  keyPair,
}: ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams) : Promise<SendExtrinsicResult> {
  const { defaultAsset } = oakAdapter.getChainData();
  if (!defaultAsset) throw new Error("defaultAsset not set");

  // Caluculate weight and fee for task
  const destination = { V3: destinationChainAdapter.getLocation() };
  const encodedCall = taskPayloadExtrinsic.method.toHex();
  const oakTransactXcmInstructionCount = oakAdapter.getTransactXcmInstructionCount();
  const { encodedCallWeight, overallWeight } = await destinationChainAdapter.getXcmWeight(taskPayloadExtrinsic, keyPair.address, oakTransactXcmInstructionCount);
  const scheduleFee = { V3: defaultAsset.location }
  const xcmpFee = await destinationChainAdapter.weightToFee(overallWeight, defaultAsset.location);
  const executionFee = { assetLocation: { V3: defaultAsset.location }, amount: xcmpFee };

  // Schedule XCMP task
  const sendExtrinsicResult = oakAdapter.scheduleXcmpTask(
    schedule,
    destination,
    scheduleFee,
    executionFee,
    encodedCall,
    encodedCallWeight,
    overallWeight,
    keyPair,
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
  keyPair,
}: ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams): Promise<SendExtrinsicResult> {
  const oakApi = oakAdapter.getApi();
  const { paraId, xcmInstructionNetworkType, relayChain } = destinationChainAdapter.getChainData();
  if (!paraId) throw new Error("paraId not set");
  if (!xcmInstructionNetworkType) throw new Error("xcmInstructionNetworkType not set");
  if (!relayChain) throw new Error("relayChain not set");

  // Caluculate weight and fee for task
  const destination = { V3: destinationChainAdapter.getLocation() };
  const encodedCall = taskPayloadExtrinsic.method.toHex();
  const oakTransactXcmInstructionCount = oakAdapter.getTransactXcmInstructionCount();
  const { encodedCallWeight, overallWeight } = await destinationChainAdapter.getXcmWeight(taskPayloadExtrinsic, keyPair.address, oakTransactXcmInstructionCount);
  const scheduleFee = { V3: scheduleFeeLocation }
  const executionFeeAmout = await destinationChainAdapter.weightToFee(overallWeight, executionFeeLocation);
  const executionFee = { assetLocation: { V3: executionFeeLocation }, amount: executionFeeAmout };

  // Calculate derive account on Turing/OAK
  const options = xcmInstructionNetworkType === 'concrete' ? { locationType: 'XcmV3MultiLocation', network: relayChain } : undefined;
  const deriveAccountId = oakAdapter.getDeriveAccount(u8aToHex(keyPair.addressRaw), paraId, options);
  
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
  const sendExtrinsicResult = await destinationChainAdapter.scheduleTaskThroughXcm(oakLocation, taskEncodedCall, executionFeeLocation, taskExecutionFee, taskEncodedCallWeight, taskOverallWeight, deriveAccountId, keyPair);
  return sendExtrinsicResult;
}

export function Sdk() {
  return {
    scheduleXcmpTaskWithPayThroughSoverignAccountFlow: async (params: ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams): Promise<SendExtrinsicResult> => {
      const result = await scheduleXcmpTaskWithPayThroughSoverignAccountFlow(params);
      return result;
    },
    scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow: async (params: ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams): Promise<SendExtrinsicResult> => {
      const result = await scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow(params);
      return result;
    },
    transfer: (sourceChainAdatper: ChainAdapter, destinationChainAdatper: ChainAdapter, { asset, assetAmount } : { asset: Asset, assetAmount: BN }): void => {
      throw new Error('Method not implemented.');
    },
  }
};
