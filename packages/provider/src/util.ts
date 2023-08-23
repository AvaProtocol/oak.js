import { u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

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

export const getProxyAccount = (api: any, sourceParaId: any, address: any, { addressType = 'Substrate', locationType = 'XcmV2MultiLocation', network = 'Any' } = {}) => {
  const account = addressType === 'Ethereum'
    ? { AccountKey20: { network, key: address } }
    : { AccountId32: { network, id: u8aToHex(decodeAddress(address)) } }; // An Int array presentation of the address’ ss58 public key

  const location = {
    parents: 1, // from source parachain to target parachain
    interior: {
      X2: [
        { Parachain: sourceParaId },
        account,
      ],
    },
  };

  const multilocation = api.createType(locationType, location);

  const toHash = new Uint8Array([
    ...new Uint8Array([32]),
    ...new TextEncoder().encode('multiloc'),
    ...multilocation.toU8a(),
  ]);
  
  return {
    accountId32: u8aToHex(api.registry.hash(toHash).slice(0, 32)),
    accountKey20: u8aToHex(api.registry.hash(toHash).slice(0, 20)),
  };
};