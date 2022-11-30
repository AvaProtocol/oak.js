
import _ from 'lodash';
import { WsProvider, ApiPromise, Keyring } from '@polkadot/api';
import type { HexString } from '@polkadot/util/types';
import type { Extrinsic } from '@polkadot/types/interfaces/extrinsics';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { BalanceOf } from '@polkadot/types/interfaces';
import { waitReady } from '@polkadot/wasm-crypto';
import { ISubmittableResult } from '@polkadot/types/types';
import BN from 'bn.js';

import { rpc, types, runtime } from '@oak-foundation/types'; 
import '@oak-foundation/api-augment'; 

import { AutomationTimeApi, Recurrer, oakConstants, config } from '../utils';
const { SS58_PREFIX } = oakConstants;

export const SECTION_NAME = 'automationTime';
export const MIN_RUNNING_TEST_BALANCE = 20000000000;
export const TRANSFER_AMOUNT = 1000000000;
export const RECEIVER_ADDRESS = '66fhJwYLiK87UDXYDQP9TfYdHpeEyMvQ3MK8Z6GgWAdyyCL3';
const RECURRING_FREQUENCY = 3600;

export const createPolkadotApi = async (endpoint: string) => {
  const wsProvider = new WsProvider(endpoint);
  const polkadotApi = await ApiPromise.create({ provider: wsProvider, rpc, types, runtime });
  return polkadotApi;
}

export const getPolkadotApi = async () => createPolkadotApi(config.endpoint);

 /**
  * getContext: Get test context
  * @returns context object: { scheduler, observer, keyringPair }
  */
export const getContext = async (polkadotApi: ApiPromise) => {
  return {
    automationTimeApi: new AutomationTimeApi(config, polkadotApi),
    keyringPair: await getKeyringPair(),
  };
} 

/**
 * generateProviderId: Generate a provider Id
 * @returns providerId
 */
 export const generateProviderId = () => `functional-test-${new Date().getTime()}-${_.random(0, Number.MAX_SAFE_INTEGER, false)}`;

 /**
  * sendExtrinsic: Send extrinsic to chain
  * @param scheduler 
  * @param extrinsicHex 
  * @returns promise
  */
 export const sendExtrinsic = async (polkadotApi: ApiPromise, extrinsicHex: HexString) : Promise<{extrinsicHash: string, blockHash: string}> => {
   return new Promise(async (resolve, reject) => {
     try {
       const txHash = await sendExtrinsicToChain(polkadotApi, extrinsicHex, ({ status, events, dispatchError }) => {
         if (status?.isFinalized) {
           if (!_.isNil(dispatchError)) {
             if (dispatchError.isModule) {
                 const metaError = polkadotApi.registry.findMetaError(dispatchError.asModule);
                 const { name, section } = metaError;
                 reject(new Error(`${section}.${name}`));
                 return;
             } else {
                 reject(new Error(dispatchError.toString()));
                 return;
             }
           }
 
           const event = _.find(events, ({ event }) => polkadotApi.events.system.ExtrinsicSuccess.is(event));
           if (event) {
             resolve({ extrinsicHash: txHash, blockHash: status?.asFinalized?.toString() });
           } else {
             reject(new Error('The event.ExtrinsicSuccess is not found'));
           }
         }
       });
     } catch (error) {
       reject(error);
     }
   });
 }
 
 export const hexToAscii = (hexStr: String, hasPrefix = false) => {
   const hex = hasPrefix ? hexStr : hexStr.substring(2);
   let str = '';
   for (let i = 0; i < hex.length; i += 2) {
     str += String.fromCharCode(parseInt(hex.substring(i, i+2), 16));
   }
   return str;
 }
 
 /**
  * checkBalance: Check test account balance
  * @param keyringPair 
  */
 export const checkBalance = async (polkadotApi: ApiPromise, keyringPair: KeyringPair) => {
   const { data: balanceRaw } = await polkadotApi.query.system.account(keyringPair.address) as any;
   expect((<BalanceOf>balanceRaw.free).gte(new BN(MIN_RUNNING_TEST_BALANCE))).toEqual(true);
 };

