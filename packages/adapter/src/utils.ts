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
import { MultiLocationV2 } from "@polkadot/types/interfaces";
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

  const multiLocation = api.createType(locationType, location) as MultiLocationV2;

  if (!multiLocation) {
    throw new Error("multiLocation is undefined");
  }

  // Convert Uint8Array to an array before spreading
  const prefixArray = Array.from(new Uint8Array([32]));
  const multilocArray = Array.from(new TextEncoder().encode("multiloc"));
  const multiLocationArray = Array.from(multiLocation.toU8a());

  // Concatenate arrays without using spread syntax on Uint8Array
  const toHash = new Uint8Array([...prefixArray, ...multilocArray, ...multiLocationArray]);

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

  // Convert Uint8Array to regular arrays before using spread syntax
  const encodedSiblingChain = Array.from(new TextEncoder().encode("SiblingChain"));
  const encodedParaId = Array.from(registry.createType("Compact<u32>", paraId).toU8a());
  const encodedAccountLength = Array.from(registry.createType("Compact<u32>", accountType.length + decodedAddress.length).toU8a());
  const encodedAccountType = Array.from(new TextEncoder().encode(accountType));
  const encodedAddress = Array.from(decodedAddress);

  const toHash = new Uint8Array([...encodedSiblingChain, ...encodedParaId, ...encodedAccountLength, ...encodedAccountType, ...encodedAddress]);

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

/**
 * Determine the account type based on the address.
 * Because 1 byte takes 2 characters in hex string, we can use the length of the address to determine the address type.
 * For example:
 * Substrate ss58 address: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY
 * We can compute its accountId32 through decodeAddress(address):
 * [
 *    212, 53, 147, 199,  21, 253, 211,  28,
 *     97, 20,  26, 189,   4, 169, 159, 214,
 *    130, 44, 133,  88, 133,  76, 205, 227,
 *    154, 86, 132, 231, 165, 109, 162, 125
 * ],
 * And convert the bytes to a hex string with 0x prefix through u8atoHex(accountId32):
 * 0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d
 * The length of prefix 0x is 2 and the length of accountId32 is 64(32*2), so the length of the hex string is 66(64+2).
 * AccountKey20: 40(20*2) characters without prefix 0x.
 * AccountId32: 64(32*2) characters without prefix 0x.
 * @param address The address to identify the account type.
 * @returns The account type.
 */
export function getAccountTypeFromAddress(address: HexString): AccountType {
  // Remove the prefix 0x
  const addressWithoutPrefix = address.substring(2);
  switch (addressWithoutPrefix.length) {
    case 40:
      return AccountType.AccountKey20;
    case 64:
      return AccountType.AccountId32;
    default:
      throw new Error("Unrecognized address format");
  }
}
