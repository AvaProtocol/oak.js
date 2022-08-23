import { rpc as oakRpc, types as oakTypes } from '@oak-foundation/types'
import { ApiOptions } from '@polkadot/api/types';

export const options = ({
  types = {},
  rpc = {},
  typesBundle = {},
  ...otherOptions
}: ApiOptions = {}): ApiOptions => ({
  rpc: {
    ...rpc,
    ...oakRpc
  },
  types: {
    ...types,
    ...oakTypes
  },
  ...otherOptions
})
