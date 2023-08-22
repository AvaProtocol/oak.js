import BN from 'bn.js';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { ChainProvider, OakProvider } from '@oak-network/provider';
import { Asset } from '@oak-network/sdk-types';

export const sendExtrinsic = async (api: any, extrinsic: any, keyPair: any, { isSudo = false } = {}) => new Promise((resolve) => {
  const newExtrinsic = isSudo ? api.tx.sudo.sudo(extrinsic) : extrinsic;
  newExtrinsic.signAndSend(keyPair, { nonce: -1 }, ({ status, events } : { status: any, events: any }) => {
    console.log('status.type', status.type);
    if (status.isInBlock || status.isFinalized) {
      events
      // find/filter for failed events
          .filter(({ event }: { event: any}) => api.events.system.ExtrinsicFailed.is(event))
      // we know that data for system.ExtrinsicFailed is
      // (DispatchError, DispatchInfo)
          .forEach(({ event: { data: [error] } } : {event: any}) => {
              if (error.isModule) {
                  // for module errors, we have the section indexed, lookup
                  const decoded = api.registry.findMetaError(error.asModule);
                  const { docs, method, section } = decoded;
                  console.log(`${section}.${method}: ${docs.join(' ')}`);
              } else {
                  // Other, CannotLookup, BadOrigin, no extra info
                  console.log(error.toString());
              }
          });

      if (status.isFinalized) {
          resolve({ events, blockHash: status.asFinalized.toString() });
      }
    }
  });
});

interface scheduleXcmpTaskWithPayThroughSoverignAccountFlowParams {
  oakProvider: OakProvider;
  destinationChainProvider: ChainProvider;
  taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>;
  schedule: any;
  keyPair: any;
}

async function scheduleXcmpTaskWithPayThroughSoverignAccountFlow({
  oakProvider,
  destinationChainProvider,
  taskPayloadExtrinsic,
  schedule,
  keyPair,
}: scheduleXcmpTaskWithPayThroughSoverignAccountFlowParams) {
  const oakApi = oakProvider.chain.getApi();
  const { defaultAsset } = oakProvider.chain.getChainData();
  if (!defaultAsset) throw new Error("defaultAsset not set");
  const destination = { V3: destinationChainProvider.chain.getLocation() };
  const encodedCall = taskPayloadExtrinsic.method.toHex();
  console.log('keyPair.address: ', keyPair.address);
  const { encodedCallWeight, overallWeight } = await destinationChainProvider.chain.getXcmWeight(keyPair.address, taskPayloadExtrinsic);
  const scheduleFee = { V3: defaultAsset.location }
  const xcmpFee = await destinationChainProvider.chain.weightToFee(overallWeight, defaultAsset.location);
  const executionFee = { assetLocation: { V3: defaultAsset.location }, amount: xcmpFee };
  
  console.log('scheduleFee: ', scheduleFee);
  console.log('executionFee: ', executionFee.assetLocation, executionFee.amount.toString());

  const extrinsic = oakApi.tx.automationTime.scheduleXcmpTask(
    schedule,
    destination,
    scheduleFee,
    executionFee,
    encodedCall,
    encodedCallWeight,
    overallWeight,
  );
  
  console.log('extrinsic: ', extrinsic.method.toHex());
  await sendExtrinsic(oakApi, extrinsic, keyPair);
}

// async function scheduleXcmpTaskWithPayThroughRemoteDerivativeAccount(oakProvider: OakProvider, destinationChainProvider: ChainProvider) {
// 	// create destinationChainProvider task payload
// 	// Create oakProvider task
// 	// oakProvider schedule
// }

export function Sdk() {
  return {
    scheduleXcmpTask: async (oakProvider: OakProvider, destinationChainProvider: ChainProvider, { instructionSequnce, taskPayloadExtrinsic, schedule, keyPair }: { instructionSequnce: string, taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>, schedule: any, keyPair: any }): Promise<void> => {
      console.log('instructionSequnce: ', instructionSequnce);
      if (instructionSequnce == 'PayThroughSoverignAccount') {
        await scheduleXcmpTaskWithPayThroughSoverignAccountFlow({
          oakProvider,
          destinationChainProvider,
          taskPayloadExtrinsic,
          schedule,
          keyPair,
        });
      } else {
        // await scheduleXcmpTaskWithPayThroughRemoteDerivativeAccount(oakProvider, destinationChainProvider);
      }
    },
    transfer: ( sourceChain: ChainProvider, destinationChain: ChainProvider, { asset, assetAmount } : { asset: Asset, assetAmount: BN }): void => {
      // TODO
      // sourceChain.transfer(destinationChain, asset, assetAmount);
    },
  }
};
