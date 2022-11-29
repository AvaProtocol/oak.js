import { WsProvider, ApiPromise } from '@polkadot/api';
import { rpc, types, runtime } from '@oak-foundation/types'; 
import '@oak-foundation/api-augment'; 

import { OakChainWebsockets } from './constants'

export const getPolkadotApi = async (chain: OakChains, options: { providerUrl: string | undefined}) => {
  const { providerUrl } = options || {};
  const wsProvider = new WsProvider(providerUrl || OakChainWebsockets[chain]);

  const api = await ApiPromise.create({ provider: wsProvider, rpc, types, runtime });
  return api;
}
