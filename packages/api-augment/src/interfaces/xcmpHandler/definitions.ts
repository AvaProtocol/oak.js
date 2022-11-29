import { Definitions } from '@polkadot/types/types';
import { runtime } from './runtime';

const xcmpHandler =  {
  rpc: {
    crossChainAccount: {
      description: 'Find xcmp account id',
      params: [
        { name: 'accountId', type: 'AccountId32' }
      ],
      type: 'AccountId32',
    },
    fees: {
      description: 'Determine fees for a scheduled xcmp task',
      params: [
        { name: 'encodedXt', type: 'Bytes' },
      ],
      type: 'u64',
    }
  },
  types: {},
  runtime,
}
export default xcmpHandler as Definitions
