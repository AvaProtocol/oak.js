import _ from "lodash";
import BN from "bn.js";
import type { SubmittableExtrinsic, AddressOrPair } from "@polkadot/api/types";
import type { u32, u128, Option } from "@polkadot/types";
import type { WeightV2 } from "@polkadot/types/interfaces";
import type { HexString } from "@polkadot/util/types";
import { Weight } from "@oak-network/config";
import { ISubmittableResult } from "@polkadot/types/types";
import { ChainAdapter } from "./chainAdapter";
import { getDerivativeAccountV2, isValidAddress, getAccountTypeFromAddress } from "../utils";
import { WEIGHT_REF_TIME_PER_NANOS, WEIGHT_REF_TIME_PER_SECOND, WEIGHT_PROOF_SIZE_PER_MB } from "../constants";
import { AccountType } from "../types";
import { InvalidAddress } from "../errors";

// MangataAdapter implements ChainAdapter
export class MangataAdapter extends ChainAdapter {
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
      const unit = new BN(10).pow(new BN(defaultAsset.decimals));
      // ExtrinsicBaseWeight benchmark value: 114756 nano seconds
      const extrinsicBaseWeight = WEIGHT_REF_TIME_PER_NANOS.mul(new BN(114756));
      const feePerSecond = WEIGHT_REF_TIME_PER_SECOND.div(extrinsicBaseWeight).mul(unit);
      const refTimeFee = weight.refTime.mul(feePerSecond).div(WEIGHT_REF_TIME_PER_SECOND);
      const proofSizeFee = weight.proofSize.mul(feePerSecond).div(WEIGHT_PROOF_SIZE_PER_MB);
      return refTimeFee.add(proofSizeFee);
    }
    const storageValue = await api.query.assetRegistry.locationToAssetId(assetLocation);
    const item = storageValue as unknown as Option<u32>;
    if (item.isNone) throw new Error("AssetTypeUnitsPerSecond is null");

    const assetId = item.unwrap();
    const metadataStorageValue = await api.query.assetRegistry.metadata(assetId);
    const metadataItem = metadataStorageValue as unknown as Option<any>;
    if (metadataItem.isNone) throw new Error("Metadata is null");

    const {
      additional: { xcm },
    } = metadataItem.unwrap() as { additional: { xcm: Option<any> } };
    if (_.isUndefined(xcm)) throw new Error("Metadata additional.xcm is null");
    const feePerSecond = xcm.unwrap().feePerSecond as u128;

    return weight.refTime.mul(feePerSecond).div(WEIGHT_REF_TIME_PER_SECOND);
  }

  /**
   * Calculate the derivative account ID of a certain account ID
   * @param accountId
   * @param paraId The paraId of the XCM message sender
   * @returns Derivative account
   */
  getDerivativeAccount(accountId: HexString, paraId: number): HexString {
    const api = this.getApi();
    return getDerivativeAccountV2(api, accountId, paraId);
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

    const isAccountKey20Address = getAccountTypeFromAddress(recipient) === AccountType.AccountKey20;
    if (!isValidAddress(recipient, isAccountKey20Address)) {
      throw new InvalidAddress(recipient);
    }

    const accountId = isAccountKey20Address
      ? { [AccountType.AccountKey20]: { key: recipient, network: null } }
      : { [AccountType.AccountId32]: { id: recipient, network: null } };

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
}