/**
 * getKeyringPair: Get keyring pair for testing
 * @returns keyring pair
 */
export const getKeyringPair = async () => {
  await waitReady();
  if (config.env !== 'Turing Dev' && _.isEmpty(process.env.MNEMONIC)) {
    throw new Error('The MNEMONIC environment variable is not set.')
  }
  // Generate sender keyring pair from mnemonic
  const keyring = new Keyring({ type: 'sr25519', ss58Format: SS58_PREFIX });
  const keyringPair = config.env === 'Turing Dev' && _.isEmpty(process.env.MNEMONIC) ? keyring.addFromUri('//Alice') : keyring.addFromMnemonic(process.env.MNEMONIC);
  return keyringPair;
}

 /**
  * findExtrinsicFromChain: Find extrinsic from chain
  * @param polkadotApi 
  * @param blockHash 
  * @param extrinsicHash 
  * @returns extrinsic
  */
 export const findExtrinsicFromChain = async (polkadotApi: ApiPromise, blockHash: string, extrinsicHash: string) : Promise<Extrinsic> => {
  const signedBlock = await polkadotApi.rpc.chain.getBlock(blockHash);
  const { block: { extrinsics } } = signedBlock;
  const extrinsic = _.find(extrinsics, (extrinsic) => extrinsic.hash.toHex() === extrinsicHash);
  return extrinsic;
}
 
 /**
  * cancelTaskAndVerify: Cancel task and verify on chain
  * @param scheduler
  * @param observer
  * @param keyringPair
  * @param extrinsicParams
  * @returns taskID
  */
export const cancelTaskAndVerify = async (automationTimeApi: AutomationTimeApi, keyringPair: KeyringPair, taskID: string, executionTimestamp: number) => {
  const cancelExtrinsicHex = await automationTimeApi.buildCancelTaskExtrinsic(keyringPair, taskID);
  const { extrinsicHash, blockHash } = await sendExtrinsic(automationTimeApi.polkadotApi, cancelExtrinsicHex);

  // Fetch extrinsic from chain
  const extrinsic = await findExtrinsicFromChain(automationTimeApi.polkadotApi, blockHash, extrinsicHash);

  //  Verify arguments
  const { section, method, args } = extrinsic.method;
  const [taskIdOnChain] = args;

  expect(section).toEqual(SECTION_NAME);
  expect(method).toEqual('cancelTask');
  expect(taskIdOnChain.toString()).toEqual(taskID);

  // Make sure the task has been canceled.
  const tasks = await automationTimeApi.getAutomationTimeScheduledTasks(executionTimestamp);
  expect(_.find(tasks, (task) => !_.isNil(_.find(task, ([_account, scheduledTaskId]) => scheduledTaskId === taskID)))).toBeUndefined();
}
 
 /**
  * scheduleDynamicDispatchTaskAndVerify: Schedule dynamic dispath task and verify extrinsic parameters on chain
  * @param scheduler
  * @param observer
  * @param keyringPair
  * @param extrinsicParams
  * @returns taskID
  */
 export const scheduleDynamicDispatchTaskAndVerify = async (automationTimeApi: AutomationTimeApi, keyringPair: KeyringPair, extrinsicParams: any) => {
   // Send extrinsic and get extrinsicHash, blockHash.
   const { providedID, schedule, call } = extrinsicParams;
   await checkBalance(automationTimeApi.polkadotApi, keyringPair);
   const hexString = await automationTimeApi.buildScheduleDynamicDispatchTask(keyringPair, providedID, schedule, call);
   const { extrinsicHash, blockHash } = await sendExtrinsic(automationTimeApi.polkadotApi, hexString);
 
   // Fetch extrinsic from chain
   const extrinsic = await findExtrinsicFromChain(automationTimeApi.polkadotApi, blockHash, extrinsicHash);
 
   //  Verify arguments
   const { section, method, args } = extrinsic.method;
   const [providedIdOnChainHex, scheduleOnChain, callOnChain] = args;
   const scheduleObject =  scheduleOnChain.toJSON()
 
   expect(section).toEqual(SECTION_NAME);
   expect(method).toEqual('scheduleDynamicDispatchTask');
   const providedIdOnChain = hexToAscii(providedIdOnChainHex.toString());
   expect(providedIdOnChain).toEqual(providedID);
   expect(callOnChain).toBeInstanceOf(Object);
 
   const { recurring, fixed } = scheduleObject;
   let firstExecutionTime = -1;
   if (recurring) {
     const { nextExecutionTime, frequency } = recurring;
     expect(frequency).toEqual(RECURRING_FREQUENCY);
     firstExecutionTime = nextExecutionTime;
   } else {
     const { executionTimes } = fixed;
     firstExecutionTime = executionTimes[0];
   }
 
   // Make use the task has been scheduled
   const taskID = (await automationTimeApi.getTaskID(keyringPair.address, providedID)).toString();
   const tasks = await automationTimeApi.getAutomationTimeScheduledTasks(firstExecutionTime);
   expect(_.find(tasks, (task) => !_.isNil(_.find(task, ([_account, scheduledTaskId]) => scheduledTaskId === taskID)))).toBeUndefined();
 
   return taskID;
 }
 
 /**
  * getDynamicDispatchExtrinsicParams: Get parameters of recurring dynamic dispatch extrinsic for testing
  * @param scheduleType
  * @returns parameter object: { providedID, schedule, call }
  */
 export const getDynamicDispatchExtrinsicParams = async (polkadotApi: ApiPromise, scheduleType: string) => {
   let schedule = {};
   if (scheduleType === 'recurring') {
     const [nextExecutionTime] = _.map(new Recurrer().getHourlyRecurringTimestamps(Date.now(), 1), (time: number) => (time / 1000));
     schedule =  {
       recurring: {
         nextExecutionTime,
         frequency: RECURRING_FREQUENCY,
       }
     };
   } else {
     const executionTimes = _.map(new Recurrer().getDailyRecurringTimestamps(Date.now(), 3, 7), (time: number) => (time / 1000));
     schedule =  { fixed: { executionTimes } };
   }
 
   return {
     providedID: generateProviderId(),
     schedule,
     call: polkadotApi.tx['balances']['transfer'](RECEIVER_ADDRESS, TRANSFER_AMOUNT),
   }
 }

 /**
 * Default error handler for websockets updates for extrinsic
 * @param result
 * @returns null
 */
