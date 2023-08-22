import BN from 'bn.js';
import moment from 'moment';
import Keyring from '@polkadot/keyring';
import { Chain, ChainAsset, Weight }  from '@oak-network/sdk-types';
import { assets, chains } from '@oak-network/config';
import { MoonbeamProvider, ChainProvider, OakProvider, MangataProvider, AstarProvider, OakChain } from '@oak-network/provider';
import { Sdk } from '@oak-network/sdk';
import fs from 'fs';
import path from 'path';

export const getHourlyTimestamp = (hour: number) => (moment().add(hour, 'hour').startOf('hour')).valueOf();

export const readMnemonicFromFile = async () => {
	const jsonPath = path.join(__dirname, '../../private', 'seed.json');
	const json = await fs.promises.readFile(jsonPath);
	return JSON.parse(json.toString());
};

test('Test sdk-types', async () => {
	const turAsset = new ChainAsset({ asset: assets.tur, isNative: true });
	const chain = new Chain({ key: 'turing-local', assets: [turAsset], defaultAsset: turAsset, endpoint: 'ws://127.0.0.1:9946', relayChain: 'local', instructionWeight: new Weight(new BN(1), new BN(2)) });
	console.log('chain: ', chain);
});

test('Test config', async () => {
	console.log('turLocal: ', chains.turingLocal);
	console.log('moonbaseLocal: ', chains.moonbaseLocal);
});

test('Test provider', async () => {
	const turingChain = new OakChain(chains.turingStaging);
	const chainProvider = new ChainProvider(turingChain, undefined);
	await chainProvider.initialize();
	console.log('chainProvider: ', chainProvider);
	await chainProvider.destroy();
}, 1000000);

test('Test moonbase', async () => {
	const moonbeamProvider = new MoonbeamProvider(chains.moonbaseAlpha);
	await moonbeamProvider.initialize();
	const moonbaseApi = moonbeamProvider.chain.getApi();
	const extrinsic = moonbaseApi.tx.system.remarkWithEvent('hello!');
	const { encodedCallWeight, overallWeight } = await moonbeamProvider.chain.getXcmWeight('0x31C5aA398Ae12B0dc423f47D47549095aA8c93A5', extrinsic);
	console.log('encodedCallWeight: ', encodedCallWeight);
	console.log('overallWeight: ', overallWeight);
	const { defaultAsset } = moonbeamProvider.chain.getChainData();
	const executionFee = await moonbeamProvider.chain.weightToFee(overallWeight, defaultAsset?.location);
	console.log('executionFee: ', executionFee.toString());
	moonbeamProvider.destroy();
}, 1000000);


test('Test turing', async () => {
	const turingProvider = new OakProvider(chains.turingStaging);
	await turingProvider.initialize();
	const turingApi = turingProvider.chain.getApi();
	const extrinsic = turingApi.tx.system.remarkWithEvent('hello!');
	const { encodedCallWeight, overallWeight } = await turingProvider.chain.getXcmWeight('68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', extrinsic);
	console.log('encodedCallWeight: ', encodedCallWeight);
	console.log('overallWeight: ', overallWeight);
	const { defaultAsset } = turingProvider.chain.getChainData();
	const executionFee = await turingProvider.chain.weightToFee(overallWeight, defaultAsset?.location);
	console.log('executionFee: ', executionFee.toString());
	await turingProvider.destroy();
}, 1000000);

test('Test mangata', async () => {
	const mangataProvider = new MangataProvider(chains.mangataRococo);
	await mangataProvider.initialize();
	const mangataApi = mangataProvider.chain.getApi();
	const extrinsic = mangataApi.tx.system.remarkWithEvent('hello!');
	const { encodedCallWeight, overallWeight } = await mangataProvider.chain.getXcmWeight('68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', extrinsic);
	console.log('encodedCallWeight: ', encodedCallWeight);
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
	const { encodedCallWeight, overallWeight } = await astarProvider.chain.getXcmWeight('68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', extrinsic);
	console.log('encodedCallWeight: ', encodedCallWeight);
	console.log('overallWeight: ', overallWeight);
	const { defaultAsset } = astarProvider.chain.getChainData();
	const executionFee = await astarProvider.chain.weightToFee(overallWeight, defaultAsset?.location);
	console.log('executionFee: ', executionFee.toString());
	await astarProvider.destroy();
}, 1000000);

test('Test PayThroughSoverignAccount XCMP task', async () => {
	// Create a keyring instance
	const keyring = new Keyring({ type: 'sr25519' });
	const json = await readMnemonicFromFile();
	const keyPair = keyring.addFromJson(json);
	keyPair.unlock(process.env.PASS_PHRASE);

	// Initialize providers
	const turingProvider = new OakProvider(chains.turingStaging);
	await turingProvider.initialize();
	const mangataProvider = new MangataProvider(chains.mangataRococo);
	await mangataProvider.initialize();

	// Make task payload extrinsic
	const mangataApi = mangataProvider.chain.getApi();
	const taskPayloadExtrinsic = mangataApi.tx.system.remarkWithEvent('hello!');

	// Schedule task with sdk
	const executionTimes = [getHourlyTimestamp(1)/1000];
	await Sdk().scheduleXcmpTask(turingProvider, mangataProvider, {
		instructionSequnce: 'PayThroughSoverignAccount',
		taskPayloadExtrinsic,
		schedule: { Fixed: { executionTimes } },
		keyPair,
	});

	// Destroy providers
	await turingProvider.destroy();
	await mangataProvider.destroy();
}, 1000000);
