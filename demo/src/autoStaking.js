const { times, map, find, isNil, isEmpty } = require("lodash");
require("@oak-network/api-augment");
const { rpc, types } = require("@oak-network/types");
const { ApiPromise, WsProvider, Keyring } = require("@polkadot/api");
const { waitReady } = require("@polkadot/wasm-crypto");

const SS58_PREFIX = 51;

const getHourlyRecurringTimestamps = (startTimestamp, numberRecurring) => {
  const secondsInHour = 60 * 60 * 1000;
  const firstEventTimestamp =
    startTimestamp - (startTimestamp % secondsInHour) + secondsInHour;
  return times(
    numberRecurring,
    (index) => firstEventTimestamp + index * secondsInHour,
  );
};

const getKeyringPair = async () => {
  await waitReady();
  if (isEmpty(process.env.SENDER_MNEMONIC)) {
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
          if (!isNil(dispatchError)) {
            reject(dispatchError);
          }

          const event = find(events, ({ event: eventData }) =>
            api.events.system.ExtrinsicSuccess.is(eventData),
          );
          if (event) {
            resolve({
              blockHash: status?.asFinalized?.toString(),
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

  const pools = await api.query.parachainStaking.candidatePool();
  const collator = pools[0].owner.toHex();

  const executionTimes = map(
    getHourlyRecurringTimestamps(new Date().valueOf(), 1),
    (time) => time / 1000,
  );

  const extrinsic =
    api.tx.automationTime.scheduleAutoCompoundDelegatedStakeTask(
      executionTimes[0],
      3600,
      collator,
      "1000000000000000000",
    );

  const { extrinsicHash, blockHash } = await sendExtrinsic(
    extrinsic,
    api,
    keyringPair,
  );

  console.log(`extrinsicHash: ${extrinsicHash}, blockHash: ${blockHash}`);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
