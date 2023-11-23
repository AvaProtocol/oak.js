import _ from "lodash";
import "@oak-network/api-augment";
import { rpc, types } from "@oak-network/types";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { waitReady } from "@polkadot/wasm-crypto";
import { findEvent, getTaskIdInTaskScheduledEvent } from "./utils";

const SS58_PREFIX = 51;
const TRANSFER_AMOUNT = 1000000000;
const RECEIVER_ADDRESS = "66fhJwYLiK87UDXYDQP9TfYdHpeEyMvQ3MK8Z6GgWAdyyCL3";

const getHourlyRecurringTimestamps = (startTimestamp, numberRecurring) => {
  const secondsInHour = 60 * 60 * 1000;
  const firstEventTimestamp =
    startTimestamp - (startTimestamp % secondsInHour) + secondsInHour;
  return _.times(
    numberRecurring,
    (index) => firstEventTimestamp + index * secondsInHour,
  );
};

const getKeyringPair = async () => {
  await waitReady();
  if (_.isEmpty(process.env.SENDER_MNEMONIC)) {
    throw new Error("The SENDER_MNEMONIC environment variable is not set.");
  }
  // Generate sender keyring pair from mnemonic
  const keyring = new Keyring({ ss58Format: SS58_PREFIX, type: "sr25519" });
  const keyringPair = keyring.addFromMnemonic(process.env.SENDER_MNEMONIC);
  return keyringPair;
};

const sendExtrinsic = (extrinsic, api, keyringPair) =>
  new Promise((resolve, reject) => {
    const signAndSend = async () => {
      const unsub = await extrinsic.signAndSend(keyringPair, (result) => {
        const { status, events, dispatchError } = result;
        console.log("status.type: ", status.type);

        if (status?.isFinalized) {
          unsub();
          if (!_.isNil(dispatchError)) {
            reject(dispatchError);
          }

          const event = _.find(events, ({ event: eventItem }) =>
            api.events.system.ExtrinsicSuccess.is(eventItem),
          );
          if (event) {
            resolve({
              blockHash: status?.asFinalized?.toString(),
              events,
              extrinsicHash: extrinsic.hash,
            });
          } else {
            reject(new Error("The event.ExtrinsicSuccess is not found"));
          }
        }
      });
    };
    signAndSend();
  });

async function main() {
  const providerUrl =
    process.env.PROVIDER_URL || "wss://rpc.turing-staging.oak.tech";

  const provider = new WsProvider(providerUrl);
  const api = await ApiPromise.create({ provider, rpc, types });
  const keyringPair = await getKeyringPair();

  // Prepare extrinsic parameters
  const executionTimes = _.map(
    getHourlyRecurringTimestamps(new Date().valueOf(), 1),
    (time) => time / 1000,
  );
  const schedule = {
    recurring: { frequency: 3600, nextExecutionTime: executionTimes[0] },
  };
  const call = api.tx.balances.transfer(RECEIVER_ADDRESS, TRANSFER_AMOUNT);

  // Create dynamic dispatch task and send
  const extrinsic = api.tx.automationTime.scheduleDynamicDispatchTask(
    schedule,
    call,
  );
  const { extrinsicHash, events, blockHash } = await sendExtrinsic(
    extrinsic,
    api,
    keyringPair,
  );
  console.log(
    `Send extrinsic success, extrinsicHash: ${extrinsicHash}, blockHash: ${blockHash}`,
  );

  // Get task ID
  const event = findEvent(events, "automationTime", "TaskScheduled");
  const taskId = getTaskIdInTaskScheduledEvent(event);
  console.log("taskId: ", taskId);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
