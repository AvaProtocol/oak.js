import _ from "lodash";
import { u8aToHex, hexToU8a } from "@polkadot/util";
import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { HexString } from "@polkadot/util/types";
import { TypeRegistry } from "@polkadot/types";
import { blake2AsU8a, encodeAddress, decodeAddress } from "@polkadot/util-crypto";
import { isAddress as isEthereumAddress } from "web3-validator";
import BN from "bn.js";
import { AccountType, SendExtrinsicResult } from "./types";

/**
 * Send extrinsic
 * @param api Polkadot API
 * @param extrinsic The extrinsic that needs to be sent
 * @param keyringPair Operator's keyring pair
 * @param options Operation options: { isSudo = false }
 * @returns Operation result: {events, blockHash}
 */
export const sendExtrinsic = async (
  api: ApiPromise,
  extrinsic: SubmittableExtrinsic<"promise">,
  keyringPair: KeyringPair,
  { isSudo = false } = {},
): Promise<SendExtrinsicResult> =>
  new Promise<SendExtrinsicResult>((resolve) => {
    const newExtrinsic = isSudo ? api.tx.sudo.sudo(extrinsic) : extrinsic;
    newExtrinsic.signAndSend(keyringPair, { nonce: -1 }, ({ status, events }: any) => {
      console.log("status.type", status.type);
      if (status.isInBlock || status.isFinalized) {
        events
          // find/filter for failed events
          .filter(({ event }: any) => api.events.system.ExtrinsicFailed.is(event))
          // we know that data for system.ExtrinsicFailed is
          // (DispatchError, DispatchInfo)
          .forEach(
            ({
              event: {
                data: [error],
              },
            }: {
              event: any;
            }) => {
              if (error.isModule) {
                // for module errors, we have the section indexed, lookup
                const decoded = api.registry.findMetaError(error.asModule);
                const { docs, method, section } = decoded;
                console.log(`${section}.${method}: ${docs.join(" ")}`);
              } else {
                // Other, CannotLookup, BadOrigin, no extra info
                console.log(error.toString());
              }
            },
          );

        if (status.isFinalized) {
          resolve({ blockHash: status.asFinalized.toString(), events });
        }
      }
    });
  });

/**
 * Calculate the derivative account ID of a certain account ID
 * @param api Polkadot API
 * @param accountId
 * @param paraId The paraId of the XCM message sender
 * @param options Optional operation options: { locationType = 'XcmV2MultiLocation', network = 'Any' }
 * @returns Derivative account
 */
export const getDerivativeAccountV2 = (
  api: ApiPromise,
  accountId: HexString,
  paraId: number,
  { locationType = "XcmV2MultiLocation", network = "Any" } = {},
): HexString => {
  const account = hexToU8a(accountId).length === 20 ? { AccountKey20: { key: accountId, network } } : { AccountId32: { id: accountId, network } };

  const location = {
    interior: { X2: [{ Parachain: paraId }, account] },
    parents: 1,
  };
  const multilocation = api.createType(locationType, location);
  const toHash = new Uint8Array([...new Uint8Array([32]), ...new TextEncoder().encode("multiloc"), ...multilocation.toU8a()]);

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
  const accountType = hexToU8a(accountId).length === 20 ? "AccountKey20" : "AccountId32";
  const decodedAddress = hexToU8a(accountId);

  // Calculate Hash Component
  const registry = new TypeRegistry();
  const toHash = new Uint8Array([
    ...new TextEncoder().encode("SiblingChain"),
    ...registry.createType("Compact<u32>", paraId).toU8a(),
    ...registry.createType("Compact<u32>", accountType.length + hexToU8a(accountId).length).toU8a(),
    ...new TextEncoder().encode(accountType),
    ...decodedAddress,
  ]);

  return u8aToHex(blake2AsU8a(toHash).slice(0, deriveAccountType === AccountType.AccountKey20 ? 20 : 32));
};

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
  const sectionCount = parseInt(key.substring(1), 10);
  if (sectionCount === 1) {
    return { interior: "Here", parents: 0 };
  }
  const newInterior: Record<string, any> = {};
  const newArray = interior[key].filter((item: any) => !_.has(item, "Parachain"));
  if (newArray.length > 0) {
    const newXKey = `X${newArray.length}`;
    newInterior[newXKey] = newArray.length === 1 ? newArray[0] : newArray;
  }
  return { interior: newInterior, parents: 0 };
}

function isSubstrateAddress(address: string) {
  try {
    encodeAddress(decodeAddress(address));

    return true;
  } catch (e) {
    // ignore error
  }

  return false;
}

export function isValidAddress(address: string, isEthereum: boolean) {
  return isEthereum ? isEthereumAddress(address) : isSubstrateAddress(address);
}

/**
 * Return a BN object for the power of 10, for example getDecimalBN(10) returns new BN(10,000,000,000)
 * @param {*} decimals The decimals number of a token
 */
export function getDecimalBN(decimals: number | string) {
  const base = new BN(10, 10);
  const power = new BN(decimals, 10);
  return base.pow(power);
}
