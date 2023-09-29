import _ from "lodash";
import BN from "bn.js";
// import '@polkadot/api-augment';
import type { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { SubmittableExtrinsic, AddressOrPair } from "@polkadot/api/types";
import type { u32 } from "@polkadot/types";
import type { HexString } from "@polkadot/util/types";
import {
  ChainAsset,
  Weight,
  Chain as ChainConfig,
  ChainXcmInfo,
} from "@oak-network/sdk-types";
import { SendExtrinsicResult, XcmInstructionNetworkType } from "../types";

export class ChainData {
  key: string | undefined;

  assets: ChainAsset[] = [];

  defaultAsset: ChainAsset | undefined;

  endpoint: string | undefined;

  relayChain: string | undefined;

  network: string | undefined;

  paraId: number | undefined;

  ss58Prefix: number | undefined;

  name: string | undefined;

  xcmInstructionNetworkType: XcmInstructionNetworkType =
    XcmInstructionNetworkType.Null;

  xcm: ChainXcmInfo | undefined;
}

export abstract class ChainAdapter {
  api: ApiPromise | undefined;

  protected chainData: ChainData;

  /**
   * Constructor
   * @param api Polkadot API
   * @param config Chain config
   */
  constructor(api: ApiPromise, config: ChainConfig) {
    this.api = api;
    this.chainData = new ChainData();
    this.chainData.key = config.key;
    this.chainData.assets = config.assets;
    this.chainData.defaultAsset = config.defaultAsset;
    this.chainData.endpoint = config.endpoint;
    this.chainData.relayChain = config.relayChain;
    this.chainData.xcm = config.xcm;
  }

  /**
   * Initialize adapter
   */
  public abstract initialize(): Promise<void>;

  /**
   * Calculate the derivative account ID of a certain account ID
   * @param api Polkadot API
   * @param accountId
   * @param paraId The paraId of the XCM message sender
   * @param options Optional operation options: { locationType, network }
   * @returns Derivative account
   */
  public abstract getDerivativeAccount(
    accountId: HexString,
    paraId: number,
    options?: any,
  ): HexString;

  /**
   * Calculate encoded call weight and overall weight for transact an extrinsic call through XCM message
   * @param extrinsic The extrinsic that needs to be transacted
   * @param account
   * @param instructionCount The number of XCM instructions
   * returns { encodedCallWeight, overallWeight }
   */
  public abstract getXcmWeight(
    extrinsic: SubmittableExtrinsic<"promise">,
    account: AddressOrPair,
    instructionCount: number,
  ): Promise<{ encodedCallWeight: Weight; overallWeight: Weight }>;

  /**
   * Calculate XCM execution fee based on weight
   * @param weight
   * @param assetLocation
   * @returns XCM execution fee
   */
  public abstract weightToFee(weight: Weight, assetLocation: any): Promise<BN>;

  /**
   * Execute a cross-chain transfer
   * @param destination The location of the destination chain
   * @param recipient recipient account
   * @param assetLocation Asset location
   * @param assetAmount Asset amount
   * @param keyringPair Operator's keyring pair
   */
  public abstract crossChainTransfer(
    destination: any,
    recipient: HexString,
    assetLocation: any,
    assetAmount: BN,
    keyringPair: KeyringPair,
  ): Promise<SendExtrinsicResult>;

  /**
   * Get polkadot API
   * @returns Polkadot API
   */
  public getApi(): ApiPromise {
    if (_.isUndefined(this.api)) throw new Error("Api not initialized");
    return this.api;
  }

  /**
   * Fetch configs from chain and Update chain data
   */
  public async fetchAndUpdateConfigs(): Promise<void> {
    const api = this.getApi();
    this.chainData.ss58Prefix = (
      api.consts.system.ss58Prefix as unknown as u32
    ).toNumber();
    const storageValue = await api.query.parachainInfo.parachainId();
    this.chainData.paraId = (storageValue as unknown as u32).toNumber();
  }

  /**
   * Get chain data
   * @returns Chain data
   */
  public getChainData(): ChainData {
    return this.chainData;
  }

  /**
   * Get the absolute location of the chain
   * @returns The absolute location of the chain
   */
  public getLocation(): any {
    const { paraId } = this.chainData;
    if (_.isUndefined(paraId)) throw new Error("chainData.paraId not set");
    return { parents: 1, interior: { X1: { Parachain: paraId } } };
  }
}

export interface TaskScheduler {
  /**
   * Get the instruction number of XCM instructions for transact
   */
  getTransactXcmInstructionCount(): number;

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
  scheduleTaskThroughXcm(
    destination: any,
    encodedTaskExtrinsic: HexString,
    feeLocation: any,
    feeAmount: BN,
    encodedCallWeight: Weight,
    overallWeight: Weight,
    keyringPair: KeyringPair,
  ): Promise<SendExtrinsicResult>;
}
