import { WsProvider, ApiPromise } from '@polkadot/api';
import { rpc, types } from '@oak-foundation/types'; 

import { OakChainWebsockets } from './constants'

export const getPolkadotApi = async (chain: OakChains, options: { providerUrl: string | undefined}) => {
  const { providerUrl } = options || {};
  const wsProvider = new WsProvider(providerUrl || OakChainWebsockets[chain]);
  const api = await ApiPromise.create({ provider: wsProvider, rpc, types });
  return api;
}
