import { Chain as ChainConfig } from '@oak-foundation/xcm-types';
import { Chain, TaskRegister } from './chainProvider';

// MoonbeamChain implements Chain, TaskRegister interface
export class MoonbeamChain implements Chain, TaskRegister {
  readonly config: ChainConfig;
  constructor(config: ChainConfig) {
    this.config = config;
  }
  // getInstructionWeight(): Weight {
  //   return this.config.instructionWeight * 4
  // }
  // weightToFee(api: polkadotApi, overallWeight: Weight, asset: Asset): BN {
  //   if (asset === nativeAsset) {
  //     return api.call.transactionPaymentApi.queryWeightToFee(overallWeight)
  //   } else {
  //     const assetType = (await api.query.assetManager.assetIdType(asset))
  //     const feePerSecond = api.query.assetManager.assetTypeUnitsPerSecond(assetType);
  //     return feePerSecond * overallWeight;
  //   }
  // }
  // transfer(api: polkadotApi, destination, asset: Asset, assetAmount: BN): hash {
  //   // TODO
  // }
  // createRegistryTaskExtrinsic(api: polkadotApi, transactInfo: TransactInfo): Extrinsic {
  //   const { encodedCall, encodedCallWeight,overallWeight, fee } = transactInfo;
  //   return api.tx.xcmTransactor.transactThroughSigned(encodedCall, encodedCallWeight,overallWeight, fee);
  // }
}
