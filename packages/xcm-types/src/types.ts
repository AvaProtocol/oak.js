import BN from 'bn.js';
import type { Weight, Extrinsic } from '@polkadot/types/interfaces';

export interface TransactInfo {
  encodedCall: Extrinsic,
  encodedCallWeight: Weight,
  overallWeight: Weight,
  fee: BN,
}
