import { u8aToHex, hexToU8a } from '@polkadot/util';
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import { EventRecord } from '@polkadot/types/interfaces';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { HexString } from '@polkadot/util/types';
import { TypeRegistry } from '@polkadot/types';
import { blake2AsU8a } from '@polkadot/util-crypto';

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

export const getDeriveAccount = (api: ApiPromise, accountId: HexString, paraId: number): HexString => {
  const network = 'Any'
  const account = hexToU8a(accountId).length == 20
    ? { AccountKey20: { network, key: accountId } }
    : { AccountId32: { network, id: accountId } };

  const location = {
    parents: 1,
    interior: { X2: [{ Parachain: paraId },  account] },
  };
  const multilocation = api.createType('XcmV2MultiLocation', location);
  const toHash = new Uint8Array([
    ...new Uint8Array([32]),
    ...new TextEncoder().encode('multiloc'),
    ...multilocation.toU8a(),
  ]);

  return u8aToHex(api.registry.hash(toHash).slice(0, 32));
};

type AccountType = 'AccountKey20' | 'AccountId32';
export const getDeriveAccountV3 = (accountId: string, paraId: number, deriveAccountType: AccountType = 'AccountId32'): HexString => {
  const accountType = hexToU8a(accountId).length == 20 ? 'AccountKey20' : 'AccountId32';
  const decodedAddress = hexToU8a(accountId);

  // Calculate Hash Component
  const registry = new TypeRegistry();
  const toHash = new Uint8Array([
      ...new TextEncoder().encode('SiblingChain'),
      ...registry.createType('Compact<u32>', paraId).toU8a(),
      ...registry.createType('Compact<u32>', accountType.length + hexToU8a(accountId).length).toU8a(),
      ...new TextEncoder().encode(accountType),
      ...decodedAddress,
  ]);

  return u8aToHex(blake2AsU8a(toHash).slice(0, deriveAccountType === 'AccountKey20' ? 20 : 32));
}