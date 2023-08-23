import util from 'node:util';
import BN from 'bn.js';
import type { Extrinsic } from '@polkadot/types/interfaces';

export type relayChainType = 'local' | 'rococo' | 'moonbase-alpha-relay' | 'kusama' | 'polkadot';

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
    return new Weight(this.refTime.add(weight.refTime), this.proofSize.add(weight.proofSize));
  }

  [util.inspect.custom]() {
    const { refTime, proofSize } = this;
    return `Weight { refTime: ${refTime.toString()}, proofSize: ${proofSize.toString()} }`;
  }
}
