import BN from "bn.js";

const MAX_NUMBER_BITS = 52;
/**
 * convert bn number to number or hexstring
 * Reference: https://github.com/polkadot-js/api/blob/a22a111f7228e80e03bc75298347dbd184c5630b/packages/types-codec/src/abstract/Int.ts#L221
 * @param bn
 * @returns number or hexstring
 */
const convertBNtoNumber = (bn: BN): number | string =>
  bn.bitLength() > MAX_NUMBER_BITS ? `0x${bn.toString(16)}` : bn.toNumber();

export class Weight {
  refTime: BN;
  proofSize: BN;

  constructor(refTime: BN, proofSize: BN) {
    this.refTime = refTime;
    this.proofSize = proofSize;
  }

  public muln(n: number): Weight {
    return new Weight(this.refTime.muln(n), this.proofSize.muln(n));
  }

  public add(weight: Weight): Weight {
    return new Weight(
      this.refTime.add(weight.refTime),
      this.proofSize.add(weight.proofSize),
    );
  }

  toString() {
    const { refTime, proofSize } = this;
    return `Weight { refTime: ${refTime.toString()}, proofSize: ${proofSize.toString()} }`;
  }

  toJSON() {
    const { refTime, proofSize } = this;
    return {
      proofSize: convertBNtoNumber(proofSize),
      refTime: convertBNtoNumber(refTime),
    };
  }
}
