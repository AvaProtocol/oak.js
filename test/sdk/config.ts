import { Chain }  from '@oak-network/sdk-types';
import { chains } from '@oak-network/config';

export interface ChainPairConfig {
  key: string,
  oakConfig: Chain,
  peerConfig: Chain,
}

export const chainPairConfigs: ChainPairConfig[] = [
  {
    key: 'mangata-dev',
    oakConfig: chains.turingLocal,
    peerConfig: chains.mangataLocal,
  },
  {
    key: 'astar-dev',
    oakConfig: chains.turingLocal,
    peerConfig: chains.shibuya,
  },
  {
    key: 'moonbeam-dev',
    oakConfig: chains.turingLocal,
    peerConfig: chains.moonbaseLocal,
  },
  {
    key: 'mangata-staging',
    oakConfig: chains.turingStaging,
    peerConfig: chains.mangataRococo,
  },
  {
    key: 'astar-staging',
    oakConfig: chains.turingStaging,
    peerConfig: chains.rocstar,
  },
  {
    key: 'moonbeam-staging',
    oakConfig: chains.turingMoonbase,
    peerConfig: chains.moonbaseAlpha,
  }
];
