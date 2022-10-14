require('@oak-foundation/api-augment');
const { rpc, types } = require('@oak-foundation/types');
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { waitReady } = require('@polkadot/wasm-crypto');
const _ = require('lodash');

const SS58_PREFIX = 51;
const TRANSFER_AMOUNT = 1000000000;
const RECEIVER_ADDRESS = '66fhJwYLiK87UDXYDQP9TfYdHpeEyMvQ3MK8Z6GgWAdyyCL3';

const getHourlyRecurringTimestamps = (startTimestamp, numberRecurring) => {
  const secondsInHour = 60 * 60 * 1000;
  const firstEventTimestamp = startTimestamp - (startTimestamp % secondsInHour) + secondsInHour;
  return _.times(numberRecurring, (index) => {
      return firstEventTimestamp + index * secondsInHour;
  });
}

const getKeyringPair = async () => {
  await waitReady();
  if (_.isEmpty(process.env.SENDER_MNEMONIC)) {
    throw new Error('The SENDER_MNEMONIC environment variable is not set.')
  }
  // Generate sender keyring pair from mnemonic
  const keyring = new Keyring({ type: 'sr25519', ss58Format: SS58_PREFIX });
  const keyringPair = keyring.addFromMnemonic(process.env.SENDER_MNEMONIC);
  return keyringPair;
}

const sendExtrinsic = (extrinsic, api, keyringPair) => {
  return new Promise(async (resolve) => {
    const unsub = await extrinsic.signAndSend(keyringPair, (result)=> {
      const { status, events, dispatchError } = result;
      console.log('status.type: ', status.type);

      if (status?.isFinalized) {
        unsub();
        if (!_.isNil(dispatchError)) {
          reject(dispatchError);
        }

        const event = _.find(events, ({ event }) => api.events.system.ExtrinsicSuccess.is(event));
        if (event) {
          resolve({ extrinsicHash: extrinsic.hash, blockHash: status?.asFinalized?.toString() });
        } else {
          reject(new Error('The event.ExtrinsicSuccess is not found'));
        }
      }
    });
  });
}

async function main() {
  const providerUrl = process.env.PROVIDER_URL || 'wss://rpc.turing-staging.oak.tech';

  const provider = new WsProvider(providerUrl);
  const api = await ApiPromise.create({ provider, types, rpc });
  const keyringPair = await getKeyringPair();

	// Prepare extrinsic parameters
	const providedId = `demo-${new Date().getTime()}-${_.random(0, Number.MAX_SAFE_INTEGER, false)}`;
  const executionTimes = _.map(getHourlyRecurringTimestamps(new Date().valueOf(), 5), (time) => time / 1000);
  const schedule = { fixed: { executionTimes }};
  const call = api.tx.balances.transfer(RECEIVER_ADDRESS, TRANSFER_AMOUNT);

  // Create dynamic dispatch task and send
  const extrinsic = api.tx.automationTime.scheduleDynamicDispatchTask(providedId, schedule, call);
  const { extrinsicHash, blockHash } = await sendExtrinsic(extrinsic, api, keyringPair);
  console.log(`Send extrinsic success, extrinsicHash: ${extrinsicHash}, blockHash: ${blockHash}`);

  // Get task ID
  const taskIdCodec = await api.rpc.automationTime.generateTaskId(keyringPair.address, providedId)
  console.log('taskId: ', taskIdCodec.toString());
}

main().catch(console.error).finally(() => process.exit()); 