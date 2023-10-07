import _ from 'lodash';
import BN from 'bn.js';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { u8aToHex } from '@polkadot/util';
import type { HexString } from '@polkadot/util/types';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { ApiPromise } from '@polkadot/api';
import { ChainAdapter, OakAdapter, TaskSchedulerChainAdapter, SendExtrinsicResult, XcmInstructionNetworkType } from '@oak-network/adapter';
import { Weight } from '@oak-network/sdk-types';

interface ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams {
  oakAdapter: OakAdapter;
  destinationChainAdapter: ChainAdapter;
  taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>;
  schedule: any;
  keyringPair: KeyringPair;
  xcmOptions?: {
    instructionCount?: number,
    overallWeight?: Weight;
    executionFeeAmount?: BN;
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
  xcmOptions?: {
    instructionCount?: number,
    overallWeight?: Weight;
    executionFeeAmount?: BN;
  };
}

interface AutomationPriceTriggerParams {
  chain: string;
  exchange: string;
  asset1: string;
  asset2: string;
  submittedAt: number;
  triggerFunction: 'lt' | 'gt';
  triggerParam: number[];
}

interface ScheduleXcmpPriceTaskWithPayThroughRemoteDerivativeAccountFlowParams {
  oakAdapter: OakAdapter;
  destinationChainAdapter: TaskSchedulerChainAdapter;
  taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>;
  scheduleFeeLocation: any,
  executionFeeLocation: any,
  automationPriceTriggerParams: AutomationPriceTriggerParams;
  scheduleAs: HexString;
  keyringPair: KeyringPair;
}

interface CommonScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams {
  oakAdapter: OakAdapter;
  destinationChainAdapter: TaskSchedulerChainAdapter;
  taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>;
  createTaskFunc: (params: CreateTaskFuncParams) => SubmittableExtrinsic<'promise'>;
  scheduleFeeLocation: any,
  executionFeeLocation: any,
  keyringPair: KeyringPair;
  xcmOptions?: {
    instructionCount?: number,
    overallWeight?: Weight;
    executionFeeAmount?: BN;
  };
}

interface CreateTaskFuncParams {
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
const scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow = async (params: CommonScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams) : Promise<SendExtrinsicResult> => {
  const {
    oakAdapter, destinationChainAdapter, taskPayloadExtrinsic, createTaskFunc, executionFeeLocation, keyringPair, xcmOptions,
  } = params;

  const { defaultAsset } = oakAdapter.getChainData();
  if (_.isUndefined(defaultAsset)) {
    throw new Error("chainData.defaultAsset not set");
  }

  const { paraId, xcmInstructionNetworkType, xcm } = destinationChainAdapter.getChainData();
  if (_.isUndefined(paraId)) {
    throw new Error("chainData.paraId not set");
  }
  if (_.isUndefined(xcmInstructionNetworkType)) {
    throw new Error("chainData.xcmInstructionNetworkType not set");
  }
  if (_.isUndefined(xcm)) {
    throw new Error("chainData.xcm not set");
  }

  // Caluculate weight and fee for task
  const destination = { V3: destinationChainAdapter.getLocation() };
  const encodedCall = taskPayloadExtrinsic.method.toHex();
  const oakTransactXcmInstructionCount = xcmOptions?.instructionCount || oakAdapter.getTransactXcmInstructionCount();
  const taskPayloadEncodedCallWeight = await destinationChainAdapter.getExtrinsicWeight(taskPayloadExtrinsic, keyringPair);
  const taskPayloadOverallWeight = xcmOptions?.overallWeight || await destinationChainAdapter.calculateXcmOverallWeight(taskPayloadEncodedCallWeight, oakTransactXcmInstructionCount);
  const executionFeeAmout = xcmOptions?.executionFeeAmount || await destinationChainAdapter.weightToFee(taskPayloadOverallWeight, executionFeeLocation);
  const executionFee = { assetLocation: { V3: executionFeeLocation }, amount: executionFeeAmout };

  // Calculate derive account on Turing/OAK
  const accountOptions = xcmInstructionNetworkType === XcmInstructionNetworkType.Concrete ? { locationType: 'XcmV3MultiLocation', network: xcm.network } : undefined;
  const deriveAccountId = oakAdapter.getDerivativeAccount(u8aToHex(keyringPair.addressRaw), paraId, accountOptions);

  // Create task extrinsic
  const taskExtrinsic = createTaskFunc({
    oakApi: oakAdapter.getApi(),
    destination,
    executionFee,
    encodedCall,
    encodedCallWeight: taskPayloadEncodedCallWeight,
    overallWeight: taskPayloadOverallWeight,
  });
  
  // Schedule task through XCM
  const taskEncodedCall = taskExtrinsic.method.toHex();
  const destinationTransactXcmInstructionCount = destinationChainAdapter.getTransactXcmInstructionCount();
  const taskEncodedCallWeight = await oakAdapter.getExtrinsicWeight(taskExtrinsic, deriveAccountId);
  const taskOverallWeight = await oakAdapter.calculateXcmOverallWeight(taskEncodedCallWeight, destinationTransactXcmInstructionCount);
  const taskExecutionFee = await oakAdapter.weightToFee(taskOverallWeight, executionFeeLocation);
  const oakLocation = oakAdapter.getLocation(); 
  const sendExtrinsicResult = await destinationChainAdapter.scheduleTaskThroughXcm(oakLocation, taskEncodedCall, executionFeeLocation, taskExecutionFee, taskEncodedCallWeight, taskOverallWeight, keyringPair);
  return sendExtrinsicResult;
};

export function Sdk() {
  return {
    /**
     * Schedule XCMP task with PayThroughSoverignAccount instruction sequances
     * @param params Operation params
     * @returns 
     */
    scheduleXcmpTaskWithPayThroughSoverignAccountFlow: async (params: ScheduleXcmpTaskWithPayThroughSoverignAccountFlowParams): Promise<SendExtrinsicResult> => {
      const { oakAdapter, destinationChainAdapter, taskPayloadExtrinsic, schedule, keyringPair, xcmOptions } = params;
      const { defaultAsset } = oakAdapter.getChainData();
      if (_.isUndefined(defaultAsset)) {
        throw new Error("chainData.defaultAsset not set");
      }

      // Caluculate weight and fee for task
      const destination = { V3: destinationChainAdapter.getLocation() };
      const encodedCall = taskPayloadExtrinsic.method.toHex();
      const oakTransactXcmInstructionCount = xcmOptions?.instructionCount || oakAdapter.getTransactXcmInstructionCount();
      const taskPayloadEncodedCallWeight = await destinationChainAdapter.getExtrinsicWeight(taskPayloadExtrinsic, keyringPair);
      const taskPayloadOverallWeight = xcmOptions?.overallWeight || await destinationChainAdapter.calculateXcmOverallWeight(taskPayloadEncodedCallWeight, oakTransactXcmInstructionCount);
      const scheduleFee = { V3: defaultAsset.location }
      const executionFeeAmout = xcmOptions?.executionFeeAmount || await destinationChainAdapter.weightToFee(taskPayloadOverallWeight, defaultAsset.location);
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
    },

    /**
     * Schedule XCMP time task with PayThroughRemoteDerivativeAccount instruction sequances
     * @param params Operation params
     * @returns 
     */
    scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow: async (params: ScheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlowParams): Promise<SendExtrinsicResult> => {
      const {
        oakAdapter, destinationChainAdapter, taskPayloadExtrinsic, scheduleFeeLocation, executionFeeLocation, schedule, scheduleAs, keyringPair,
      } = params;
      const createTaskFunc = (params: CreateTaskFuncParams) : SubmittableExtrinsic<'promise'> => {
        const { oakApi, destination, executionFee, encodedCall, encodedCallWeight, overallWeight } = params;
        console.log('scheduleFeeLocation: ', scheduleFeeLocation);
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
      const sendExtrinsicResult = scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow({
        oakAdapter, destinationChainAdapter, taskPayloadExtrinsic, createTaskFunc, scheduleFeeLocation, executionFeeLocation, keyringPair,
      });
      return sendExtrinsicResult;
    },

    /**
     * Schedule XCMP price task with PayThroughRemoteDerivativeAccount instruction sequances
     * @param params Operation params
     * @returns 
     */
    scheduleXcmpPriceTaskWithPayThroughRemoteDerivativeAccountFlow: async (params: ScheduleXcmpPriceTaskWithPayThroughRemoteDerivativeAccountFlowParams): Promise<SendExtrinsicResult> => {
      const {
        oakAdapter, destinationChainAdapter, taskPayloadExtrinsic, scheduleFeeLocation, executionFeeLocation,
        automationPriceTriggerParams, scheduleAs, keyringPair,
      } = params;
      const createTaskFunc = (params: CreateTaskFuncParams) : SubmittableExtrinsic<'promise'> => {
        const { oakApi, destination, executionFee, encodedCall, encodedCallWeight, overallWeight } = params;
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
      const sendExtrinsicResult = scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow({
        oakAdapter, destinationChainAdapter, taskPayloadExtrinsic, createTaskFunc, scheduleFeeLocation, executionFeeLocation, keyringPair,
      });
      return sendExtrinsicResult;
    },
  }
}