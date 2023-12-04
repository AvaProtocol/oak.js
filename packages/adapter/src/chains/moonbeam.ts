import _ from "lodash";
import BN from "bn.js";
import type { SubmittableExtrinsic, AddressOrPair } from "@polkadot/api/types";
import type { WeightV2 } from "@polkadot/types/interfaces";
import type { u64, u128, Option } from "@polkadot/types";
import type { HexString } from "@polkadot/util/types";
import type { KeyringPair } from "@polkadot/keyring/types";
import { Weight } from "@oak-network/config";
import { ChainAdapter, TaskScheduler } from "./chainAdapter";
import {
  convertAbsoluteLocationToRelative,
  getDerivativeAccountV3,
  sendExtrinsic,
} from "../util";
import { AccountType, SendExtrinsicResult } from "../types";
import { WEIGHT_REF_TIME_PER_SECOND } from "../constants";

const TRANSACT_XCM_INSTRUCTION_COUNT = 4;

// MoonbeamAdapter implements ChainAdapter, TaskScheduler interface
export class MoonbeamAdapter extends ChainAdapter implements TaskScheduler {
  /**
   * Initialize adapter
   */
  async initialize() {
    // As of 12/02/2023, api.consts and api.query both return {} from all Moonriver endpoints.
    // Maybe additional calls are required prior to fetch api.consts

    // await this.fetchAndUpdateConfigs();

    this.chainConfig.ss58Prefix = 1285;
    this.chainConfig.paraId = 2023;
  }

  /**
   * Get asset data from assetManager storage
   * @returns asset data items
   */
  async getAssetManagerItems(): Promise<any[]> {
    const api = this.getApi();
    const entries = await api.query.assetManager.assetIdType.entries();
    const items: any[] = [];
    _.each(entries, ([storageKey, storageValue]) => {
      const key = storageKey.args[0] as unknown as u128;
      const item = storageValue as unknown as Option<any>;
      if (item.isSome) {
        const value = item.unwrap().toJSON();
        items.push({ key, value });
      }
    });
    return items;
  }

  /**
   * Get assets from chain
   * @returns assets
   */
  async getAssets(): Promise<any[]> {
    const api = this.getApi();
    const entries = await api.query.assets.metadata.entries();
    const items: any[] = [];
    _.each(entries, ([storageKey, storageValue]) => {
      const key = storageKey.args[0] as unknown as u128;
      const value = storageValue.toJSON();
      items.push({ key, value });
    });
    return items;
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
   * Calculate XCM overall weight
   * @param transactCallWeight
   * @param instructionCount
   * @returns XCM overall weight
   */
  async calculateXcmOverallWeight(
    transactCallWeight: Weight,
    instructionCount: number,
  ): Promise<Weight> {
    const { xcm } = this.chainConfig;
    if (_.isUndefined(xcm)) throw new Error("chainConfig.xcm not set");
    const overallWeight = transactCallWeight.add(
      xcm.instructionWeight.muln(instructionCount),
    );
    return overallWeight;
  }

  /**
   * Calculate XCM overall weight for transact an extrinsic call through XCM message
   * @param transactCallWeight
   * @param instructionCount The number of XCM instructions
   * @returns XCM overall weight
   */
  async weightToFee(weight: Weight, assetLocation: any): Promise<BN> {
    const [defaultAsset] = this.chainConfig.assets;
    if (_.isUndefined(defaultAsset))
      throw new Error("chainConfig.defaultAsset not set");
    const api = this.getApi();
    if (_.isEqual(defaultAsset.location, assetLocation)) {
      const fee = (await api.call.transactionPaymentApi.queryWeightToFee(
        weight,
      )) as u64;
      return fee;
    }
    const storageValue = await api.query.assetManager.assetTypeUnitsPerSecond({
      Xcm: assetLocation,
    });
    const item = storageValue as unknown as Option<u128>;
    if (item.isNone) throw new Error("AssetTypeUnitsPerSecond is null");
    const unitsPerSecond = item.unwrap();
    return weight.refTime.mul(unitsPerSecond).div(WEIGHT_REF_TIME_PER_SECOND);
  }

  /**
   * Get the instruction number of XCM instructions for transact
   */
  // eslint-disable-next-line class-methods-use-this
  getTransactXcmInstructionCount() {
    return TRANSACT_XCM_INSTRUCTION_COUNT;
  }

  /**
   * Schedule Task through XCM message
   * @param destination The location of the destination chain
   * @param encodedTaskExtrinsic encoded task extrinsic
   * @param feeLocation Fee location
   * @param feeAmount Fee amount
   * @param encodedCallWeight The encoded call weight weight of the XCM instructions
   * @param overallWeight The overall weight of the XCM instructions
   * @param keyringPair Operator's keyring pair
   */
  async scheduleTaskThroughXcm(
    destination: any,
    encodedTaskExtrinsic: HexString,
    feeLocation: any,
    feeAmount: BN,
    encodedCallWeight: Weight,
    overallWeight: Weight,
    keyringPair: KeyringPair,
  ): Promise<SendExtrinsicResult> {
    const api = this.getApi();
    const { key } = this.chainConfig;
    if (_.isUndefined(key)) throw new Error("chainConfig.key not set");

    const [defaultAsset] = this.chainConfig.assets;
    if (_.isUndefined(defaultAsset))
      throw new Error("chainConfig.defaultAsset not set");
    const currency = _.isEqual(feeLocation, defaultAsset.location)
      ? { AsCurrencyId: "SelfReserve" }
      : { AsMultiLocation: { V3: feeLocation } };
    const extrinsic = this.getApi().tx.xcmTransactor.transactThroughSigned(
      { V3: destination },
      { currency, feeAmount },
      encodedTaskExtrinsic,
      { overallWeight, transactRequiredWeightAtMost: encodedCallWeight },
      false,
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
   * @returns Derivative account
   */
  // eslint-disable-next-line class-methods-use-this
  getDerivativeAccount(accountId: HexString, paraId: number): HexString {
    return getDerivativeAccountV3(accountId, paraId, AccountType.AccountKey20);
  }

  /**
   * Check if it is a native asset
   * @param assetLocation
   * @returns A bool value indicating whether it is a native asset
   */
  isNativeAsset(assetLocation: any): boolean {
    const { assets } = this.chainConfig;
    const foundAsset = _.find(assets, { location: assetLocation });
    return !_.isUndefined(foundAsset) && foundAsset.isNative;
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

    const transferAssetLocation = this.isNativeAsset(assetLocation)
      ? convertAbsoluteLocationToRelative(assetLocation)
      : assetLocation;

    const api = this.getApi();
    const extrinsic = api.tx.xTokens.transferMultiasset(
      {
        V3: {
          fun: { Fungible: assetAmount },
          id: { Concrete: transferAssetLocation },
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
}
