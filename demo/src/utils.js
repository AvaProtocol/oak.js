import _ from "lodash";
import { Keyring } from "@polkadot/api";
import { waitReady } from "@polkadot/wasm-crypto";

export function getNextTenMinutesTimestamp() {
  const currentTime = new Date();
  const currentMinutes = currentTime.getMinutes();
  const remainingMinutes = 10 - (currentMinutes % 10);

  const nextTenMinutes = new Date(
    currentTime.getTime() + remainingMinutes * 60000,
  );

  nextTenMinutes.setSeconds(0);
  nextTenMinutes.setMilliseconds(0);

  return nextTenMinutes.getTime();
}

export const getKeyringPair = async (ss58Format) => {
  await waitReady();
  if (_.isEmpty(process.env.SENDER_MNEMONIC)) {
    throw new Error("The SENDER_MNEMONIC environment variable is not set.");
  }
  // Generate sender keyring pair from mnemonic
  const keyring = new Keyring({ ss58Format, type: "sr25519" });
  const keyringPair = keyring.addFromMnemonic(process.env.SENDER_MNEMONIC);
  return keyringPair;
};

export const sendExtrinsic = (extrinsic, api, keyringPair) =>
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

          const event = _.find(events, ({ event: eventData }) =>
            api.events.system.ExtrinsicSuccess.is(eventData),
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

export const findEvent = (events, section, method) =>
  events.find((e) => e.event.section === section && e.event.method === method);

export const getTaskIdInTaskScheduledEvent = (event) =>
  Buffer.from(event.event.data.taskId).toString();

export const listenEvents = async (
  api,
  section,
  method,
  conditions,
  timeout = undefined,
) =>
  new Promise((resolve) => {
    let unsub = null;
    let timeoutId = null;

    if (timeout) {
      timeoutId = setTimeout(() => {
        unsub();
        resolve(null);
      }, timeout);
    }

    const listenSystemEvents = async () => {
      unsub = await api.query.system.events((events) => {
        const foundEventIndex = _.findIndex(events, ({ event }) => {
          const { section: eventSection, method: eventMethod, data } = event;
          if (eventSection !== section || eventMethod !== method) {
            return false;
          }

          if (!_.isUndefined(conditions)) {
            return true;
          }

          let conditionPassed = true;
          _.each(_.keys(conditions), (key) => {
            if (conditions[key] === data[key]) {
              conditionPassed = false;
            }
          });

          return conditionPassed;
        });

        if (foundEventIndex !== -1) {
          const foundEvent = events[foundEventIndex];
          const {
            event: {
              section: eventSection,
              method: eventMethod,
              typeDef,
              data: eventData,
            },
            phase,
          } = foundEvent;

          // Print out the name of the event found
          console.log(
            `\t${eventSection}:${eventMethod}:: (phase=${phase.toString()})`,
          );

          // Loop through the conent of the event, displaying the type and data
          eventData.forEach((data, index) => {
            console.log(`\t\t\t${typeDef[index].type}: ${data.toString()}`);
          });

          unsub();

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          resolve({
            events,
            foundEvent,
            foundEventIndex,
          });
        }
      });
    };

    listenSystemEvents().catch(console.log);
  });
