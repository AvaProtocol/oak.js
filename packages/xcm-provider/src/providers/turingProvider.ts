
import { turing, turingStaging, turingMoonbase, turingLocal } from '@oak-foundation/xcm-config';
import { ChainProvider, Chain, TaskRegister } from './chainProvider';
import { TransactInfo } from "../types";

// TuringChain implements Chain
export class TuringChain implements Chain {
  constructor(config) {
    this.config = turing;
  }
  getInstructionWeight(encodedCallWeight: Weight): Weight {
    return this.config.instructionWeight * 6
  }
  weightToFee(api: polkadotApi, overallWeight: Weight, asset: Asset): BN {
    const assetType = (await api.query.assetManager.assetIdType(asset))
    const feePerSecond = api.query.assetManager.assetTypeUnitsPerSecond(assetType);
    return feePerSecond * overallWeight;
  }
  transfer(api: polkadotApi, destination, asset: Asset, assetAmount: BN): hash {
    new Error("Not implemented");
  }
  createScheduleXcmpTaskExtrinsic(api: polkadotApi, schedule, encodedCall: Bytes, encodedCallWeight: Weight, overallWeight: Weight, scheduleFee, executionFee) {
    api.tx.scheduleXcmpTask(schedule, encodedCall, encodedCallWeight, overallWeight, scheduleFee, executionFee);
  }
  createScheduleXcmpTaskThroughProxyExtrinsic(api: polkadotApi, schedule, encodedCall: Bytes, encodedCallWeight: Weight, overallWeight: Weight, scheduleFee, executionFee, scheduleAs) {
    api.tx.scheduleXcmpTaskThroughProxy(schedule, encodedCall, encodedCallWeight, overallWeight, scheduleFee, executionFee, scheduleAs);
  }
}

export const turingChainProvider: ChainProvider = {
  chain: new TuringChain(turing),
};

export const turingStagingChainProvider: ChainProvider = {
  chain: new TuringChain(turingStaging),
};

export const turingMoonbaseChainProvider: ChainProvider = {
  chain: new TuringChain(turingStaging),
};

export const turingLocalChainProvider: ChainProvider = {
  chain: new TuringChain(turingStaging),
};
