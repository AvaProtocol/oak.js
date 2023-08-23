import _ from 'lodash';
import BN from 'bn.js';
import { ApiPromise, WsProvider } from '@polkadot/api';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { u64, u128, Option } from '@polkadot/types';
import type { WeightV2 } from '@polkadot/types/interfaces';
import { hexToU8a, u8aToHex } from '@polkadot/util';
import { TypeRegistry } from '@polkadot/types';
import { decodeAddress, blake2AsU8a } from '@polkadot/util-crypto';
import Keyring from '@polkadot/keyring';
import { Chain as ChainConfig, Weight } from '@oak-network/sdk-types';
import { Chain, ChainProvider, TaskRegister } from './chainProvider';
import { sendExtrinsic } from '../util';


// AstarChain implements Chain, TaskRegister interface
export class AstarChain extends Chain implements TaskRegister {
  api: ApiPromise | undefined;

  async initialize() {
    const api = await ApiPromise.create({
			provider: new WsProvider(this.chainData.endpoint),
		});

		this.api = api;
    await this.updateChainData();
  }

  public getApi(): ApiPromise {
    if (!this.api) throw new Error("Api not initialized");
    return this.api;
  }
  
  async destroy() {
    await this.getApi().disconnect();
    this.api = undefined;
  }

  async getExtrinsicWeight(sender: string, extrinsic: SubmittableExtrinsic<'promise'>): Promise<Weight> {
    const { refTime, proofSize } = (await extrinsic.paymentInfo(sender)).weight as unknown as WeightV2;
		return new Weight(new BN(refTime.unwrap()), new BN(proofSize.unwrap()));
  }

  async getXcmWeight(sender: string, extrinsic: SubmittableExtrinsic<'promise'>): Promise<{ encodedCallWeight: Weight; overallWeight: Weight; }> {
    const { instructionWeight } = this.chainData;
    if (!instructionWeight) throw new Error("chainData.instructionWeight not set");
    const encodedCallWeight = await this.getExtrinsicWeight(sender, extrinsic);
    const overallWeight = encodedCallWeight.add(instructionWeight.muln(6));
    return { encodedCallWeight, overallWeight };
  }

  async weightToFee(weight: Weight, assetLocation: any): Promise<BN> {
    const { defaultAsset } = this.chainData;
    if (!defaultAsset) throw new Error("chainData.defaultAsset not set");

		const api = this.getApi();
		if (_.isEqual(defaultAsset.location, assetLocation)) {
      const fee = await api.call.transactionPaymentApi.queryWeightToFee(weight) as u64;
			return fee;
    } else {
			const AssetLocationUnitsPerSecond = await api.query.xcAssetConfig.assetLocationUnitsPerSecond(assetLocation);
			const metadataItem = AssetLocationUnitsPerSecond as unknown as Option<u128>;
			if (metadataItem.isNone) throw new Error("MetadatAssetLocationUnitsPerSeconda not initialized");
			const unitsPerSecond = metadataItem.unwrap();
			return weight.refTime.mul(unitsPerSecond).div(new BN(10 ** 12));
    }
  }

  async transfer(destination: Chain, assetLocation: any, assetAmount: BN) {
		// TODO
    // this.api.tx.xtokens.transfer(destination, assetLocation, assetAmount);
  }

  // transfer(api: polkadotApi, destination, asset: Asset, assetAmount: BN): hash {
  //   // TODO
  // }

  public getDeriveAccount(address: string, paraId: number, options: any): string {
    const { accountType } = options;
    const decodedAddress = accountType === 'AccountKey20' ? hexToU8a(address) : decodeAddress(address);

    // Calculate Hash Component
    const registry = new TypeRegistry();
    const toHash = new Uint8Array([
        ...new TextEncoder().encode('SiblingChain'),
        ...registry.createType('Compact<u32>', paraId).toU8a(),
        ...registry.createType('Compact<u32>', accountType.length + (accountType === 'AccountKey20' ? 20 : 32)).toU8a(),
        ...new TextEncoder().encode(accountType),
        ...decodedAddress,
    ]);

    const deriveAccountId = u8aToHex(blake2AsU8a(toHash).slice(0, 32));
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 51 });
    return keyring.encodeAddress(deriveAccountId);
  }

  async scheduleTaskThroughXcm(destination: any, encodedCall: `0x${string}`, feeAmount: BN, encodedCallWeight: Weight, overallWeight: Weight, deriveAccount: string, keyPair: any): Promise<void> {
    const { paraId } = this.chainData;
    if (!paraId) throw new Error('paraId not implemented.');

    const api = this.getApi();
    const extrinsic = api.tx.polkadotXcm.send(
      { V3: destination },
      {
        V3: [
          {
            WithdrawAsset: [
              {
                fun: { Fungible: feeAmount },
                id: {
                  Concrete: {
                    interior: { X1: { Parachain: paraId } },
                    parents: 1,
                  },
                },
              },
            ],
          },
          {
            BuyExecution: {
              fees: {
                fun: { Fungible: feeAmount },
                id: {
                  Concrete: {
                      interior: { X1: { Parachain: paraId } },
                      parents: 1,
                  },
                },
              },
              weightLimit: { Limited: overallWeight },
            },
          },
          {
            Transact: {
              originKind: 'SovereignAccount',
              requireWeightAtMost: encodedCallWeight,
              call: { encoded: encodedCall },
            },
          },
          { RefundSurplus: '' },
          {
            DepositAsset: {
              assets: { Wild: 'All' },
              maxAssets: 1,
              beneficiary: {
                parents: 1,
                interior: { X1: { AccountId32: { network: null, id: deriveAccount } } },
              },
            },
          },
        ],
      },
    );

    console.log('extrinsic: ', extrinsic.method.toHex());
    await sendExtrinsic(api, extrinsic, keyPair);
  }
}

export class AstarProvider extends ChainProvider {
  constructor(config: ChainConfig) {
    const chain = new AstarChain(config);
    super(chain, chain);
  }
}
