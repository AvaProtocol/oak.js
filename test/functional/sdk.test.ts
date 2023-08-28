import fs from 'fs';
import path from 'path';
import BN from 'bn.js';
import moment from 'moment';
import Keyring from '@polkadot/keyring';
import { u8aToHex } from '@polkadot/util';
import { Chain, ChainAsset, Weight }  from '@oak-network/sdk-types';
import { assets, chains } from '@oak-network/config';
import { MoonbeamAdapter, MangataAdapter, AstarAdapter, OakAdapter } from '@oak-network/adapter';
import { Sdk } from '@oak-network/sdk';

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

test('Test MoonbaseAdapter', async () => {
  const moonbeamAdapter = new MoonbeamAdapter(chains.moonbaseAlpha);
  await moonbeamAdapter.initialize();
  const moonbaseApi = moonbeamAdapter.getApi();
  const extrinsic = moonbaseApi.tx.system.remarkWithEvent('hello!');
  const { encodedCallWeight, overallWeight } = await moonbeamAdapter.getXcmWeight('0x31C5aA398Ae12B0dc423f47D47549095aA8c93A5', extrinsic);
  console.log('encodedCallWeight: ', encodedCallWeight);
  console.log('overallWeight: ', overallWeight);
  const { defaultAsset } = moonbeamAdapter.getChainData();
  const executionFee = await moonbeamAdapter.weightToFee(overallWeight, defaultAsset?.location);
  console.log('executionFee: ', executionFee.toString());
  moonbeamAdapter.destroy();
}, 1000000);


test('Test TuringAdapter', async () => {
  const turingAdapter = new OakAdapter(chains.turingStaging);
  await turingAdapter.initialize();
  const turingApi = turingAdapter.getApi();
  const extrinsic = turingApi.tx.system.remarkWithEvent('hello!');
  const { encodedCallWeight, overallWeight } = await turingAdapter.getXcmWeight('68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', extrinsic);
  console.log('encodedCallWeight: ', encodedCallWeight);
  console.log('overallWeight: ', overallWeight);
  const { defaultAsset } = turingAdapter.getChainData();
  const executionFee = await turingAdapter.weightToFee(overallWeight, defaultAsset?.location);
  console.log('executionFee: ', executionFee.toString());
  await turingAdapter.destroy();
}, 1000000);

test('Test MangataAdapter', async () => {
  const mangataAdapter = new MangataAdapter(chains.mangataRococo);
  await mangataAdapter.initialize();
  const mangataApi = mangataAdapter.getApi();
  const extrinsic = mangataApi.tx.system.remarkWithEvent('hello!');
  const { encodedCallWeight, overallWeight } = await mangataAdapter.getXcmWeight('68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', extrinsic);
  console.log('encodedCallWeight: ', encodedCallWeight);
  console.log('overallWeight: ', overallWeight);
  const executionFee = await mangataAdapter.weightToFee(overallWeight, assets.tur.location);
  console.log('executionFee: ', executionFee.toString());
  await mangataAdapter.destroy();
}, 1000000);

test('Test AstarAdapter', async () => {
  const astarAdapter = new AstarAdapter(chains.rocstar);
  await astarAdapter.initialize();
  const astarApi = astarAdapter.getApi();
  const extrinsic = astarApi.tx.system.remarkWithEvent('hello!');
  const { encodedCallWeight, overallWeight } = await astarAdapter.getXcmWeight('68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', extrinsic);
  console.log('encodedCallWeight: ', encodedCallWeight);
  console.log('overallWeight: ', overallWeight);
  const { defaultAsset } = astarAdapter.getChainData();
  const executionFee = await astarAdapter.weightToFee(overallWeight, defaultAsset?.location);
  console.log('executionFee: ', executionFee.toString());
  await astarAdapter.destroy();
}, 1000000);

