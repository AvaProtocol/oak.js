import { jsonrpcFromDefs, typesFromDefs } from '@open-web3/orml-type-definitions/utils';

import automationTime from './automationTime'
import xcmpHandler from './xcmpHandler'

export * from './automationTime'
export * from './xcmpHandler'

export const definitions = {
  automationTime,
  xcmpHandler
}

export const types = typesFromDefs(definitions);
export const rpc = jsonrpcFromDefs(definitions);
