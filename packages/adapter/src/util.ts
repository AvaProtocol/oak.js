import _ from 'lodash';
import { u8aToHex, hexToU8a } from '@polkadot/util';
import { ApiPromise } from '@polkadot/api';
import { KeyringPair } from '@polkadot/keyring/types';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { HexString } from '@polkadot/util/types';
import { TypeRegistry } from '@polkadot/types';
import { blake2AsU8a } from '@polkadot/util-crypto';
import { AccountType, SendExtrinsicResult } from './types';

/**
 * Send extrinsic
 * @param api Polkadot API
 * @param extrinsic The extrinsic that needs to be sent
 * @param keyringPair Operator's keychain pair
 * @param options Operation options: { isSudo = false }
 * @returns Operation result: {events, blockHash}
 */
export const sendExtrinsic = async (
  api: ApiPromise,
  extrinsic: SubmittableExtrinsic<'promise'>,
  keyringPair: KeyringPair,
  { isSudo = false } = {}
): Promise<SendExtrinsicResult> => {
  return new Promise<SendExtrinsicResult>((resolve) => {
    const newExtrinsic = isSudo ? api.tx.sudo.sudo(extrinsic) : extrinsic;
    newExtrinsic.signAndSend(keyringPair, { nonce: -1 }, ({ status, events } : any) => {
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

/**
 * Calculate the derivative account ID of a certain account ID
 * @param api Polkadot API
 * @param accountId 
 * @param paraId The paraId of the XCM message sender
 * @param options Operation options: { locationType = 'XcmV2MultiLocation', network = 'Any' }
 * @returns Derivative account
 */
export const getDerivativeAccountV2 = (api: ApiPromise, accountId: HexString, paraId: number, { locationType = 'XcmV2MultiLocation', network = 'Any' } = {}): HexString => {
  const account = hexToU8a(accountId).length == 20
    ? { AccountKey20: { network, key: accountId } }
    : { AccountId32: { network, id: accountId } };

  const location = {
    parents: 1,
    interior: { X2: [{ Parachain: paraId },  account] },
  };
  const multilocation = api.createType(locationType, location);
  const toHash = new Uint8Array([
    ...new Uint8Array([32]),
    ...new TextEncoder().encode('multiloc'),
    ...multilocation.toU8a(),
  ]);

  return u8aToHex(api.registry.hash(toHash).slice(0, 32));
};

/**
 * Calculate the derivative account ID of a certain account ID
 * @param accountId 
 * @param paraId The paraId of the XCM message sender
 * @param deriveAccountType Specify the derive account type returned by the function
 * @returns Derivative account
 */
export const getDerivativeAccountV3 = (accountId: HexString, paraId: number, deriveAccountType: AccountType = AccountType.AccountId32): HexString => {
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

  return u8aToHex(blake2AsU8a(toHash).slice(0, deriveAccountType === AccountType.AccountKey20 ? 20 : 32));
}

/**
 * Convert absolute location to relative location
 * For example:
 * { parents: 1: interior: { X2: [{ Parachain: 2000 }, { PalletInstance: 3}] }} => { parents: 0, interior: { X1: { PalletInstance: 3 } } }
 * { parents: 1: interior: { X1: { Parachain: 2114 } } => { parents: 0, interior: 'Here' }
 * @param absoluteLocation 
 * @returns Relative location
 */
export function convertAbsoluteLocationToRelative(absoluteLocation: any): any {
  const { interior } = absoluteLocation;
  const key = _.keys(interior)[0] as string;
  const sectionCount = parseInt(key.substring(1));
  if (sectionCount === 1) {
    return { parents: 0, interior: 'Here' };
  } else {
    const newInterior: Record<string, any> = {};
    const newArray = interior[key].filter((item: any) => !item.hasOwnProperty('Parachain'));
    if (newArray.length > 0) {
      const newXKey = 'X' + newArray.length;
      newInterior[newXKey] = newArray.length === 1 ? newArray[0] : newArray;
    }
    return { parents: 0, interior: newInterior };
  }
}
