import { u8aToHex, hexToU8a } from '@polkadot/util';
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { EventRecord } from '@polkadot/types/interfaces';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { HexString } from '@polkadot/util/types';

export interface SendExtrinsicResult {
  events: EventRecord[];
  blockHash: string;
}

export const sendExtrinsic = async (
  api: ApiPromise,
  extrinsic: SubmittableExtrinsic<'promise'>,
  keyPair: KeyringPair,
  { isSudo = false } = {}
): Promise<SendExtrinsicResult> => {
  return new Promise<SendExtrinsicResult>((resolve) => {
    const newExtrinsic = isSudo ? api.tx.sudo.sudo(extrinsic) : extrinsic;
    newExtrinsic.signAndSend(keyPair, { nonce: -1 }, ({ status, events } : any) => {
      console.log('status.type', status.type);
      if (status.isInBlock || status.isFinalized) {
        events
          // find/filter for failed events
          .filter(({ event } : any) => api.events.system.ExtrinsicFailed.is(event))
          // we know that data for system.ExtrinsicFailed is
          // (DispatchError, DispatchInfo)
          .forEach(({ event: { data: [error] } }: {event: any}) => {
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
};
