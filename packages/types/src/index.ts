import { jsonrpcFromDefs, typesFromDefs } from '@open-web3/orml-type-definitions/utils';

import automationTime from './automationTime.js'
import xcmpHandler from './xcmpHandler.js'

export * from './automationTime.js'
export * from './xcmpHandler.js'

const extractFromDefs = (defs: any, keyItem: string) => {
  const items: Record<string, any> = {};
  Object.values(defs).forEach((definition: any) => {
    const entries = Object.entries(definition[keyItem]);
    entries.forEach(([key, value]) => {
      items[key] = value;
    })
  });
  return items;
}

export const definitions = {
  automationTime,
  xcmpHandler
}

export const types = typesFromDefs(definitions);
export const rpc = jsonrpcFromDefs(definitions);
export const runtime = extractFromDefs(definitions, 'runtime');
