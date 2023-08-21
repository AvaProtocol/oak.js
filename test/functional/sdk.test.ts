import BN from 'bn.js';
import { Chain, ChainAsset, Weight }  from '@oak-foundation/xcm-types';
import { assets, chains } from '@oak-foundation/xcm-config';
import { MoonbeamChain, ChainProvider, TuringChain, MangataChain, AstarChain } from '@oak-foundation/xcm-provider';
// import { Sdk } from '@oak-foundation/xcm-sdk';
// import { ApiPromise, WsProvider } from '@polkadot/api';

const initialize = async () => {
  jest.setTimeout(540000);
}

beforeEach(() => initialize());

test('Test xcm-types', async () => {
	const turAsset = new ChainAsset({ asset: assets.tur, isNative: true });
	const chain = new Chain({ assets: [turAsset], defaultAsset: turAsset, endpoint: 'ws://', instructionWeight: new Weight(new BN(1), new BN(2)) });
	console.log('chain: ', chain);
});

test('Test xcm-config', async () => {
	console.log('turLocal: ', chains.turingLocal);
	console.log('moonbaseLocal: ', chains.moonbaseLocal);
});

test('Test xcm-provider', async () => {
	const moonbeam = new MoonbeamChain(chains.moonbaseLocal);
	const chainProvider = new ChainProvider(moonbeam, moonbeam);
	console.log('chainProvider: ', chainProvider);
});

test('Test moonbase', async () => {
	const moonbeam = new MoonbeamChain(chains.moonbaseAlpha);
	await moonbeam.initialize();
	const moonbeamProvider = new ChainProvider(moonbeam, moonbeam);
	const moonbaseApi = moonbeamProvider.chain.getApi();
	const extrinsic = moonbaseApi.tx.system.remarkWithEvent('hello!');
	const { extrinsicWeight, overallWeight } = await moonbeamProvider.chain.getXcmWeight('0x31C5aA398Ae12B0dc423f47D47549095aA8c93A5', extrinsic);
	console.log('extrinsicWeight: ', extrinsicWeight);
	console.log('overallWeight: ', overallWeight);
	const executionFee = await moonbeamProvider.chain.weightToFee(overallWeight, moonbeamProvider.chain.defaultAsset.location);
	console.log('executionFee: ', executionFee.toString());
}, 1000000);


test('Test turing', async () => {
	const turing = new TuringChain(chains.turingStaging);
	await turing.initialize();
	const turingProvider = new ChainProvider(turing, undefined);
	const turingApi = turingProvider.chain.getApi();
	const extrinsic = turingApi.tx.system.remarkWithEvent('hello!');
	const { extrinsicWeight, overallWeight } = await turingProvider.chain.getXcmWeight('68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', extrinsic);
	console.log('extrinsicWeight: ', extrinsicWeight);
	console.log('overallWeight: ', overallWeight);
	const executionFee = await turingProvider.chain.weightToFee(overallWeight, turingProvider.chain.defaultAsset.location);
	console.log('executionFee: ', executionFee.toString());
}, 1000000);

test('Test mangata', async () => {
	const mangata = new MangataChain(chains.turingStaging);
	await mangata.initialize();
	const mangataProvider = new ChainProvider(mangata, undefined);
	const mangataApi = mangataProvider.chain.getApi();
	const extrinsic = mangataApi.tx.system.remarkWithEvent('hello!');
	const { extrinsicWeight, overallWeight } = await mangataProvider.chain.getXcmWeight('68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', extrinsic);
	console.log('extrinsicWeight: ', extrinsicWeight);
	console.log('overallWeight: ', overallWeight);
	const executionFee = await mangataProvider.chain.weightToFee(overallWeight, assets.tur.location);
	console.log('executionFee: ', executionFee.toString());
}, 1000000);

test('Test Astar', async () => {
	const astar = new AstarChain(chains.rocstar);
	await astar.initialize();
	const astarProvider = new ChainProvider(astar, astar);
	const astarApi = astarProvider.chain.getApi();
	const extrinsic = astarApi.tx.system.remarkWithEvent('hello!');
	const { extrinsicWeight, overallWeight } = await astarProvider.chain.getXcmWeight('68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', extrinsic);
	console.log('extrinsicWeight: ', extrinsicWeight);
	console.log('overallWeight: ', overallWeight);
	const executionFee = await astarProvider.chain.weightToFee(overallWeight, astar.defaultAsset.location);
	console.log('executionFee: ', executionFee.toString());
}, 1000000);

// test('Test xcm-sdk', async () => {
// 	const turing = new TuringChain(chains.turingLocal);
// 	const moonbeam = new MoonbeamChain(chains.moonbaseLocal);
// 	const mooonbeamProvider = new ChainProvider(moonbeam, moonbeam);
// 	Sdk().scheduleTask(turing, mooonbeamProvider);
// });
