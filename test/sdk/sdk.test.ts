import _ from 'lodash';
import BN from 'bn.js';
import moment from 'moment';
import type { KeyringPair } from '@polkadot/keyring/types';
import { u8aToHex } from '@polkadot/util';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Chain, ChainAsset, Weight }  from '@oak-network/sdk-types';
import { assets, chains } from '@oak-network/config';
import { MoonbeamAdapter, MangataAdapter, AstarAdapter, OakAdapter } from '@oak-network/adapter';
import { Sdk } from '@oak-network/sdk';
import { rpc, types, runtime } from '@oak-network/types';
import { Mangata } from '@mangata-finance/sdk';
import { getEnvOrDefault, getKeyringPair, getMoonbeamKeyringPair } from '../utils/helpFn';
import { ChainPairConfig, chainPairConfigs } from './config';
import { DEFAULT_TIMEOUT_INITIALIZE, DEFAULT_TIMEOUT_PER_TEST } from '../utils/constants';

const getChainPairConfig = (env: string, chainFamily: string) : ChainPairConfig => {
  const envKey = env === 'Turing Staging' ? 'staging' : 'dev';
  const chainPairKey = `${chainFamily}-${envKey}`;
  const chainPairConfig = _.find(chainPairConfigs, ({ key: chainPairKey}));
  if (!chainPairConfig) throw new Error("chainPairConfig is not found");
  return chainPairConfig;
}

export const getHourlyTimestamp = (hour: number) => (moment().add(hour, 'hour').startOf('hour')).valueOf();

describe('test-basic', () => {
  test('test-sdk-types', async () => {
    const turAsset = new ChainAsset({ asset: assets.tur, isNative: true });
    const chain = new Chain({ key: 'turing-local', assets: [turAsset], defaultAsset: turAsset, endpoint: 'ws://127.0.0.1:9946', network: 'rococo', relayChain: 'local', instructionWeight: new Weight(new BN(1), new BN(2)) });
    console.log('chain: ', chain);
  });

  test('test-config', async () => {
    console.log('turLocal: ', chains.turingLocal);
    console.log('moonbaseLocal: ', chains.moonbaseLocal);
  });
});

