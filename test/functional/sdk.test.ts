import BN from 'bn.js';
import moment from 'moment';
import Keyring from '@polkadot/keyring';
import { Chain, ChainAsset, Weight }  from '@oak-network/sdk-types';
import { assets, chains } from '@oak-network/config';
import { u8aToHex } from '@polkadot/util';
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

export const readEthMnemonicFromFile = async () => {
  const jsonPath = path.join(__dirname, '../../private', 'seed-eth.json');
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

test('Test MoonbaseProvider', async () => {
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


test('Test TuringProvider', async () => {
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

test('Test MangataProvider', async () => {
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

test('Test AstarProvider', async () => {
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

test('Test Mangata XCMP task', async () => {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });
  const json = await readMnemonicFromFile();
  const keyPair = keyring.addFromJson(json);
  keyPair.unlock(process.env.PASS_PHRASE);

  // Initialize providers
  const oakChain = new OakChain(chains.turingStaging);
  await oakChain.initialize();
  const mangataProvider = new MangataProvider(chains.mangataRococo);
  await mangataProvider.initialize();

  // Make task payload extrinsic
  const mangataApi = mangataProvider.chain.getApi();
  const taskPayloadExtrinsic = mangataApi.tx.system.remarkWithEvent('hello!');

  // Schedule task with sdk
  const executionTimes = [getHourlyTimestamp(1)/1000];
  await Sdk().scheduleXcmpTaskWithPayThroughSoverignAccountFlow({
    oakChain,
    destinationChainProvider: mangataProvider,
    taskPayloadExtrinsic,
    schedule: { Fixed: { executionTimes } },
    keyPair,
  });

  // Destroy providers
  await oakChain.destroy();
  await mangataProvider.destroy();
}, 1000000);

test('Test Moonbase XCMP task', async () => {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });
  const json = await readMnemonicFromFile();
  const keyPair = keyring.addFromJson(json);
  keyPair.unlock(process.env.PASS_PHRASE);

  // Create a keyring instance
  const jsonEth = await readEthMnemonicFromFile();
  const ethKeyring = new Keyring({ type: 'ethereum' });
  const ethKeyPair = ethKeyring.addFromJson(jsonEth);
  ethKeyPair.unlock(process.env.PASS_PHRASE_ETH);

  // Initialize providers
  const oakChain = new OakChain(chains.turingMoonbase);
  await oakChain.initialize();
  const moonbeamProvider = new MoonbeamProvider(chains.moonbaseAlpha);
  await moonbeamProvider.initialize();

  // Make task payload extrinsic
  const moonbeamApi = moonbeamProvider.chain.getApi();
  const taskPayloadExtrinsic = moonbeamApi.tx.system.remarkWithEvent('hello!');

  // Schedule task with sdk
  const { defaultAsset } = moonbeamProvider.chain.getChainData();
  if (!defaultAsset) throw new Error("defaultAsset not set");
  const executionTimes = [getHourlyTimestamp(1)/1000];
  await Sdk().scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow({
    oakChain,
    destinationChainProvider: moonbeamProvider,
    taskPayloadExtrinsic,
    scheduleFeeLocation: defaultAsset.location,
    executionFeeLocation: defaultAsset.location,
    schedule: { Fixed: { executionTimes } },
    scheduleAs: u8aToHex(keyPair.addressRaw),
    keyPair: ethKeyPair,
  });

  // Destroy providers
  await oakChain.destroy();
  await moonbeamProvider.destroy();
}, 1000000);

test('Test Astar XCMP task', async () => {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });
  const json = await readMnemonicFromFile();
  const keyPair = keyring.addFromJson(json);
  keyPair.unlock(process.env.PASS_PHRASE);

  // Initialize providers
  const oakChain = new OakChain(chains.turingStaging);
  await oakChain.initialize();
  const astarProvider = new AstarProvider(chains.rocstar);
  await astarProvider.initialize();

  // Make task payload extrinsic
  const moonbeamApi = astarProvider.chain.getApi();
  const taskPayloadExtrinsic = moonbeamApi.tx.system.remarkWithEvent('hello!');

  const { defaultAsset } = astarProvider.chain.getChainData();
  if (!defaultAsset) throw new Error("defaultAsset not set");
  // Schedule task with sdk
  const executionTimes = [getHourlyTimestamp(1)/1000];
  await Sdk().scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow({
    oakChain,
    destinationChainProvider: astarProvider,
    taskPayloadExtrinsic,
    scheduleFeeLocation: defaultAsset.location,
    executionFeeLocation: defaultAsset.location,
    schedule: { Fixed: { executionTimes } },
    scheduleAs: u8aToHex(keyPair.addressRaw),
    keyPair,
  });

  // Destroy providers
  await oakChain.destroy();
  await astarProvider.destroy();
}, 1000000);
