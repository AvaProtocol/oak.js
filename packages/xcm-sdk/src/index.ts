import BN from 'bn.js';
import { ChainProvider, OakProvider } from '@oak-network/xcm-provider';
import { Asset } from '@oak-network/xcm-types';

export function Sdk() {
  return {
    scheduleXcmpTask: (oakProvider: OakProvider, destinationChainProvider: ChainProvider, { instructionSequnce }: { instructionSequnce: string }): void => {
			if (instructionSequnce == 'PayThroughSoverignAccount') {
				// const extrinsic = turingChain.scheduleXcmpTask(...)
				// sendExtrinsic(turingApi,extrinsic) 
			} else {
				// destinationChainProvider.taskRegistry.createRegistryTaskExtrinsic()
				// sendExtrinsic(destinationApi, extrinsic); 
			}
		},
    transfer: ( sourceChain: ChainProvider, destinationChain: ChainProvider, { asset, assetAmount } : { asset: Asset, assetAmount: BN }): void => {
			// TODO
			// sourceChain.transfer(destinationChain, asset, assetAmount);
		},
  }
};
