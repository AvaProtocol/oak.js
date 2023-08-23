import BN from 'bn.js';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { u8aToHex } from '@polkadot/util';
import type { HexString } from '@polkadot/util/types';
import { ChainProvider, OakChain, SendExtrinsicResult } from '@oak-network/provider';
import { Asset } from '@oak-network/sdk-types';

interface ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams {
  oakChain: OakChain;
  destinationChainProvider: ChainProvider;
  taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>;
  schedule: any;
  keyPair: any;
}

interface ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams {
  oakChain: OakChain;
  destinationChainProvider: ChainProvider;
  taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>;
  scheduleFeeLocation: any,
  executionFeeLocation: any,
  schedule: any;
  scheduleAs: HexString;
  keyPair: any;
}

async function scheduleXcmpTaskWithPayThroughSoverignAccountFlow({
  oakChain,
  destinationChainProvider,
  taskPayloadExtrinsic,
  schedule,
  keyPair,
}: ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams) : Promise<SendExtrinsicResult> {
  const { defaultAsset } = oakChain.getChainData();
  if (!defaultAsset) throw new Error("defaultAsset not set");
  const destination = { V3: destinationChainProvider.chain.getLocation() };
  const encodedCall = taskPayloadExtrinsic.method.toHex();
  const { encodedCallWeight, overallWeight } = await destinationChainProvider.chain.getXcmWeight(keyPair.address, taskPayloadExtrinsic);
  const scheduleFee = { V3: defaultAsset.location }
  const xcmpFee = await destinationChainProvider.chain.weightToFee(overallWeight, defaultAsset.location);
  const executionFee = { assetLocation: { V3: defaultAsset.location }, amount: xcmpFee };

  const sendExtrinsicResult = oakChain.scheduleXcmpTask(
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
  oakChain,
  destinationChainProvider,
  taskPayloadExtrinsic,
  scheduleFeeLocation,
  executionFeeLocation,
  schedule,
  scheduleAs,
  keyPair,
}: ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams): Promise<SendExtrinsicResult> {
  const oakApi = oakChain.getApi();
  const { paraId } = destinationChainProvider.chain.getChainData();
  if (!paraId) throw new Error("paraId not set");
  const destination = { V3: destinationChainProvider.chain.getLocation() };
  const encodedCall = taskPayloadExtrinsic.method.toHex();
  const { encodedCallWeight, overallWeight } = await destinationChainProvider.chain.getXcmWeight(keyPair.address, taskPayloadExtrinsic);
  const scheduleFee = { V3: scheduleFeeLocation }
  const executionFeeAmout = await destinationChainProvider.chain.weightToFee(overallWeight, executionFeeLocation);
  const executionFee = { assetLocation: { V3: executionFeeLocation }, amount: executionFeeAmout };
  const deriveAccountId = oakChain.getDeriveAccount(u8aToHex(keyPair.addressRaw), paraId);
  
  const extrinsic = oakApi.tx.automationTime.scheduleXcmpTaskThroughProxy(
    schedule,
    destination,
    scheduleFee,
    executionFee,
    encodedCall,
    encodedCallWeight,
    overallWeight,
    scheduleAs,
  );
  
  const taskEncodedCall = extrinsic.method.toHex();
  const { encodedCallWeight: taskEncodedCallWeight, overallWeight: taskOverallWeight } = await oakChain.getXcmWeight(deriveAccountId, extrinsic);
  const taskExecutionFee = await oakChain.weightToFee(taskOverallWeight, executionFeeLocation);
  if(!destinationChainProvider.taskScheduler) throw new Error("destinationChainProvider.taskRegister not set");
  const oakLocation = oakChain.getLocation();
  const sendExtrinsicResult = await destinationChainProvider.taskScheduler.scheduleTaskThroughXcm(oakLocation, taskEncodedCall, executionFeeLocation, taskExecutionFee, taskEncodedCallWeight, taskOverallWeight, deriveAccountId, keyPair);
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
    transfer: ( sourceChain: ChainProvider, destinationChain: ChainProvider, { asset, assetAmount } : { asset: Asset, assetAmount: BN }): void => {
      // TODO
      // sourceChain.transfer(destinationChain, asset, assetAmount);
    },
  }
};