const defaultErrorHandler = async (polkadotApi: ApiPromise, result: ISubmittableResult): Promise<void> => {
  console.log(`Tx status: ${result.status.type}`)
  if (result.status.isFinalized) {
    if (!_.isNil(result.dispatchError)) {
      if (result.dispatchError.isModule) {
        const metaError = polkadotApi.registry.findMetaError(result.dispatchError.asModule)
        const { docs, name, section } = metaError
        const dispatchErrorMessage = JSON.stringify({ docs, name, section })
        const errMsg = `Transaction finalized with error by blockchain ${dispatchErrorMessage}`
        console.log(errMsg)
      } else {
        const errMsg = `Transaction finalized with error by blockchain ${result.dispatchError.toString()}`
        console.log(errMsg)
      }
    }
  }
}

 /**
 * SendExtrinsic: sends built and signed extrinsic to the chain.
 * Accepts pre-built extrinsic hex string. You may provide your own error handler.
 * If none provided, a default error handler is provided, seen below.
 * A transaction hash should be returned as a result of the extrinsic.
 * @param extrinsic
 * @param handleDispatch
 * @returns transaction hash
 */
const sendExtrinsicToChain = async (
  polkadotApi: ApiPromise,
  extrinsicHex: HexString,
  /* eslint-disable  @typescript-eslint/no-explicit-any */
  handleDispatch: (result: ISubmittableResult) => any
): Promise<string> => {
  const txObject = polkadotApi.tx(extrinsicHex)
  const unsub = await txObject.send(async (result) => {
    const { status } = result
    if (_.isNil(handleDispatch)) {
      await defaultErrorHandler(polkadotApi, result)
    } else {
      await handleDispatch(result)
    }
    if (status.isFinalized) {
      unsub()
    }
  })
  return txObject.hash.toString()
}
 