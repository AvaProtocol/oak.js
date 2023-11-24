/**
 * This script is used to set auto compound with reward.
 * To accumulate the reward, you need to configure these parameters:
 * 1. blocks_per_round and inflation_config
 * https://github.com/OAK-Foundation/OAK-blockchain/blob/4b36c45eaf6f0f2e1ef298b4c05bd6c313c6cf33/node/src/chain_spec/turing.rs#L265-L266
 * 600 -> 2
 * 2. MinBlocksPerRound
 * https://github.com/OAK-Foundation/OAK-blockchain/blob/4b36c45eaf6f0f2e1ef298b4c05bd6c313c6cf33/runtime/turing/src/lib.rs#L714
 * 10 -> 2
 * 3. RewardPaymentDelay
 * https://github.com/OAK-Foundation/OAK-blockchain/blob/4b36c45eaf6f0f2e1ef298b4c05bd6c313c6cf33/runtime/turing/src/lib.rs#L726
 * 2 -> 1
 */
import _ from "lodash";
import BN from "bn.js";
import "@oak-network/api-augment";
import { rpc, types } from "@oak-network/types";
import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  findEvent,
  getKeyringPair,
  listenEvents,
  sendExtrinsic,
  getDelegatorState,
  getCandidateDelegationCount,
  getAutocompoundDelegationsLength,
} from "./utils";

const MIN_ACCOUNT_BALANCE = new BN(100);

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
  const delegatorState = await getDelegatorState(api, delegatorWalletAddress);
  let foundDelegation = null;
  if (!_.isUndefined(delegatorState)) {
    const { delegations } = delegatorState;
    foundDelegation = _.find(
      delegations,
      ({ owner }) => owner.toHex() === collatorWalletAddress,
    );
  }

  if (!foundDelegation) {
    // Get Delegation params
    const minDelegationStake = api.consts.parachainStaking.minDelegation;
    const candidateDelegationCount = await getCandidateDelegationCount(
      api,
      collatorWalletAddress,
    );
    const delegationsLength = delegatorState.delegations.length;
    const autoCompoundingDelegationsLength = getAutocompoundDelegationsLength(
      api,
      collatorWalletAddress,
    );

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
      50,
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

    console.log("Listening to the event: parachainStaking.Compounded...");
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
  } else {
    console.log(
      `Delegation already exists(${JSON.stringify(
        foundDelegation.toJSON(),
      )}). Skip delegation.`,
    );
  }

  // Set auto compound
  console.log("\n4. Setting auto compound...");
  const autoCompoundingDelegationsLength =
    await getAutocompoundDelegationsLength(api, collatorWalletAddress);
  const { delegations } = await getDelegatorState(api, delegatorWalletAddress);
  const setAutoCompoundExtrinsic = api.tx.parachainStaking.setAutoCompound(
    collatorWalletAddress,
    90,
    autoCompoundingDelegationsLength + 1,
    delegations.length + 1,
  );

  const {
    events,
    extrinsicHash: setCompoundExtrinsicHash,
    blockHash: setCompoundBlockHash,
  } = await sendExtrinsic(setAutoCompoundExtrinsic, api, keyringPair);

  console.log(
    `setAutoCompound, extrinsicHash: ${setCompoundExtrinsicHash}, blockHash: ${setCompoundBlockHash}`,
  );
  const event = findEvent(events, "parachainStaking", "AutoCompoundSet");
  console.log(
    "Found the parachainStaking.AutoCompoundSet event.",
    event.toHuman(),
  );

  // Bond more
  console.log("\n5. Bond more...");
  const bondMoreExtrinsic = api.tx.parachainStaking.delegatorBondMore(
    collatorWalletAddress,
    "10000000000",
  );

  const {
    events: bondMoreExtrinsicEvents,
    extrinsicHash: bondMoreExtrinsicHash,
    blockHash: bondMoreBlockHash,
  } = await sendExtrinsic(bondMoreExtrinsic, api, keyringPair);

  console.log(
    `bondMore, extrinsicHash: ${bondMoreExtrinsicHash}, blockHash: ${bondMoreBlockHash}`,
  );

  console.log("Listening to the parachainStaking.DelegationIncreased event...");
  const delegationIncreasedEvent = findEvent(
    bondMoreExtrinsicEvents,
    "parachainStaking",
    "DelegationIncreased",
  );

  console.log(
    "Found the parachainStaking.DelegationIncreased event.",
    delegationIncreasedEvent.toHuman(),
  );
}

main()
  .catch(console.error)
  .finally(() => process.exit());
