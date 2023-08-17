import { ChainProvider, TuringChain } from '@oak-foundation/xcm-provider';

export const Sdk = () => ({
	scheduleTask: (turing: TuringChain, dest: ChainProvider) => {
		// TODO: Implement
		console.log('scheduleTask');
	},
	transfer: (source: TuringChain, dest: ChainProvider) => {
		// TODO: Implement
		console.log('transfer');
	}
});
