import BN from 'bn.js';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import { ChainProvider, OakChain } from '@oak-network/provider';
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
  oakChain: OakChain;
  destinationChainProvider: ChainProvider;
  taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>;
  schedule: any;
  keyPair: any;
}

async function scheduleXcmpTaskWithPayThroughSoverignAccountFlow({
  oakChain,
  destinationChainProvider,
  taskPayloadExtrinsic,
  schedule,
  keyPair,
}: scheduleXcmpTaskWithPayThroughSoverignAccountFlowParams) {
  const oakApi = oakChain.getApi();
  const { defaultAsset } = oakChain.getChainData();
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

async function scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow({
  oakChain,
  destinationChainProvider,
  taskPayloadExtrinsic,
  schedule,
  keyPair,
}: scheduleXcmpTaskWithPayThroughSoverignAccountFlowParams) {
  const oakApi = oakChain.getApi();
  const { defaultAsset: destinationAsset, paraId } = destinationChainProvider.chain.getChainData();
  if(!destinationAsset) throw new Error("destinationAsset not set");
  if (!paraId) throw new Error("paraId not set");
  const destination = { V3: destinationChainProvider.chain.getLocation() };
  const encodedCall = taskPayloadExtrinsic.method.toHex();
  console.log('keyPair.address: ', keyPair.address);
  const { encodedCallWeight, overallWeight } = await destinationChainProvider.chain.getXcmWeight(keyPair.address, taskPayloadExtrinsic);
  const scheduleFee = { V3: destinationAsset.location }
  const xcmpFee = await destinationChainProvider.chain.weightToFee(overallWeight, destinationAsset.location);
  const executionFee = { assetLocation: { V3: destinationAsset.location }, amount: xcmpFee };
  console.log('scheduleFee: ', scheduleFee);
  console.log('executionFee: ', executionFee.assetLocation, executionFee.amount.toString());
  console.log('paraId: ', paraId);
  const deriveAccount = oakChain.getDeriveAccount(keyPair.address, paraId, { addressType: 'Ethereum' });
  console.log('deriveAccount: ', deriveAccount);
  
  const extrinsic = oakApi.tx.automationTime.scheduleXcmpTaskThroughProxy(
    schedule,
    destination,
    scheduleFee,
    executionFee,
    encodedCall,
    encodedCallWeight,
    overallWeight,
    '67RKQFDRWRFnY7RrkvR7N1kNpZiXa9P2qdLtwxYZFDjs4dAr',
  );
  
  const taskEncodedCall = extrinsic.method.toHex();
  console.log('taskEncodedCall:', taskEncodedCall);
  const { encodedCallWeight: taskEncodedCallWeight, overallWeight: taskOverallWeight } = await oakChain.getXcmWeight(deriveAccount, extrinsic);
  console.log('taskEncodedCallWeight:', taskEncodedCallWeight);
  console.log('taskOverallWeight:', taskOverallWeight);
  const taskExecutionFee = await oakChain.weightToFee(taskOverallWeight, destinationAsset.location);
  console.log('taskExecutionFee:', taskExecutionFee.toString());
  if(!destinationChainProvider.taskRegister) throw new Error("destinationChainProvider.taskRegister not set");
  const oakLocation = oakChain.getLocation();
  await destinationChainProvider.taskRegister.scheduleTaskThroughXcm(oakLocation, taskEncodedCall, taskExecutionFee, taskEncodedCallWeight, taskOverallWeight, keyPair);
}

export function Sdk() {
  return {
    scheduleXcmpTask: async (oakChain: OakChain, destinationChainProvider: ChainProvider, { instructionSequnce, taskPayloadExtrinsic, schedule, keyPair }: { instructionSequnce: string, taskPayloadExtrinsic: SubmittableExtrinsic<'promise'>, schedule: any, keyPair: any }): Promise<void> => {
      console.log('instructionSequnce: ', instructionSequnce);
      if (instructionSequnce == 'PayThroughSoverignAccount') {
        await scheduleXcmpTaskWithPayThroughSoverignAccountFlow({
          oakChain,
          destinationChainProvider,
          taskPayloadExtrinsic,
          schedule,
          keyPair,
        });
      } else {
        await scheduleXcmpTaskWithPayThroughRemoteDerivativeAccountFlow({
          oakChain,
          destinationChainProvider,
          taskPayloadExtrinsic,
          schedule,
          keyPair,
        });
      }
    },
    transfer: ( sourceChain: ChainProvider, destinationChain: ChainProvider, { asset, assetAmount } : { asset: Asset, assetAmount: BN }): void => {
      // TODO
      // sourceChain.transfer(destinationChain, asset, assetAmount);
    },
  }
};