describe('test-moonbeam', () => {
  let keyringPair: KeyringPair | undefined = undefined;
  let moonbaseKeyringPair: KeyringPair | undefined = undefined; 
  let turingApi: ApiPromise | undefined = undefined;
  let turingAdapter: OakAdapter | undefined = undefined;
  let moonbaseApi: ApiPromise | undefined = undefined;
  let moonbaseAdapter: MoonbeamAdapter | undefined = undefined;
  

  beforeAll(async () => {
    // Create keyringPair
    keyringPair = await getKeyringPair();

    // Create moonbase keyringPair
    moonbaseKeyringPair = await getMoonbeamKeyringPair();

    // Get configs
    const { oakConfig: turingConfig, peerConfig: moonbeamConfig } = getChainPairConfig(getEnvOrDefault(), 'moonbeam');

    // Initialize adapters
    turingApi = await ApiPromise.create({ provider: new WsProvider(turingConfig.endpoint), rpc, types, runtime });
    turingAdapter = new OakAdapter(turingApi, turingConfig);
    await turingAdapter.initialize();

    moonbaseApi = await ApiPromise.create({ provider: new WsProvider(moonbeamConfig.endpoint) });
    moonbaseAdapter = new MoonbeamAdapter(moonbaseApi, moonbeamConfig);
    await moonbaseAdapter.initialize();
  }, DEFAULT_TIMEOUT_INITIALIZE);

  test('test-moonbase-adapter', async () => {
    if (_.isUndefined(moonbaseApi) || _.isUndefined(moonbaseAdapter)) throw new Error("Not initialized yet");
    const extrinsic = moonbaseApi.tx.system.remarkWithEvent('hello!');
    const { encodedCallWeight, overallWeight } = await moonbaseAdapter.getXcmWeight(extrinsic, '0x31C5aA398Ae12B0dc423f47D47549095aA8c93A5', 6);
    console.log('encodedCallWeight: ', encodedCallWeight);
    console.log('overallWeight: ', overallWeight);
    const { defaultAsset } = moonbaseAdapter.getChainData();
    if (_.isUndefined(defaultAsset)) throw new Error("chainData.defaultAsset not set");
    const executionFee = await moonbaseAdapter.weightToFee(overallWeight, defaultAsset.location);
    console.log('executionFee: ', executionFee.toString());
  }, 1000000);

  test('test-moonbase-xcmp-task', async () => {
    if (_.isUndefined(turingAdapter) || _.isUndefined(moonbaseApi) || _.isUndefined(moonbaseAdapter) || _.isUndefined(keyringPair) || _.isUndefined(moonbaseKeyringPair)) throw new Error("Not initialized yet");
    // Make task payload extrinsic
    const taskPayloadExtrinsic = moonbaseApi.tx.system.remarkWithEvent('hello!');
  
    // Schedule task with sdk
    const { defaultAsset } = moonbaseAdapter.getChainData();
    if (_.isUndefined(defaultAsset)) throw new Error('chainData.defaultAsset not set');
    const executionTimes = [getHourlyTimestamp(1)/1000];
    await Sdk().scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow({
      oakAdapter: turingAdapter,
      destinationChainAdapter: moonbaseAdapter,
      taskPayloadExtrinsic,
      scheduleFeeLocation: defaultAsset.location,
      executionFeeLocation: defaultAsset.location,
      schedule: { Fixed: { executionTimes } },
      scheduleAs: u8aToHex(keyringPair.addressRaw),
      keyringPair: moonbaseKeyringPair,
    });
  }, DEFAULT_TIMEOUT_PER_TEST);
  
  test('test-moonbeam-transfer', async () => {
    if (_.isUndefined(turingAdapter) || _.isUndefined(moonbaseApi) || _.isUndefined(moonbaseAdapter) || _.isUndefined(keyringPair) || _.isUndefined(moonbaseKeyringPair)) throw new Error("Not initialized yet");
    // Calculate Moonbase derive account on Turing
    const { defaultAsset, paraId } = moonbaseAdapter.getChainData();
    if (_.isUndefined(defaultAsset)) throw new Error("defaultAsset not set");
    if (_.isUndefined(paraId)) throw new Error("paraId not set");
    
    const deriveAccountOnTuring = turingAdapter.getDerivativeAccount(u8aToHex(moonbaseKeyringPair.addressRaw), paraId);
    console.log('deriveAccountOnTuring; ', deriveAccountOnTuring);

    // Transfer
    await moonbaseAdapter.crossChainTransfer(
      turingAdapter.getLocation(),
      deriveAccountOnTuring,
      defaultAsset.location,
      new BN('200000000000000000'),
      moonbaseKeyringPair,
    );
  }, DEFAULT_TIMEOUT_PER_TEST);

  afterAll(async () => {
    await turingApi?.disconnect();
    await moonbaseApi?.disconnect();
  });
});

