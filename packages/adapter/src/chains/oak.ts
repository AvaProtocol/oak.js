import _ from "lodash";
import BN from "bn.js";
import type { HexString } from "@polkadot/util/types";
import type { SubmittableExtrinsic, AddressOrPair } from "@polkadot/api/types";
import type { u32, u128, Option } from "@polkadot/types";
import type { WeightV2 } from "@polkadot/types/interfaces";
import type { KeyringPair } from "@polkadot/keyring/types";
import { Weight } from "@oak-network/config";
import { ChainAdapter } from "./chainAdapter";
import { getDerivativeAccountV2, sendExtrinsic } from "../util";
import { SendExtrinsicResult } from "../types";
import { WEIGHT_REF_TIME_PER_SECOND } from "../constants";

const TRANSACT_XCM_INSTRUCTION_COUNT = 4;

// OakAdapter implements ChainAdapter
export class OakAdapter extends ChainAdapter {
  /**
   * Initialize adapter
   */
  async initialize() {
    await this.fetchAndUpdateConfigs();
  }

  /**
   * Get extrinsic weight for transact an extrinsic call through XCM message
   * @param extrinsic
   * @param account
   * @returns Extrinsic weight
   */
  // eslint-disable-next-line class-methods-use-this
  async getExtrinsicWeight(
    extrinsic: SubmittableExtrinsic<"promise">,
    account: AddressOrPair,
  ): Promise<Weight> {
    const { refTime, proofSize } = (await extrinsic.paymentInfo(account))
      .weight as unknown as WeightV2;
    return new Weight(new BN(refTime.unwrap()), new BN(proofSize.unwrap()));
  }

  /**
   * Calculate XCM overall weight for transact an extrinsic call through XCM message
   * @param transactCallWeight
   * @param instructionCount The number of XCM instructions
   * @returns XCM overall weight
   */
  async calculateXcmOverallWeight(
    transactCallWeight: Weight,
    instructionCount: number,
  ): Promise<Weight> {
    const { xcm } = this.chainData;
    if (_.isUndefined(xcm)) throw new Error("chainData.xcm not set");
    const overallWeight = transactCallWeight.add(
      xcm.instructionWeight.muln(instructionCount),
    );
    return overallWeight;
  }

  /**
   * Calculate XCM execution fee based on weight
   * @param weight
   * @param assetLocation
   * @returns XCM execution fee
   */
  async weightToFee(weight: Weight, assetLocation: any): Promise<BN> {
    const { defaultAsset } = this.chainData;
    if (_.isUndefined(defaultAsset))
      throw new Error("chainData.defaultAsset not set");

    const api = this.getApi();
    const location = _.isEqual(assetLocation, defaultAsset.location)
      ? { interior: "Here", parents: 0 }
      : assetLocation;
    const storageValue =
      await api.query.assetRegistry.locationToAssetId(location);
    const item = storageValue as unknown as Option<u32>;
    if (item.isNone) throw new Error("AssetId not set");

    const assetId = item.unwrap();
    const metadataStorageValue =
      await api.query.assetRegistry.metadata(assetId);
    const metadataItem = metadataStorageValue as unknown as Option<any>;
    if (metadataItem.isNone) throw new Error("Metadata not set");

    const { additional } = metadataItem.unwrap();
    const feePerSecond = additional.feePerSecond as unknown as Option<u128>;
    if (feePerSecond.isNone) throw new Error("feePerSecond is null");

    return weight.refTime
      .mul(feePerSecond.unwrap())
      .div(WEIGHT_REF_TIME_PER_SECOND);
  }

  /**
   * Execute a cross-chain transfer
   * @param destination The location of the destination chain
   * @param recipient recipient account
   * @param assetLocation Asset location
   * @param assetAmount Asset amount
   * @param keyringPair Operator's keyring pair
   * @returns SendExtrinsicResult
   */
  async crossChainTransfer(
    destination: any,
    recipient: HexString,
    assetLocation: any,
    assetAmount: BN,
    keyringPair: KeyringPair,
  ): Promise<SendExtrinsicResult> {
    const { key } = this.chainData;
    if (_.isUndefined(key)) throw new Error("chainData.key not set");
    const api = this.getApi();

    const extrinsic = api.tx.xTokens.transferMultiasset(
      {
        V3: {
          fun: { Fungible: assetAmount },
          id: { Concrete: assetLocation },
        },
      },
      {
        V3: {
          interior: {
            X2: [
              destination.interior.X1,
              { AccountId32: { id: recipient, network: null } },
            ],
          },
          parents: 1,
        },
      },
      "Unlimited",
    );

    console.log(`Transfer from ${key}, extrinsic:`, extrinsic.method.toHex());
    const result = await sendExtrinsic(api, extrinsic, keyringPair);
    return result;
  }

  /**
   * Get the instruction number of XCM instructions for transact
   */
  // eslint-disable-next-line class-methods-use-this
  getTransactXcmInstructionCount() {
    return TRANSACT_XCM_INSTRUCTION_COUNT;
  }

