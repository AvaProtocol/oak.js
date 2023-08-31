import fs from 'fs';
import path from 'path';
import BN from 'bn.js';
import moment from 'moment';
import Keyring from '@polkadot/keyring';
import { u8aToHex } from '@polkadot/util';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Chain, ChainAsset, Weight }  from '@oak-network/sdk-types';
import { assets, chains } from '@oak-network/config';
import { MoonbeamAdapter, MangataAdapter, AstarAdapter, OakAdapter } from '@oak-network/adapter';
import { Sdk } from '@oak-network/sdk';
import { rpc, types, runtime } from '@oak-network/types';
import { Mangata } from '@mangata-finance/sdk';

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
  const moonbaseApi = await ApiPromise.create({ provider: new WsProvider(chains.moonbaseAlpha.endpoint) });
  const moonbeamAdapter = new MoonbeamAdapter(moonbaseApi, chains.moonbaseAlpha);
  await moonbeamAdapter.initialize();
  const extrinsic = moonbaseApi.tx.system.remarkWithEvent('hello!');
  const { encodedCallWeight, overallWeight } = await moonbeamAdapter.getXcmWeight(extrinsic, '0x31C5aA398Ae12B0dc423f47D47549095aA8c93A5', 6);
  console.log('encodedCallWeight: ', encodedCallWeight);
  console.log('overallWeight: ', overallWeight);
  const { defaultAsset } = moonbeamAdapter.getChainData();
  const executionFee = await moonbeamAdapter.weightToFee(overallWeight, defaultAsset?.location);
  console.log('executionFee: ', executionFee.toString());
  await moonbaseApi.disconnect();
}, 1000000);

test('Test TuringAdapter', async () => {
  const turingApi = await ApiPromise.create({ provider: new WsProvider(chains.turingStaging.endpoint), rpc, types, runtime });
  const turingAdapter = new OakAdapter(turingApi, chains.turingStaging);
  await turingAdapter.initialize();
  const extrinsic = turingApi.tx.system.remarkWithEvent('hello!');
  const { encodedCallWeight, overallWeight } = await turingAdapter.getXcmWeight(extrinsic, '68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', 6);
  console.log('encodedCallWeight: ', encodedCallWeight);
  console.log('overallWeight: ', overallWeight);
  const { defaultAsset } = turingAdapter.getChainData();
  const executionFee = await turingAdapter.weightToFee(overallWeight, defaultAsset?.location);
  console.log('executionFee: ', executionFee.toString());
  await turingApi.disconnect();
}, 1000000);

test('Test MangataAdapter', async () => {
  const mangataSdk = Mangata.getInstance([chains.mangataRococo.endpoint]);
  const mangataApi = await mangataSdk.getApi();
  const mangataAdapter = new MangataAdapter(mangataApi, chains.mangataRococo);
  await mangataAdapter.initialize();
  const extrinsic = mangataApi.tx.system.remarkWithEvent('hello!');
  const { encodedCallWeight, overallWeight } = await mangataAdapter.getXcmWeight(extrinsic, '68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', 6);
  console.log('encodedCallWeight: ', encodedCallWeight);
  console.log('overallWeight: ', overallWeight);
  const executionFee = await mangataAdapter.weightToFee(overallWeight, assets.tur.location);
  console.log('executionFee: ', executionFee.toString());
  mangataSdk.disconnect();
}, 1000000);

test('Test AstarAdapter', async () => {
  const astarApi = await ApiPromise.create({ provider: new WsProvider(chains.rocstar.endpoint) });
  const astarAdapter = new AstarAdapter(astarApi, chains.rocstar);
  await astarAdapter.initialize();
  const extrinsic = astarApi.tx.system.remarkWithEvent('hello!');
  const { encodedCallWeight, overallWeight } = await astarAdapter.getXcmWeight(extrinsic, '68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', 6);
  console.log('encodedCallWeight: ', encodedCallWeight);
  console.log('overallWeight: ', overallWeight);
  const { defaultAsset } = astarAdapter.getChainData();
  const executionFee = await astarAdapter.weightToFee(overallWeight, defaultAsset?.location);
  console.log('executionFee: ', executionFee.toString());
  await astarApi.disconnect();
}, 1000000);

