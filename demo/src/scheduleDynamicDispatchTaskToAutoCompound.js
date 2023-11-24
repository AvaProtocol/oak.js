import _ from "lodash";
import { ApiPromise, WsProvider } from "@polkadot/api";
import BN from "bn.js";
import "@oak-network/api-augment";
import { rpc, types } from "@oak-network/types";

import {
  sendExtrinsic,
  listenEvents,
  getTaskIdInTaskScheduledEvent,
  findEvent,
  getNextTenMinutesTimestamp,
  getKeyringPair,
} from "./utils";

const MIN_ACCOUNT_BALANCE = new BN(100);
const AUTO_COMPOUND_AMOUNT = new BN(10000000000);
const AUTO_COMPOUND_INTERVAL = 600;

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
  let foundDelegation;
  console.log("delegatorState: ", delegatorState.toHuman());
  console.log("delegatorWalletAddress: ", delegatorWalletAddress);
  if (delegatorState.isSome) {
    const { delegations } = delegatorState.unwrap();
    foundDelegation = _.find(delegations, ({ owner }) => {
      console.log("owner: ", owner.toHex());
      return owner.toHex() === collatorWalletAddress;
    });
  }

  if (_.isUndefined(foundDelegation)) {
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
      0,
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

  console.log("\n4. Scheduling a dynamic task to auto compound...");

  // Check if the task is already scheduled
  const entries = await api.query.automationTime.accountTasks.entries(
    delegatorWalletAddress,
  );

  const entry = _.find(entries, ([, value]) => {
    const task = value.unwrap();
    const { action } = task;
    if (!action.isDynamicDispatch) {
      return false;
    }
    const { encodedCall } = action.asDynamicDispatch;
    const extrinsicCall = api.createType("Call", encodedCall);
    const { method, section, args } = extrinsicCall;
    if (section !== "parachainStaking" || method !== "delegatorBondMore") {
      return false;
    }
    const [candidate] = args;
    return collatorWalletAddress === candidate.toHex();
  });

  if (!_.isUndefined(entry)) {
    console.log("The task is already scheduled.");
    return;
  }

  // Create bondMoreExtrinsic
  const bondMoreExtrinsic = api.tx.parachainStaking.delegatorBondMore(
    collatorWalletAddress,
    AUTO_COMPOUND_AMOUNT,
  );

  // Schedule dynamic task to auto compound
  const executionTime = getNextTenMinutesTimestamp() / 1000;
  const schedule = {
    Recurring: {
      frequency: AUTO_COMPOUND_INTERVAL,
      nextExecutionTime: executionTime,
    },
  };
  const extrinsic = api.tx.automationTime.scheduleDynamicDispatchTask(
    schedule,
    bondMoreExtrinsic,
  );

  const { extrinsicHash, events, blockHash } = await sendExtrinsic(
    extrinsic,
    api,
    keyringPair,
  );

  console.log(`extrinsicHash: ${extrinsicHash}, blockHash: ${blockHash},`);

  // Find the automationTime.TaskScheduled event and retrieve TaskId
  const event = findEvent(events, "automationTime", "TaskScheduled");
  const taskId = getTaskIdInTaskScheduledEvent(event);

  console.log(
    `Found the automationTime.TaskScheduled event and retrieved TaskId, ${taskId}`,
  );

  // Listen to the parachainStaking.DelegationIncreased event
  console.log(
    "\n5. Listening to the parachainStaking.DelegationIncreased event...",
  );
  const { foundEvent } = await listenEvents(
    api,
    "parachainStaking",
    "DelegationIncreased",
    undefined,
    AUTO_COMPOUND_INTERVAL * 1000,
  );

  console.log(
    "Found the parachainStaking.DelegationIncreased event. Auto compound is success.",
    foundEvent.toHuman(),
  );
}

main()
  .catch(console.error)
  .finally(() => process.exit());
