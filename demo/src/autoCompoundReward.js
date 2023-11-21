const {
  find,
  isNil,
  isEmpty,
  keys,
  each,
  isUndefined,
  findIndex,
} = require("lodash");
const BN = require("bn.js");
require("@oak-network/api-augment");
const { rpc, types } = require("@oak-network/types");
const { ApiPromise, WsProvider, Keyring } = require("@polkadot/api");
const { waitReady } = require("@polkadot/wasm-crypto");

const MIN_ACCOUNT_BALANCE = new BN(100);

const getKeyringPair = async (ss58Format) => {
  await waitReady();
  if (isEmpty(process.env.SENDER_MNEMONIC)) {
    throw new Error("The SENDER_MNEMONIC environment variable is not set.");
  }
  // Generate sender keyring pair from mnemonic
  const keyring = new Keyring({ ss58Format, type: "sr25519" });
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

const listenEvents = async (
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
        const foundEventIndex = findIndex(events, ({ event }) => {
          const { section: eventSection, method: eventMethod, data } = event;
          if (eventSection !== section || eventMethod !== method) {
            return false;
          }

          if (!isUndefined(conditions)) {
            return true;
          }

          let conditionPassed = true;
          each(keys(conditions), (key) => {
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

async function main() {
  const providerUrl =
    process.env.PROVIDER_URL || "wss://rpc.turing-staging.oak.tech";

  const provider = new WsProvider(providerUrl);
  const api = await ApiPromise.create({ provider, rpc, types });

  // Get system properties
  console.log("\n1. Getting system properties...");
  const systemProperties = await api.rpc.system.properties();
  const tokenDecimals = systemProperties.tokenDecimals.unwrap()[0];
  const tokenDecimalsNumber = new BN(10).pow(new BN(tokenDecimals.toNumber()));
  const tokenSymbol = systemProperties.tokenSymbol.unwrap()[0].toString();
  const ss58Format = systemProperties.ss58Format.unwrap().toNumber();

  const keyringPair = await getKeyringPair(ss58Format);

  // Read account free balance
  console.log("\n2. Checking account free balance...");
  const balance = await api.query.system.account(keyringPair.address);
  const freeBalance = balance.data.free.sub(balance.data.frozen);
  console.log(
    `The account free balance: ${freeBalance.div(
      tokenDecimalsNumber,
    )} ${tokenSymbol}`,
  );
  if (freeBalance.lt(MIN_ACCOUNT_BALANCE.mul(tokenDecimalsNumber))) {
    throw new Error(
      `The account balance is insufficient. MIN_ACCOUNT_BALANCE: ${MIN_ACCOUNT_BALANCE} ${tokenSymbol}. Please top up!`,
    );
  }

  console.log("\n3. Delegating to collator...");
  // Get collator address
  const pools = await api.query.parachainStaking.candidatePool();
  const collatorWalletAddress = pools[0].owner.toHex();

  // Check if delegation exists
  const delegatorWalletAddress = keyringPair.address;
  const delegatorState = await api.query.parachainStaking.delegatorState(
    delegatorWalletAddress,
  );
  let foundDelegation = null;
  console.log("delegatorState: ", delegatorState.toHuman());
  console.log("delegatorWalletAddress: ", delegatorWalletAddress);
  if (delegatorState.isSome) {
    const { delegations } = delegatorState.unwrap();
    foundDelegation = find(delegations, ({ owner }) => {
      console.log("owner: ", owner.toHex());
      return owner.toHex() === collatorWalletAddress;
    });
  }

  if (!foundDelegation) {
    // Get Delegation params
    const minDelegationStake = api.consts.parachainStaking.minDelegation;
    const candidateInfo = await api.query.parachainStaking.candidateInfo(
      collatorWalletAddress,
    );
    const candidateDelegationCount = JSON.parse(candidateInfo).delegationCount;
    const delegationsLength =
      delegatorState.toJSON() !== null && delegatorState.toJSON().delegations
        ? delegatorState.toJSON().delegations.length
        : 0;
    const autoCompoundingDelegations =
      await api.query.parachainStaking.autoCompoundingDelegations(
        delegatorWalletAddress,
      );
    const autoCompoundingDelegationsLength =
      autoCompoundingDelegations.toJSON() !== null &&
      autoCompoundingDelegations.toJSON().delegations
        ? autoCompoundingDelegations.toJSON().delegations.length
        : 0;

    console.log(`a. Minimum Amount to be staked: ${minDelegationStake}`);
    console.log(`b. Candidate Delegation Count: ${candidateDelegationCount}`);
    console.log(`c. Delegation Count: ${delegationsLength}`);
    console.log(
      `d. autocompound Delegation Count: ${autoCompoundingDelegationsLength}`,
    );

    // Delegate to collator
    const delegateExtrinsic = api.tx.parachainStaking.delegateWithAutoCompound(
      collatorWalletAddress,
      minDelegationStake,
      100,
      candidateDelegationCount,
      autoCompoundingDelegationsLength,
      delegationsLength,
    );

    const {
      extrinsicHash: delegateExtrinsicHash,
      blockHash: delegateBlockHash,
    } = await sendExtrinsic(delegateExtrinsic, api, keyringPair);

    console.log(
      `Delegate, extrinsicHash: ${delegateExtrinsicHash}, blockHash: ${delegateBlockHash}`,
    );
  } else {
    console.log(
      `Delegation already exists(${JSON.stringify(
        foundDelegation.toJSON(),
      )}). Skip delegation.`,
    );
  }

  console.log("\n4. Listening to the event: parachainStaking.Compounded...");
  const { foundEvent } = await listenEvents(
    api,
    "parachainStaking",
    "Compounded",
    undefined,
    undefined,
  );

  console.log(
    "Found the parachainStaking.Compounded event. Auto compound is success.",
    foundEvent.toHuman(),
  );
}

main()
  .catch(console.error)
  .finally(() => process.exit());