test('Test Mangata XCMP task', async () => {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });
  const json = await readMnemonicFromFile();
  const keyPair = keyring.addFromJson(json);
  keyPair.unlock(process.env.PASS_PHRASE);

  // Initialize adapters
  const turingApi = await ApiPromise.create({ provider: new WsProvider(chains.turingStaging.endpoint), rpc, types, runtime });
  const oakAdapter = new OakAdapter(turingApi, chains.turingStaging);
  await oakAdapter.initialize();
  const mangataSdk = Mangata.getInstance([chains.mangataRococo.endpoint]);
  const mangataApi = await mangataSdk.getApi();
  const mangataAdapter = new MangataAdapter(mangataApi, chains.mangataRococo);
  await mangataAdapter.initialize();

  // Make task payload extrinsic
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

  await turingApi.disconnect();
  await mangataApi.disconnect();
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
  const oakApi = await ApiPromise.create({ provider: new WsProvider(chains.turingStaging.endpoint), rpc, types, runtime });
  const oakAdapter = new OakAdapter(oakApi, chains.turingMoonbase);
  await oakAdapter.initialize();
  const moonbeamApi = await ApiPromise.create({ provider: new WsProvider(chains.moonbaseAlpha.endpoint) });
  const moonbeamAdapter = new MoonbeamAdapter(moonbeamApi, chains.moonbaseAlpha);
  await moonbeamAdapter.initialize();

  // Make task payload extrinsic
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

  await oakApi.disconnect();
  await moonbeamApi.disconnect();
}, 1000000);

test('Test Astar XCMP task', async () => {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });
  const json = await readMnemonicFromFile();
  const keyPair = keyring.addFromJson(json);
  keyPair.unlock(process.env.PASS_PHRASE);

  // Initialize adapters
  const oakApi = await ApiPromise.create({ provider: new WsProvider(chains.turingStaging.endpoint), rpc, types, runtime });
  const oakAdapter = new OakAdapter(oakApi, chains.turingStaging);
  await oakAdapter.initialize();
  const astarApi = await ApiPromise.create({ provider: new WsProvider(chains.rocstar.endpoint) });
  const astarProvider = new AstarAdapter(astarApi, chains.rocstar);
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

  await oakApi.disconnect();
  await astarApi.disconnect();
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
  const oakApi = await ApiPromise.create({ provider: new WsProvider(chains.turingStaging.endpoint), rpc, types, runtime });
  const oakAdapter = new OakAdapter(oakApi, chains.turingMoonbase);
  await oakAdapter.initialize();
  const moonbeamApi = await ApiPromise.create({ provider: new WsProvider(chains.moonbaseAlpha.endpoint) });
  const moonbeamAdapter = new MoonbeamAdapter(moonbeamApi, chains.moonbaseAlpha);
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

  await oakApi.disconnect();
  await moonbeamApi.disconnect();
}, 1000000);

test('Test Astar transfer', async () => {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });
  const json = await readMnemonicFromFile();
  const keyPair = keyring.addFromJson(json);
  keyPair.unlock(process.env.PASS_PHRASE);

  // Initialize adapters
  const oakApi = await ApiPromise.create({ provider: new WsProvider(chains.turingStaging.endpoint), rpc, types, runtime });
  const oakAdapter = new OakAdapter(oakApi, chains.turingStaging);
  await oakAdapter.initialize();
  const astarApi = await ApiPromise.create({ provider: new WsProvider(chains.rocstar.endpoint) });
  const astarAdapter = new AstarAdapter(astarApi, chains.rocstar);
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

  // Disconnect
  await oakApi.disconnect();
  await astarApi.disconnect();
}, 1000000);

test('Test OakAdapter transfer', async () => {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });
  const json = await readMnemonicFromFile();
  const keyPair = keyring.addFromJson(json);
  keyPair.unlock(process.env.PASS_PHRASE);

  // Initialize adapters
  const oakApi = await ApiPromise.create({ provider: new WsProvider(chains.turingStaging.endpoint), rpc, types, runtime });
  const oakAdapter = new OakAdapter(oakApi, chains.turingStaging);
  await oakAdapter.initialize();
  const mangataSdk = Mangata.getInstance([chains.mangataRococo.endpoint]);
  const mangataApi = await mangataSdk.getApi();
  const mangataAdapter = new MangataAdapter(mangataApi, chains.mangataRococo);
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

   // Disconnect
   await oakApi.disconnect();
   await mangataSdk.disconnect();
}, 1000000);


test('Test MangatAdapter transfer', async () => {
  // Create a keyring instance
  const keyring = new Keyring({ type: 'sr25519' });
  const json = await readMnemonicFromFile();
  const keyPair = keyring.addFromJson(json);
  keyPair.unlock(process.env.PASS_PHRASE);

  // Initialize adapters
  const oakApi = await ApiPromise.create({ provider: new WsProvider(chains.turingStaging.endpoint), rpc, types, runtime });
  const oakAdapter = new OakAdapter(oakApi, chains.turingStaging);
  await oakAdapter.initialize();
  const mangataSdk = Mangata.getInstance([chains.mangataRococo.endpoint]);
  const mangataApi = await mangataSdk.getApi();
  const mangataAdapter = new MangataAdapter(mangataApi, chains.mangataRococo);
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

  // Disconnect
  await oakApi.disconnect();
  await mangataSdk.disconnect();
}, 1000000);
