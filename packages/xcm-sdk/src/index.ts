import { TuringChain, ChainProvider } from '@oak-foundation/xcm-config';

export function Sdk() {
  return {
    registryTask: ({ instructionSequnce, turingChain: TuringChain, destinationChainProvider: ChainProvider, taskPayload, schedule, scheduleFee, executionFee, scheduleAs}): hash => {
			if (instrucitonSequnce == 'PayThroughSoverignAccount') {
				// const extrinsic = turingChain.scheduleXcmpTask(...)
				// sendExtrinsic(turingApi,extrinsic) 
			} else {
				// destinationChainProvider.taskRegistry.createRegistryTaskExtrinsic()
				// sendExtrinsic(destinationApi, extrinsic); 
			}
		},
    transfer: ({ sourceChain: ChainProvider, destinationChain: ChainProvider, asset, assetAmount}): hash => {
			// TODO
			// sourceChain.transfer(destinationChain, asset, assetAmount);
		},
  }
};
