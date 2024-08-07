import _ from "lodash";

const bitsInByte = 8;

/**
 * convert number to hex string
 * @param number The number to be converted
 * @param bytes The bytes of the number
 * @returns
 */
const numberToHex = (number: number, bytes: number) => {
  let hexString = number.toString(16);
  let len = hexString.length;
  const charactersLen = bytes * 2;
  while (len < charactersLen) {
    hexString = `0${hexString}`;
    len += 1;
  }
  return `${hexString}`;
};

/**
 * Convert parachain(4 bytes) field value to hex string
 * @param value The parachain field value
 * @returns Hex string
 */
const convertParachainFieldValue = (value: { Parachain: number }) => numberToHex(value.Parachain, 4);

/**
 * Convert pallet instance(1 byte) field value to hex string
 * @param value The pallet instance field value
 * @returns Hex string
 */
const convertPalletInstanceFieldValue = (value: { PalletInstance: number }) => numberToHex(value.PalletInstance, 1);

/**
 * Convert general index(u128) field value to hex string
 * @param value The general index field value
 * @returns Hex string
 */
const convertGeneralIndexFieldValue = (value: { GeneralIndex: number }) => numberToHex(value.GeneralIndex, 128 / bitsInByte);

/**
 * Convert general key field value to hex string
 * @param value The general key field value
 * @returns Hex string
 */
const convertGeneralKeyFieldValue = (value: { GeneralKey: { length: number; data: string } }) => value.GeneralKey.data.substring(2);

// eslint-disable-next-line sort-keys
const networks: Record<string, string> = { Any: "00", Rococo: "01", Kusama: "02", Polkadot: "03" };

/**
 * Convert AccountId32(32 bytes)  to hex string
 * @param value The AccountId32 value
 * @returns Hex string
 */
const convertAccountId32FieldValue = (value: { AccountId32: { id: string }; Network?: string | null }) => {
  const {
    AccountId32: { id },
    Network,
  } = value;
  return `${id.substring(2)}${networks[Network || "Any"]}`;
};

/**
 * Convert AccountKey20(20 bytes) to hex string
 * @param value The AccountKey20 value
 * @returns Hex string
 */
const convertAccountKey20FieldValue = (value: { AccountKey20: { key: string }; Network?: string | null }) => {
  const {
    AccountKey20: { key },
    Network,
  } = value;
  return `${key.substring(2)}${networks[Network || "Any"]}`;
};

/**
 * Convert AccountIndex64(u64) to hex string
 * @param value The AccountIndex64 value
 * @returns Hex string
 */
const convertAccountIndex64FieldValue = (value: { AccountIndex64: { index: number }; Network?: string | null }) => {
  const {
    AccountIndex64: { index },
    Network,
  } = value;
  return `${numberToHex(index, 64 / bitsInByte)}${networks[Network || "Any"]}`;
};

const prefixs: any = [
  { handleFunc: convertParachainFieldValue, prefix: "0x00", selector: "Parachain" },
  { handleFunc: convertAccountId32FieldValue, prefix: "0x01", selector: "AccountId32" },
  { handleFunc: convertAccountIndex64FieldValue, prefix: "0x02", selector: "AccountIndex64" },
  { handleFunc: convertAccountKey20FieldValue, prefix: "0x03", selector: "AccountKey20" },
  { handleFunc: convertPalletInstanceFieldValue, prefix: "0x04", selector: "PalletInstance" },
  { handleFunc: convertGeneralIndexFieldValue, prefix: "0x05", selector: "GeneralIndex" },
  { handleFunc: convertGeneralKeyFieldValue, prefix: "0x06", selector: "GeneralKey" },
];

/**
 * Convert location to precompile multi location
 * Docs:
 * https://docs.moonbeam.network/builders/interoperability/xcm/core-concepts/multilocations/
 * https://docs.moonbeam.network/builders/interoperability/xcm/xc20/send-xc20s/xtokens-precompile/
 * @param location The location to be converted
 * @returns Precompile multi location
 */
export const convertLocationToPrecompileMultiLocation = (location: any): any => {
  const { parents, interior } = location;
  const interiors: string[] = [];
  const precompileLocation = [parents, interiors];
  if (interior === "Here") {
    return precompileLocation;
  }
  const interiorKey = _.keys(interior)[0];
  const fields = interiorKey === "X1" ? [interior.X1] : interior[interiorKey];
  _.each(fields, (field) => {
    const selector = _.find(_.keys(field), (key) => _.find(prefixs, { selector: key }));
    const { prefix, handleFunc } = _.find(prefixs, { selector });
    interiors.push(prefix + handleFunc(field));
  });

  return precompileLocation;
};