describe('test-astar', () => {
  let keyringPair: KeyringPair | undefined = undefined;
  let turingApi: ApiPromise | undefined = undefined;
  let turingAdapter: OakAdapter | undefined = undefined;
  let astarApi: ApiPromise | undefined = undefined;
  let astarAdapter: AstarAdapter | undefined = undefined;

  beforeAll(async () => {
    // Create keyringPair
    keyringPair = await getKeyringPair();

    // Get configs
    const { oakConfig: turingConfig, peerConfig: astarConfig } = getChainPairConfig(getEnvOrDefault(), 'astar');

    // Initialize adapters
    turingApi = await ApiPromise.create({ provider: new WsProvider(turingConfig.endpoint), rpc, types, runtime });
    turingAdapter = new OakAdapter(turingApi, turingConfig);
    await turingAdapter.initialize();

    astarApi = await ApiPromise.create({ provider: new WsProvider(astarConfig.endpoint) });
    astarAdapter = new AstarAdapter(astarApi, astarConfig);
    await astarAdapter.initialize();
  }, DEFAULT_TIMEOUT_INITIALIZE);

  test('test-astar-adapter', async () => {
    if (_.isUndefined(astarApi) || _.isUndefined(astarAdapter)) throw new Error("Not initialized yet");
    const extrinsic = astarApi.tx.system.remarkWithEvent('hello!');
    const { encodedCallWeight, overallWeight } = await astarAdapter.getXcmWeight(extrinsic, '68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', 6);
    console.log('encodedCallWeight: ', encodedCallWeight);
    console.log('overallWeight: ', overallWeight);
    const { defaultAsset } = astarAdapter.getChainData();
    if (_.isUndefined(defaultAsset)) throw new Error('chainData.defaultAsset not set');
    const executionFee = await astarAdapter.weightToFee(overallWeight, defaultAsset.location);
    console.log('executionFee: ', executionFee.toString());
    await astarApi.disconnect();
  }, DEFAULT_TIMEOUT_PER_TEST);

  test('test-astar-xcmp-task', async () => {
    if (_.isUndefined(astarApi) || _.isUndefined(turingAdapter) || _.isUndefined(astarAdapter) || _.isUndefined(keyringPair)) throw new Error("Not initialized yet");
    // Make task payload extrinsic
    const moonbeamApi = astarAdapter.getApi();
    const taskPayloadExtrinsic = moonbeamApi.tx.system.remarkWithEvent('hello!');
  
    // Schedule task with sdk
    const { defaultAsset } = astarAdapter.getChainData();
    if (_.isUndefined(defaultAsset)) throw new Error("chainData.defaultAsset not set");
    const executionTimes = [getHourlyTimestamp(1)/1000];
    await Sdk().scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow({
      oakAdapter: turingAdapter,
      destinationChainAdapter: astarAdapter,
      taskPayloadExtrinsic,
      scheduleFeeLocation: defaultAsset.location,
      executionFeeLocation: defaultAsset.location,
      schedule: { Fixed: { executionTimes } },
      scheduleAs: u8aToHex(keyringPair.addressRaw),
      keyringPair,
    });
  }, DEFAULT_TIMEOUT_PER_TEST);
  
  test('test-astar-transfer', async () => {
    if (_.isUndefined(astarApi) || _.isUndefined(turingAdapter) || _.isUndefined(astarAdapter) || _.isUndefined(keyringPair)) throw new Error("Not initialized yet");
    // Calculate Astar derive account on Turing
    const { defaultAsset, paraId } = astarAdapter.getChainData();
    if (_.isUndefined(defaultAsset)) throw new Error("chainData.defaultAsset not set");
    if (_.isUndefined(paraId)) throw new Error("chainData.paraId not set");
    
    const deriveAccountOnTuring = turingAdapter.getDerivativeAccount(u8aToHex(keyringPair.addressRaw), paraId);
    console.log('deriveAccountOnTuring; ', deriveAccountOnTuring);
  
    // Transfer
    await astarAdapter.crossChainTransfer(
      turingAdapter.getLocation(),
      deriveAccountOnTuring,
      defaultAsset.location,
      new BN('200000000000000000'),
      keyringPair,
    );
  }, DEFAULT_TIMEOUT_PER_TEST);

  afterAll(async () => {
    await turingApi?.disconnect();
    await astarApi?.disconnect();
  });
});

