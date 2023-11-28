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

export const sendExtrinsic = (api, extrinsic, keyPair) =>
	new Promise((resolve, reject) => {
		const signAndSend = async () => {
			try {
				const unsub = await extrinsic.signAndSend(keyPair, (result) => {
					const { status, events, dispatchError } = result;
					console.log("status.type: ", status.type);

					if (status?.isFinalized) {
						unsub();

						if (dispatchError) {
							if (dispatchError.isModule) {
								const metaError = api.registry.findMetaError(dispatchError.asModule);
								const { name, section } = metaError;
								return reject(new Error(`${section}.${name}`));
							}

							return reject(new Error(dispatchError.toString()));
						}

						const event = _.find(events, ({ event: eventData }) => api.events.system.ExtrinsicSuccess.is(eventData));
						if (event) {
							return resolve({
								blockHash: status?.asFinalized?.toString(),
								events,
								extrinsicHash: extrinsic?.hash?.toString(),
							});
						} else {
							return reject(new Error(events.toString()));
						}
					}
				});
			} catch (ex) {
				// Handle signing error such as user manually cancel the transaction
				return reject(ex);
			}
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

/**
 * Get the length of delegations in autoCompoundingDelegations storage
 * @param {*} api
 * @param {*} collatorWalletAddress
 * @returns
 */
export const getAutocompoundDelegationsLength = async (
  api,
  collatorWalletAddress,
) => {
  const autoCompoundingDelegations =
    await api.query.parachainStaking.autoCompoundingDelegations(
      collatorWalletAddress,
    );
  return autoCompoundingDelegations.length;
};

/**
 * Get the delegation count in delegatorDelegations storage
 * @param {*} api
 * @param {*} collatorWalletAddress
 * @returns
 */
export const getCandidateDelegationCount = async (
  api,
  collatorWalletAddress,
) => {
  const candidateInfo = await api.query.parachainStaking.candidateInfo(
    collatorWalletAddress,
  );
  if (candidateInfo.isNone) {
    throw new Error(`The candidate(${collatorWalletAddress}) does not exist.`);
  }
  return candidateInfo.unwrap().delegationCount.toNumber();
};

/**
 * Get the delegator state
 * @param {*} api
 * @param {*} delegatorWalletAddress
 * @returns
 */
export const getDelegatorState = async (api, delegatorWalletAddress) => {
  const delegatorState = await api.query.parachainStaking.delegatorState(
    delegatorWalletAddress,
  );
  if (delegatorState.isNone) {
    return undefined;
  }
  return delegatorState.unwrap();
};
