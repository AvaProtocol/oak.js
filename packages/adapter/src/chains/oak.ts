import _ from "lodash";
import BN from "bn.js";
import { u8aToHex } from "@polkadot/util";
import type { HexString } from "@polkadot/util/types";
import type { SubmittableExtrinsic, AddressOrPair } from "@polkadot/api/types";
import type { u32, u128, Option } from "@polkadot/types";
import type { WeightV2 } from "@polkadot/types/interfaces";
import type { KeyringPair } from "@polkadot/keyring/types";
import { Weight, Chain, XToken } from "@oak-network/config";
import { ISubmittableResult } from "@polkadot/types/types";
import { ChainAdapter } from "./chainAdapter";
import { isValidAddress, sendExtrinsic, getDecimalBN, getDerivativeAccountV3, getAccountTypeFromAddress } from "../utils";
import { AccountType, SendExtrinsicResult } from "../types";
import { WEIGHT_REF_TIME_PER_SECOND } from "../constants";
import { InvalidAddress } from "../errors";

export interface AutomationPriceTriggerParams {
  chain: string;
  exchange: string;
  asset1: string;
  asset2: string;
  submittedAt: number;
  triggerFunction: "lt" | "gt";
  triggerParam: number[];
}

export enum OakAdapterTransactType {
  PayThroughRemoteDerivativeAccount,
  PayThroughSoverignAccount,
}

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
  async getExtrinsicWeight(extrinsic: SubmittableExtrinsic<"promise">, account: AddressOrPair): Promise<Weight> {
    const { refTime, proofSize } = (await extrinsic.paymentInfo(account)).weight as unknown as WeightV2;
    return new Weight(new BN(refTime.unwrap()), new BN(proofSize.unwrap()));
  }

  /**
   * Calculate XCM overall weight for transact an extrinsic call through XCM message
   * @param transactCallWeight
   * @param instructionCount The number of XCM instructions
   * @returns XCM overall weight
   */
  async calculateXcmOverallWeight(transactCallWeight: Weight, instructionCount: number): Promise<Weight> {
    const { xcm } = this.chainConfig;
    if (_.isUndefined(xcm)) throw new Error("chainConfig.xcm not set");
    const overallWeight = transactCallWeight.add(xcm.instructionWeight.muln(instructionCount));
    return overallWeight;
  }

  /**
   * Calculate XCM execution fee based on weight
   * @param weight
   * @param assetLocation
   * @returns XCM execution fee
   */
  async weightToFee(weight: Weight, assetLocation: any): Promise<BN> {
    const [defaultAsset] = this.chainConfig.assets;
    if (_.isUndefined(defaultAsset)) throw new Error("chainConfig.defaultAsset not set");

    const api = this.getApi();
    const location = _.isEqual(assetLocation, defaultAsset.location) ? { interior: "Here", parents: 0 } : assetLocation;
    const storageValue = await api.query.assetRegistry.locationToAssetId(location);
    const item = storageValue as unknown as Option<u32>;
    if (item.isNone) throw new Error("AssetId not set");

    const assetId = item.unwrap();
    const metadataStorageValue = await api.query.assetRegistry.metadata(assetId);
    const metadataItem = metadataStorageValue as unknown as Option<any>;
    if (metadataItem.isNone) throw new Error("Metadata not set");

    const { additional } = metadataItem.unwrap();
    const feePerSecond = additional.feePerSecond as unknown as Option<u128>;
    if (feePerSecond.isNone) throw new Error("feePerSecond is null");

    return weight.refTime.mul(feePerSecond.unwrap()).div(WEIGHT_REF_TIME_PER_SECOND);
  }

  /**
   *
   * @param destConfig
   * @param token The key of the Asset such as "tur", or "sdn"
   * @param recipient
   * @param amount
   * @returns
   */
  public transferMultiasset(
    destConfig: Chain,
    token: string,
    recipient: string,
    amount: string | number,
  ): SubmittableExtrinsic<"promise", ISubmittableResult> | SubmittableExtrinsic<"rxjs", ISubmittableResult> | undefined {
    const asset = _.find(this.chainConfig.assets, (item) => item.key === token);
    if (_.isUndefined(asset)) throw new Error(`Asset ${token} not found`);

    const amountBN = new BN(amount).mul(getDecimalBN(asset.decimals));

    const accountId = destConfig.isEthereum
      ? { [AccountType.AccountKey20]: { key: recipient, network: null } }
      : { [AccountType.AccountId32]: { id: recipient, network: null } };

    if (!isValidAddress(recipient, destConfig.isEthereum)) {
      throw new InvalidAddress(recipient);
    }

    // const weightLimit: XcmV3WeightLimit = { isUnlimited: true };

    return this.api?.tx.xTokens.transferMultiasset(
      {
        V3: {
          fun: { Fungible: amountBN },
          id: { Concrete: asset.location },
        },
      },
      {
        V3: {
          interior: {
            X2: [{ Parachain: destConfig.paraId }, accountId],
          },
          parents: 1,
        },
      },
      "Unlimited",
    );
  }

  public getAssetBySymbol(symbol: string): XToken | undefined {
    return _.find(this.chainConfig.assets, (asset) => asset.symbol === symbol);
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
    const { key } = this.chainConfig;
    if (_.isUndefined(key)) throw new Error("chainConfig.key not set");
    const api = this.getApi();

    const isAccountKey20Address = getAccountTypeFromAddress(recipient) === AccountType.AccountKey20;
    if (!isValidAddress(recipient, isAccountKey20Address)) {
      throw new InvalidAddress(recipient);
    }

    const accountId = isAccountKey20Address
      ? { [AccountType.AccountKey20]: { key: recipient, network: null } }
      : { [AccountType.AccountId32]: { id: recipient, network: null } };

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
            X2: [destination.interior.X1, accountId],
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
   * In the xcmp-handler, there are two processes for sending XCM instructions.
   * PayThroughRemoteDerivativeAccount requires 4 XCM instructions,
   * PayThroughSovereignAccount requires 6 instructions.
   * @param transactType
   * @returns The instruction number of XCM instructions
   */
  // eslint-disable-next-line class-methods-use-this
  getTransactXcmInstructionCount(transactType: OakAdapterTransactType) {
    return transactType === OakAdapterTransactType.PayThroughRemoteDerivativeAccount ? 4 : 6;
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
    const { key } = this.chainConfig;
    if (_.isUndefined(key)) throw new Error("chainConfig.key not set");

    const extrinsic = api.tx.automationTime.scheduleXcmpTask(
      schedule,
      destination,
      scheduleFee,
      executionFee,
      encodedCall,
      encodedCallWeight,
      overallWeight,
      "PayThroughSovereignAccount",
    );

    console.log(`Send extrinsic from ${key} to schedule task. extrinsic:`, extrinsic.method.toHex());
    const result = await sendExtrinsic(api, extrinsic, keyringPair);
    return result;
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
  async scheduleXcmpPriceTask(
    automationPriceTriggerParams: AutomationPriceTriggerParams,
    destination: any,
    scheduleFee: any,
    executionFee: any,
    encodedCall: HexString,
    encodedCallWeight: Weight,
    overallWeight: Weight,
    keyringPair: KeyringPair,
  ): Promise<SendExtrinsicResult> {
    const api = this.getApi();
    const { key } = this.chainConfig;
    if (_.isUndefined(key)) throw new Error("chainData.key not set");

    const extrinsic = api.tx.automationPrice.scheduleXcmpTask(
      automationPriceTriggerParams.chain,
      automationPriceTriggerParams.exchange,
      automationPriceTriggerParams.asset1,
      automationPriceTriggerParams.asset2,
      automationPriceTriggerParams.submittedAt,
      automationPriceTriggerParams.triggerFunction,
      automationPriceTriggerParams.triggerParam,
      destination,
      scheduleFee,
      executionFee,
      encodedCall,
      encodedCallWeight,
      overallWeight,
    );

    console.log(`Send extrinsic from ${key} to schedule price task. extrinsic:`, extrinsic.method.toHex());
    const result = await sendExtrinsic(api, extrinsic, keyringPair);
    return result;
  }

  /**
   * Calculate the derivative account ID of a certain account ID
   * @param accountId
   * @param paraId The paraId of the XCM message sender
   * @returns Derivative account
   */
  // eslint-disable-next-line class-methods-use-this
  getDerivativeAccount(accountId: HexString, paraId: number): HexString {
    return getDerivativeAccountV3(accountId, paraId);
  }

  /**
   * Check if the account has enough free balance
   * The calculation is based on the free balance and the existential deposit
   * @param account
   * @param amount
   */
  async hasEnoughFreeBalance(account: HexString, amount: BN): Promise<boolean> {
    const api = this.getApi();
    const balanceCodec = await api.query.system.account(account);
    const balance = balanceCodec as unknown as any;
    const { existentialDeposit } = api.consts.balances;
    const freeBalance = balance.data.free.sub(balance.data.frozen);
    return freeBalance.gte(amount.add(existentialDeposit as u128));
  }

  /**
   * Get delegator state
   * @param delegator
   * @returns
   */
  async getDelegatorState(delegator: HexString): Promise<any> {
    const api = this.getApi();
    const delegatorStateCodec = await api.query.parachainStaking.delegatorState(delegator);
    const delegatorState = delegatorStateCodec as unknown as Option<any>;
    return delegatorState.isSome ? delegatorState.unwrap() : undefined;
  }

  /**
   * Get delegation
   * @param delegator
   * @param collator
   * @returns
   */
  async getDelegation(delegator: HexString, collator: HexString): Promise<any> {
    const delegatorState = await this.getDelegatorState(delegator);
    if (_.isUndefined(delegatorState)) {
      return undefined;
    }
    const { delegations } = delegatorState;
    const foundDelegation = _.find(delegations, ({ owner }) => owner.toHex() === collator);
    return foundDelegation;
  }

  /**
   * Get auto-compounding delegations length
   * @param collator
   * @returns
   */
  async getAutoCompoundingDelegationsLength(collator: HexString): Promise<number> {
    const api = this.getApi();
    const autoCompoundingDelegationsCodec = await api.query.parachainStaking.autoCompoundingDelegations(collator);
    const autoCompoundingDelegations = autoCompoundingDelegationsCodec as unknown as any[];
    return autoCompoundingDelegations.length;
  }

  /**
   * Delegate to collator with auto-compounding
   * @param collator
   * @param amount
   * @param percentage, an integer between 0 and 100
   * @param keyringPair
   * @returns
   */
  async delegateWithAutoCompound(collator: HexString, amount: BN, percentage: number, keyringPair: KeyringPair): Promise<SendExtrinsicResult> {
    const api = this.getApi();
    // Check if delegation exists
    const delegatorWalletAddress = u8aToHex(keyringPair.addressRaw);
    if (!this.hasEnoughFreeBalance(delegatorWalletAddress, amount)) {
      throw new Error("Insufficient balance");
    }
    const delegatorState = await this.getDelegatorState(delegatorWalletAddress);
    let delegationsLength = 0;
    if (!_.isUndefined(delegatorState)) {
      const { delegations } = delegatorState;
      const foundDelegation = _.find(delegations, ({ owner }) => owner.toHex() === collator);
      delegationsLength = delegations.length;
      if (!_.isUndefined(foundDelegation)) {
        throw new Error("Delegation already exists");
      }
    }

    const { minDelegation: minDelegationCodec } = api.consts.parachainStaking;
    const minDelegation = minDelegationCodec as u128;
    if (amount.lt(minDelegation)) {
      throw new Error(`Amount must be greater than or equal to ${minDelegation}`);
    }

    const candidateInfoCodec = await api.query.parachainStaking.candidateInfo(collator);
    const candidateInfo = candidateInfoCodec as unknown as Option<any>;
    if (candidateInfo.isNone) {
      throw new Error("Candidate info not found");
    }
    const { delegationCount: candidateDelegationCount } = candidateInfo.unwrap();

    console.log("collator: ", collator);

    const autoCompoundingDelegationsLength = await this.getAutoCompoundingDelegationsLength(collator);
    console.log("autoCompoundingDelegationsLength: ", autoCompoundingDelegationsLength);

    // Delegate to collator
    const delegateExtrinsic = api.tx.parachainStaking.delegateWithAutoCompound(
      collator,
      amount,
      percentage,
      candidateDelegationCount,
      autoCompoundingDelegationsLength,
      delegationsLength,
    );

    const result = await sendExtrinsic(api, delegateExtrinsic, keyringPair);
    return result;
  }

  /**
   * Get auto-compounding delegation percentage
   * If the delegation does not exist, return undefined
   * @param delegator
   * @param collator
   * @returns
   */
  async getAutoCompoundingDelegationPercentage(collator: HexString, delegator: HexString): Promise<number | undefined> {
    const api = this.getApi();
    const autoCompoundingDelegationsCodec = await api.query.parachainStaking.autoCompoundingDelegations(collator);
    const autoCompoundingDelegations = autoCompoundingDelegationsCodec as unknown as any[];
    const delegation = _.find(autoCompoundingDelegations, (item) => item.delegator.toHex() === delegator);
    return delegation?.value?.toNumber();
  }

  /**
   * Set auto-compounding delegation percentage
   * @param collator
   * @param percentage, an integer between 0 and 100
   * @param keyringPair
   * @returns
   */
  async setAutoCompound(collator: HexString, percentage: number, keyringPair: KeyringPair): Promise<SendExtrinsicResult> {
    const api = this.getApi();

    const autoCompoundingDelegationsLength = await this.getAutoCompoundingDelegationsLength(collator);

    const delegatorState = await this.getDelegatorState(u8aToHex(keyringPair.addressRaw));
    if (_.isUndefined(delegatorState)) {
      throw new Error("Delegator state not found");
    }
    const { delegations } = delegatorState;
    const { length: delegationsLength } = delegations;

    const setAutoCompoundExtrinsic = api.tx.parachainStaking.setAutoCompound(
      collator,
      percentage,
      autoCompoundingDelegationsLength + 1,
      delegationsLength + 1,
    );
    const result = await sendExtrinsic(api, setAutoCompoundExtrinsic, keyringPair);
    return result;
  }

  /**
   * Bond more
   * @param collator
   * @param amount
   * @param keyringPair
   * @returns
   */
  async bondMore(collator: HexString, amount: BN, keyringPair: KeyringPair): Promise<SendExtrinsicResult> {
    const api = this.getApi();
    if (!this.hasEnoughFreeBalance(u8aToHex(keyringPair.addressRaw), amount)) {
      throw new Error("Insufficient balance");
    }
    // Create bondMoreExtrinsic
    const bondMoreExtrinsic = api.tx.parachainStaking.delegatorBondMore(collator, amount);

    const result = await sendExtrinsic(api, bondMoreExtrinsic, keyringPair);
    return result;
  }
}