  /**
   * Schedule XCMP task
   * @param destination The location of the destination chain
   * @param schedule Schedule setting
   * @param scheduleFee Schedule fee
   * @param executionFee Execution fee
   * @param encodedCall Encoded call
   * @param encodedCallWeight The encoded call weight weight of the XCM instructions
   * @param overallWeight The overall weight of the XCM instructions
   * @param keyringPair Operator's keyring pair
   * @returns SendExtrinsicResult
   */
  async scheduleXcmpTask(
    destination: any,
    schedule: any,
    scheduleFee: any,
    executionFee: any,
    encodedCall: HexString,
    encodedCallWeight: Weight,
    overallWeight: Weight,
    keyringPair: KeyringPair,
  ): Promise<SendExtrinsicResult> {
    const api = this.getApi();
    const { key } = this.chainData;
    if (_.isUndefined(key)) throw new Error("chainData.key not set");

    const extrinsic = api.tx.automationTime.scheduleXcmpTask(
      schedule,
      destination,
      scheduleFee,
      executionFee,
      encodedCall,
      encodedCallWeight,
      overallWeight,
    );

    console.log(
      `Send extrinsic from ${key} to schedule task. extrinsic:`,
      extrinsic.method.toHex(),
    );
    const result = await sendExtrinsic(api, extrinsic, keyringPair);
    return result;
  }

  /**
   * Calculate the derivative account ID of a certain account ID
   * @param accountId
   * @param paraId The paraId of the XCM message sender
   * @param options Optional operation options: { locationType, network }
   * @returns Derivative account
   */
  getDerivativeAccount(
    accountId: HexString,
    paraId: number,
    options?: any,
  ): HexString {
    const api = this.getApi();
    return getDerivativeAccountV2(api, accountId, paraId, options);
  }

  async delegate(
    collator: HexString,
    amount: BN,
    keyringPair: KeyringPair,
  ): Promise<SendExtrinsicResult> {
    const api = this.getApi();
    // Check if delegation exists
    const delegatorWalletAddress = keyringPair.address;
    const delegatorStateCodec = await api.query.parachainStaking.delegatorState(
      delegatorWalletAddress,
    );
    const delegatorState = delegatorStateCodec as unknown as Option<any>;
    let foundDelegation;
    if (delegatorState.isSome) {
      const { delegations } = delegatorState.unwrap();
      foundDelegation = _.find(
        delegations,
        ({ owner }) => owner.toHex() === collator,
      );
    }
    if (foundDelegation) {
      throw new Error("Delegation already exists");
    }
    const delegationsLength = delegatorState.unwrap().delegations.length;

    const { minDelegationCodec } = api.consts.parachainStaking;
    const minDelegation = minDelegationCodec as u128;
    if (amount.lt(minDelegation)) {
      throw new Error(
        `Amount must be greater than or equal to ${minDelegation}`,
      );
    }

    const candidateInfoCodec =
      await api.query.parachainStaking.candidateInfo(collator);
    const candidateInfo = candidateInfoCodec as unknown as Option<any>;
    if (candidateInfo.isSome) {
      throw new Error("Candidate info not found");
    }
    const { delegationCount: candidateDelegationCount } =
      candidateInfo.unwrap();

    const autoCompoundingDelegationsCodec =
      await api.query.parachainStaking.autoCompoundingDelegations(
        delegatorWalletAddress,
      );
    const autoCompoundingDelegations =
      autoCompoundingDelegationsCodec as unknown as Option<any>;

    let autoCompoundingDelegationsLength = 0;
    if (autoCompoundingDelegations.isSome) {
      const { delegations } = autoCompoundingDelegations.unwrap();
      autoCompoundingDelegationsLength = delegations.length;
    }

    // Delegate to collator
    const delegateExtrinsic = api.tx.parachainStaking.delegateWithAutoCompound(
      collator,
      amount,
      0,
      candidateDelegationCount,
      autoCompoundingDelegationsLength,
      delegationsLength,
    );

    const result = await sendExtrinsic(api, delegateExtrinsic, keyringPair);
    return result;
  }

  async bondMoreAutoCompound(
    collator: HexString,
    amount: BN,
    startTimestamp: number,
    frequency: number,
    keyringPair: KeyringPair,
  ): Promise<SendExtrinsicResult> {
    const api = this.getApi();
    // Check if the task is already scheduled
    const entries =
      await api.query.automationTime.accountTasks.entries(collator);

    const entry = _.find(entries, ([, valueCodec]) => {
      const value = valueCodec as unknown as Option<any>;
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
      return collator === candidate.toHex();
    });

    if (!_.isUndefined(entry)) {
      throw new Error("The task is already scheduled.");
    }

    // Create bondMoreExtrinsic
    const bondMoreExtrinsic = api.tx.parachainStaking.delegatorBondMore(
      collator,
      amount,
    );

    // Schedule dynamic task to auto compound
    const schedule = {
      Recurring: {
        frequency,
        nextExecutionTime: startTimestamp,
      },
    };
    const extrinsic = api.tx.automationTime.scheduleDynamicDispatchTask(
      schedule,
      bondMoreExtrinsic,
    );

    const result = await sendExtrinsic(api, extrinsic, keyringPair);
    return result;
  }
}