test('Test Mangata XCMP task', async () => {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });
  const json = await readMnemonicFromFile();
  const keyPair = keyring.addFromJson(json);
  keyPair.unlock(process.env.PASS_PHRASE);

  // Initialize adapters
  const oakAdapter = new OakAdapter(chains.turingStaging);
  await oakAdapter.initialize();
  const mangataAdapter = new MangataAdapter(chains.mangataRococo);
  await mangataAdapter.initialize();

  // Make task payload extrinsic
  const mangataApi = mangataAdapter.getApi();
  const taskPayloadExtrinsic = mangataApi.tx.system.remarkWithEvent('hello!');

  // Schedule task with sdk
  const executionTimes = [getHourlyTimestamp(1)/1000];
  await Sdk().scheduleXcmpTaskWithPayThroughSoverignAccountFlow({
    oakAdapter,
    destinationChainAdapter: mangataAdapter,
    taskPayloadExtrinsic,
    schedule: { Fixed: { executionTimes } },
    keyPair,
  });

  // Destroy adapters
  await oakAdapter.destroy();
  await mangataAdapter.destroy();
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

  // Initialize adapters
  const oakAdapter = new OakAdapter(chains.turingMoonbase);
  await oakAdapter.initialize();
  const moonbeamAdapter = new MoonbeamAdapter(chains.moonbaseAlpha);
  await moonbeamAdapter.initialize();

  // Make task payload extrinsic
  const moonbeamApi = moonbeamAdapter.getApi();
  const taskPayloadExtrinsic = moonbeamApi.tx.system.remarkWithEvent('hello!');

  // Schedule task with sdk
  const { defaultAsset } = moonbeamAdapter.getChainData();
  if (!defaultAsset) throw new Error("defaultAsset not set");
  const executionTimes = [getHourlyTimestamp(1)/1000];
  await Sdk().scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow({
    oakAdapter,
    destinationChainAdapter: moonbeamAdapter,
    taskPayloadExtrinsic,
    scheduleFeeLocation: defaultAsset.location,
    executionFeeLocation: defaultAsset.location,
    schedule: { Fixed: { executionTimes } },
    scheduleAs: u8aToHex(keyPair.addressRaw),
    keyPair: ethKeyPair,
  });

  // Destroy adapters
  await oakAdapter.destroy();
  await moonbeamAdapter.destroy();
}, 1000000);

test('Test Astar XCMP task', async () => {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });
  const json = await readMnemonicFromFile();
  const keyPair = keyring.addFromJson(json);
  keyPair.unlock(process.env.PASS_PHRASE);

  // Initialize adapters
  const oakAdapter = new OakAdapter(chains.turingStaging);
  await oakAdapter.initialize();
  const astarProvider = new AstarAdapter(chains.rocstar);
  await astarProvider.initialize();

  // Make task payload extrinsic
  const moonbeamApi = astarProvider.getApi();
  const taskPayloadExtrinsic = moonbeamApi.tx.system.remarkWithEvent('hello!');

  // Schedule task with sdk
  const { defaultAsset } = astarProvider.getChainData();
  if (!defaultAsset) throw new Error("defaultAsset not set");
  const executionTimes = [getHourlyTimestamp(1)/1000];
  await Sdk().scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow({
    oakAdapter,
    destinationChainAdapter: astarProvider,
    taskPayloadExtrinsic,
    scheduleFeeLocation: defaultAsset.location,
    executionFeeLocation: defaultAsset.location,
    schedule: { Fixed: { executionTimes } },
    scheduleAs: u8aToHex(keyPair.addressRaw),
    keyPair,
  });

  // Destroy adapters
  await oakAdapter.destroy();
  await astarProvider.destroy();
}, 1000000);