describe('test-mangata', () => {
  let keyringPair: KeyringPair | undefined = undefined;
  let turingApi: ApiPromise | undefined = undefined;
  let turingAdapter: OakAdapter | undefined = undefined;
  let mangataSdk: Mangata | undefined = undefined;
  let mangataApi: ApiPromise | undefined = undefined;
  let mangataAdapter: MangataAdapter | undefined = undefined;

  beforeAll(async () => {
    // Create keyringPair
    keyringPair = await getKeyringPair();

    // Get configs
    const { oakConfig: turingConfig, peerConfig: mangataConfig } = getChainPairConfig(getEnvOrDefault(), 'mangata');

    // Initialize adapters
    turingApi = await ApiPromise.create({ provider: new WsProvider(turingConfig.endpoint), rpc, types, runtime });
    turingAdapter = new OakAdapter(turingApi, turingConfig);
    await turingAdapter.initialize();

    mangataSdk = Mangata.getInstance([mangataConfig.endpoint]);
    mangataApi = await mangataSdk.getApi();
    mangataAdapter = new MangataAdapter(mangataApi, mangataConfig);
    await mangataAdapter.initialize();
  }, DEFAULT_TIMEOUT_INITIALIZE);

  test('test-turing-adapter', async () => {
    if (_.isUndefined(turingApi) || _.isUndefined(turingAdapter)) throw new Error("Not initialized yet");
    const extrinsic = turingApi.tx.system.remarkWithEvent('hello!');
    const { encodedCallWeight, overallWeight } = await turingAdapter.getXcmWeight(extrinsic, '68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', 6);
    console.log('encodedCallWeight: ', encodedCallWeight);
    console.log('overallWeight: ', overallWeight);
    const { defaultAsset } = turingAdapter.getChainData();
    if (_.isUndefined(defaultAsset)) throw new Error("chainData.defaultAsset not set");
    const executionFee = await turingAdapter.weightToFee(overallWeight, defaultAsset.location);
    console.log('executionFee: ', executionFee.toString());
  }, DEFAULT_TIMEOUT_PER_TEST);

  test('test-mangata-adapter', async () => {
    if (_.isUndefined(mangataApi) || _.isUndefined(mangataAdapter)) throw new Error("Not initialized yet");
    const extrinsic = mangataApi.tx.system.remarkWithEvent('hello!');
    const { encodedCallWeight, overallWeight } = await mangataAdapter.getXcmWeight(extrinsic, '68TwNoCpyz1X3ygMi9WtUAaCb8Q6jWAMvAHfAByRZqMFEtJG', 6);
    console.log('encodedCallWeight: ', encodedCallWeight);
    console.log('overallWeight: ', overallWeight);
    const executionFee = await mangataAdapter.weightToFee(overallWeight, assets.tur.location);
    console.log('executionFee: ', executionFee.toString());
  }, DEFAULT_TIMEOUT_PER_TEST);

  test('test-mangata-xcmp-task', async () => {
    if (_.isUndefined(mangataApi) || _.isUndefined(mangataAdapter) || _.isUndefined(turingAdapter) || _.isUndefined(keyringPair)) throw new Error("Not initialized yet");
    // Make task payload extrinsic
    const taskPayloadExtrinsic = mangataApi.tx.system.remarkWithEvent('hello!');

    // Schedule task with sdk
    const executionTimes = [getHourlyTimestamp(1)/1000];
    await Sdk().scheduleXcmpTaskWithPayThroughSoverignAccountFlow({
      oakAdapter: turingAdapter,
      destinationChainAdapter: mangataAdapter,
      taskPayloadExtrinsic,
      schedule: { Fixed: { executionTimes } },
      keyringPair,
    });
  }, DEFAULT_TIMEOUT_PER_TEST);

  test('test-oak-adapter-transfer', async () => {
    if (_.isUndefined(mangataApi) || _.isUndefined(mangataAdapter) || _.isUndefined(turingAdapter) || _.isUndefined(keyringPair)) throw new Error("Not initialized yet");
    const { defaultAsset: oakAsset } = turingAdapter.getChainData();
    if (_.isUndefined(oakAsset)) throw new Error("chainData.defaultAsset not set");
  
    // Transfer
    await turingAdapter.crossChainTransfer(
      mangataAdapter.getLocation(),
      u8aToHex(keyringPair.addressRaw),
      oakAsset.location,
      new BN('50000000000'),
      keyringPair,
    );
  }, DEFAULT_TIMEOUT_PER_TEST);
  
  test('test-mangat-adapter-transfer', async () => {
    if (_.isUndefined(mangataApi) || _.isUndefined(mangataAdapter) || _.isUndefined(turingAdapter) || _.isUndefined(keyringPair)) throw new Error("Not initialized yet");
    const { defaultAsset: oakAsset } = turingAdapter.getChainData();
    if (_.isUndefined(oakAsset)) throw new Error("chainData.defaultAsset not set");
  
    // Transfer
    await mangataAdapter.crossChainTransfer(
      turingAdapter.getLocation(),
      u8aToHex(keyringPair.addressRaw),
      oakAsset.location,
      new BN('100000000000000'),
      keyringPair,
    );
  }, DEFAULT_TIMEOUT_PER_TEST);

  afterAll(async () => {
    await turingApi?.disconnect();
    await mangataApi?.disconnect();
  });
});
