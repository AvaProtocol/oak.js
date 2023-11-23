import _ from "lodash";
import BN from "bn.js";
import "@oak-network/api-augment";
import { rpc, types } from "@oak-network/types";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { getKeyringPair, listenEvents, sendExtrinsic } from "./utils";

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
  const delegatorState = await api.query.parachainStaking.delegatorState(
    delegatorWalletAddress,
  );
  let foundDelegation = null;
  console.log("delegatorState: ", delegatorState.toHuman());
  console.log("delegatorWalletAddress: ", delegatorWalletAddress);
  if (delegatorState.isSome) {
    const { delegations } = delegatorState.unwrap();
    foundDelegation = _.find(delegations, ({ owner }) => {
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
  } else {
    console.log(
      `Delegation already exists(${JSON.stringify(
        foundDelegation.toJSON(),
      )}). Skip delegation.`,
    );
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