test('Test Moonbeam transfer', async () => {
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

  // Initialize adapters
  const oakAdapter = new OakAdapter(chains.turingMoonbase);
  await oakAdapter.initialize();
  const moonbeamAdapter = new MoonbeamAdapter(chains.moonbaseAlpha);
  await moonbeamAdapter.initialize();

  // Calculate Moonbase derive account on Turing
  const { defaultAsset, paraId } = moonbeamAdapter.getChainData();
  if (!defaultAsset) throw new Error("defaultAsset not set");
  if (!paraId) throw new Error("paraId not set");
  
  const deriveAccountOnTuring = oakAdapter.getDeriveAccount(u8aToHex(ethKeyPair.addressRaw), paraId);
  console.log('deriveAccountOnTuring; ', deriveAccountOnTuring);

  // Transfer
  await moonbeamAdapter.crossChainTransfer(
    oakAdapter.getLocation(),
    deriveAccountOnTuring,
    defaultAsset.location,
    new BN('200000000000000000'),
    ethKeyPair,
  );

  // Destroy adapters
  await oakAdapter.destroy();
  await moonbeamAdapter.destroy();
}, 1000000);

test('Test Astar transfer', async () => {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });
  const json = await readMnemonicFromFile();
  const keyPair = keyring.addFromJson(json);
  keyPair.unlock(process.env.PASS_PHRASE);

  // Initialize adapters
  const oakAdapter = new OakAdapter(chains.turingStaging);
  await oakAdapter.initialize();
  const astarAdapter = new AstarAdapter(chains.rocstar);
  await astarAdapter.initialize();

  // Calculate Astar derive account on Turing
  const { defaultAsset, paraId } = astarAdapter.getChainData();
  if (!defaultAsset) throw new Error("defaultAsset not set");
  if (!paraId) throw new Error("paraId not set");
  
  const deriveAccountOnTuring = oakAdapter.getDeriveAccount(u8aToHex(keyPair.addressRaw), paraId);
  console.log('deriveAccountOnTuring; ', deriveAccountOnTuring);

  // Transfer
  await astarAdapter.crossChainTransfer(
    oakAdapter.getLocation(),
    deriveAccountOnTuring,
    defaultAsset.location,
    new BN('200000000000000000'),
    keyPair,
  );

  // Destroy adapters
  await oakAdapter.destroy();
  await astarAdapter.destroy();
}, 1000000);

test('Test OakAdapter transfer', async () => {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });
  const json = await readMnemonicFromFile();
  const keyPair = keyring.addFromJson(json);
  keyPair.unlock(process.env.PASS_PHRASE);

  // Initialize adapters
  const oakAdapter = new OakAdapter(chains.turingStaging);
  await oakAdapter.initialize();
  const mangataAdapter = new MangataAdapter(chains.mangataRococo);
  await mangataAdapter.initialize();

  const { defaultAsset: oakAsset } = oakAdapter.getChainData();
  if (!oakAsset) throw new Error("defaultAsset not set");

  // Transfer
  await oakAdapter.crossChainTransfer(
    mangataAdapter.getLocation(),
    u8aToHex(keyPair.addressRaw),
    oakAsset.location,
    new BN('50000000000'),
    keyPair,
  );

  // Destroy adapters
  await oakAdapter.destroy();
  await mangataAdapter.destroy();
}, 1000000);


test('Test MangatAdapter transfer', async () => {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });
  const json = await readMnemonicFromFile();
  const keyPair = keyring.addFromJson(json);
  keyPair.unlock(process.env.PASS_PHRASE);

  // Initialize adapters
  const oakAdapter = new OakAdapter(chains.turingStaging);
  await oakAdapter.initialize();
  const mangataAdapter = new MangataAdapter(chains.mangataRococo);
  await mangataAdapter.initialize();

  const { defaultAsset: oakAsset } = oakAdapter.getChainData();
  if (!oakAsset) throw new Error("defaultAsset not set");

  // Transfer
  await mangataAdapter.crossChainTransfer(
    oakAdapter.getLocation(),
    u8aToHex(keyPair.addressRaw),
    oakAsset.location,
    new BN('100000000000000'),
    keyPair,
  );

  // Destroy adapters
  await oakAdapter.destroy();
  await mangataAdapter.destroy();
}, 1000000);
