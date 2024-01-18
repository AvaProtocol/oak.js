import _ from "lodash";
import BN from "bn.js";
import type { SubmittableExtrinsic, AddressOrPair } from "@polkadot/api/types";
import type { u64, u128, Option } from "@polkadot/types";
import type { WeightV2 } from "@polkadot/types/interfaces";
import type { HexString } from "@polkadot/util/types";
import { u8aToHex } from "@polkadot/util";
import type { KeyringPair } from "@polkadot/keyring/types";
import { Weight, XcmInstructionNetworkType, contracts } from "@oak-network/config";
import { ethers } from "ethers";
import { ISubmittableResult } from "@polkadot/types/types";
import { ChainAdapter, TaskScheduler } from "./chainAdapter";
import { convertAbsoluteLocationToRelative, getDerivativeAccountV3, sendExtrinsic, isValidAddress, getAccountTypeFromAddress } from "../utils";
import { convertLocationToPrecompileMultiLocation } from "../contract-utils";
import { AccountType, SendExtrinsicResult } from "../types";
import { WEIGHT_REF_TIME_PER_SECOND } from "../constants";
import { InvalidAddress } from "../errors";

const TRANSACT_XCM_INSTRUCTION_COUNT = 6;

// AstarAdapter implements ChainAdapter, TaskScheduler interface
export class AstarAdapter extends ChainAdapter implements TaskScheduler {
  /**
   * Initialize adapter
   */
  async initialize() {
    await this.fetchAndUpdateConfigs();
  }

  /**
   * Fetch configs from chain and Update chain data
   */
  public async fetchAndUpdateConfigs(): Promise<void> {
    await super.fetchAndUpdateConfigs();
    this.chainConfig.xcm.instructionNetworkType = XcmInstructionNetworkType.Concrete;
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
    if (_.isEqual(defaultAsset.location, assetLocation)) {
      const fee = (await api.call.transactionPaymentApi.queryWeightToFee(weight)) as u64;
      return fee;
    }
    const AssetLocationUnitsPerSecond = await api.query.xcAssetConfig.assetLocationUnitsPerSecond(assetLocation);
    const metadataItem = AssetLocationUnitsPerSecond as unknown as Option<u128>;
    if (metadataItem.isNone) throw new Error("MetadatAssetLocationUnitsPerSecond is null");
    const unitsPerSecond = metadataItem.unwrap();
    return weight.refTime.mul(unitsPerSecond).div(WEIGHT_REF_TIME_PER_SECOND);
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
   * @returns SendExtrinsicResult
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
    if (_.isUndefined(key)) throw new Error("chainConfig.key not set.");

    const extrinsic = api.tx.polkadotXcm.send(
      { V3: destination },
      {
        V3: [
          {
            WithdrawAsset: [
              {
                fun: { Fungible: feeAmount },
                id: { Concrete: feeLocation },
              },
            ],
          },
          {
            BuyExecution: {
              fees: {
                fun: { Fungible: feeAmount },
                id: { Concrete: feeLocation },
              },
              weightLimit: { Limited: overallWeight },
            },
          },
          {
            Transact: {
              call: { encoded: encodedTaskExtrinsic },
              originKind: "SovereignAccount",
              requireWeightAtMost: encodedCallWeight,
            },
          },
          { RefundSurplus: "" },
          {
            DepositAsset: {
              assets: { Wild: { AllCounted: 1 } },
              beneficiary: {
                interior: {
                  X1: {
                    AccountId32: {
                      id: u8aToHex(keyringPair.addressRaw),
                      network: null,
                    },
                  },
                },
                parents: 1,
              },
              maxAssets: 1,
            },
          },
        ],
      },
    );

    console.log(`Send extrinsic from ${key} to schedule task. extrinsic:`, extrinsic.method.toHex());

    const result = await sendExtrinsic(api, extrinsic, keyringPair);
    return result;
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
   * Create an extrinsic call to transfer asset to a recipient through XCM message
   * @param destination The location of the destination chain
   * @param recipient recipient account
   * @param assetLocation Asset location
   * @param assetAmount Asset amount
   * @param keyringPair Operator's keyring pair
   * @returns extrinsic
   */
  crossChainTransfer(
    destination: any,
    recipient: HexString,
    assetLocation: any,
    assetAmount: BN,
  ): SubmittableExtrinsic<"promise", ISubmittableResult> {
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

    const transferAssetLocation = this.isNativeAsset(assetLocation) ? convertAbsoluteLocationToRelative(assetLocation) : assetLocation;

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
            X2: [destination.interior.X1, accountId],
          },
          parents: 1,
        },
      },
      "Unlimited",
    );

    console.log(`Transfer from ${key}, extrinsic:`, extrinsic.method.toHex());
    return extrinsic;
  }

  /**
   * Create an extrinsic call to transfer asset to a recipient through XCM message
   * @param destination The location of the destination chain
   * @param recipient recipient account
   * @param assetLocation Asset location
   * @param assetAmount Asset amount
   * @param keyringPair Operator's keyring pair
   * @returns SendExtrinsicResult
   */
  async crossChainTransferWithEthSigner(
    destination: any,
    recipient: HexString,
    assetLocation: any,
    assetAmount: BN,
    signer: ethers.AbstractSigner,
  ): Promise<any> {
    const { key } = this.chainConfig;
    if (_.isUndefined(key)) throw new Error("chainConfig.key not set");

    const isAccountKey20Address = getAccountTypeFromAddress(recipient) === AccountType.AccountKey20;
    if (!isValidAddress(recipient, isAccountKey20Address)) {
      throw new InvalidAddress(recipient);
    }

    const accountId = isAccountKey20Address
      ? { [AccountType.AccountKey20]: { key: recipient, network: null } }
      : { [AccountType.AccountId32]: { id: recipient, network: null } };

    const transferAssetLocation = this.isNativeAsset(assetLocation) ? convertAbsoluteLocationToRelative(assetLocation) : assetLocation;
    const asset = convertLocationToPrecompileMultiLocation(transferAssetLocation);
    const dest = { interior: { X2: [destination.interior.X1, accountId] }, parents: destination.parents };
    const destinationParam = convertLocationToPrecompileMultiLocation(dest);
    // Unlimited weight
    const unlimitedWeight = [0, 0];

    // Send contract call
    const xcm = new ethers.Contract(contracts.astar.xcm.address, contracts.astar.xcm.abi, signer);
    const transaction = await xcm.transfer_multiasset(asset, assetAmount.toString(), destinationParam, unlimitedWeight);
    await transaction.wait();
    return transaction;
  }
}
