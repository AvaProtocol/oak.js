import { TransactInfo } from "../types";

// Every chain implements ChainProvider
// If you want to use PayThroughRemoteDerivativeAccount instructionSequence to schedule task, implements TaskRegister
// For example, MoonbeamChain implements TaskRegister, Mangata does not implement TaskRegister
export interface ChainProvider {
  chain: Chain;
  taskRegister: TaskRegister | undefined;
}

export interface Chain {
  getInstructionWeight(): Weight;
  weightToFee(api: polkadotApi, encodedCallWeight: Weight, asset: Asset): BN;
  transfer(api: polkadotApi, destination, asset: Asset, assetAmount: BN): hash;
}

export interface TaskRegister {
  createRegistryTaskExtrinsic(api: polkadotApi, transactInfo: TransactInfo): Extrinsic;
}
