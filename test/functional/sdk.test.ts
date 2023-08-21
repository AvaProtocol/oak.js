import BN from 'bn.js';
import { Chain, ChainAsset, Weight }  from '@oak-foundation/xcm-types';
import { assets, chains } from '@oak-foundation/xcm-config';
import { MoonbeamProvider, ChainProvider, OakProvider, MangataProvider, AstarProvider, OakChain } from '@oak-foundation/xcm-provider';
import { Sdk } from '@oak-foundation/xcm-sdk';

test('Test xcm-types', async () => {
	const turAsset = new ChainAsset({ asset: assets.tur, isNative: true });
	const chain = new Chain({ key: 'turing-local', assets: [turAsset], defaultAsset: turAsset, endpoint: 'ws://127.0.0.1:9946', relayChain: 'local', instructionWeight: new Weight(new BN(1), new BN(2)) });
	console.log('chain: ', chain);
});

test('Test xcm-config', async () => {
	console.log('turLocal: ', chains.turingLocal);
	console.log('moonbaseLocal: ', chains.moonbaseLocal);
});

test('Test xcm-provider', async () => {
	const turingChain = new OakChain(chains.turingStaging);
	const chainProvider = new ChainProvider(turingChain, undefined);
	await chainProvider.initialize();
	console.log('chainProvider: ', chainProvider);
	chainProvider.destroy();
});

test('Test moonbase', async () => {
	const moonbeamProvider = new MoonbeamProvider(chains.moonbaseAlpha);
	moonbeamProvider.initialize();
	const moonbaseApi = moonbeamProvider.chain.getApi();
	const extrinsic = moonbaseApi.tx.system.remarkWithEvent('hello!');
	const { extrinsicWeight, overallWeight } = await moonbeamProvider.chain.getXcmWeight('0x31C5aA398Ae12B0dc423f47D47549095aA8c93A5', extrinsic);
	console.log('extrinsicWeight: ', extrinsicWeight);
	console.log('overallWeight: ', overallWeight);
	const executionFee = await moonbeamProvider.chain.weightToFee(overallWeight, moonbeamProvider.chain.defaultAsset.location);
	console.log('executionFee: ', executionFee.toString());
	moonbeamProvider.destroy();
}, 1000000);


test('Test turing', async () => {
	const turingProvider = new OakProvider(chains.turingStaging);
	await turingProvider.initialize();
	const turingApi = turingProvider.chain.getApi();
	const extrinsic = turingApi.tx.system.remarkWithEvent('hello!');
	const { extrinsicWeight, overallWeight } = await turingProvider.chain.getXcmWeight('68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', extrinsic);
	console.log('extrinsicWeight: ', extrinsicWeight);
	console.log('overallWeight: ', overallWeight);
	const executionFee = await turingProvider.chain.weightToFee(overallWeight, turingProvider.chain.defaultAsset.location);
	console.log('executionFee: ', executionFee.toString());
	await turingProvider.destroy();
}, 1000000);

test('Test mangata', async () => {
	const mangataProvider = new MangataProvider(chains.mangataRococo);
	await mangataProvider.initialize();
	const mangataApi = mangataProvider.chain.getApi();
	const extrinsic = mangataApi.tx.system.remarkWithEvent('hello!');
	const { extrinsicWeight, overallWeight } = await mangataProvider.chain.getXcmWeight('68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', extrinsic);
	console.log('extrinsicWeight: ', extrinsicWeight);
	console.log('overallWeight: ', overallWeight);
	const executionFee = await mangataProvider.chain.weightToFee(overallWeight, assets.tur.location);
	console.log('executionFee: ', executionFee.toString());
	await mangataProvider.destroy();
}, 1000000);

test('Test Astar', async () => {
	const astarProvider = new AstarProvider(chains.rocstar);
	await astarProvider.initialize();
	const astarApi = astarProvider.chain.getApi();
	const extrinsic = astarApi.tx.system.remarkWithEvent('hello!');
	const { extrinsicWeight, overallWeight } = await astarProvider.chain.getXcmWeight('68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', extrinsic);
	console.log('extrinsicWeight: ', extrinsicWeight);
	console.log('overallWeight: ', overallWeight);
	const executionFee = await astarProvider.chain.weightToFee(overallWeight, astarProvider.chain.defaultAsset.location);
	console.log('executionFee: ', executionFee.toString());
	await astarProvider.destroy();
}, 1000000);

test('Test xcm-sdk', async () => {
	const turingProvider = new OakProvider(chains.turingLocal);
	const moonbeamProvider = new MoonbeamProvider(chains.moonbaseLocal);
	Sdk().scheduleXcmpTask(turingProvider, moonbeamProvider, { instructionSequnce: 'PayThroughSoverignAccount' });
	await turingProvider.destroy();
	await moonbeamProvider.destroy();
});
