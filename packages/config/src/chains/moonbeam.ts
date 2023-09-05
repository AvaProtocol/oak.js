import BN from 'bn.js';
import { Chain } from '@oak-network/sdk-types';
import { assets } from '../assets';
import { ChainAsset, Weight } from '@oak-network/sdk-types';

const moonbaseAlphaAsset = new ChainAsset({ asset: assets.moonbaseAlpha, isNative: true });
const moonbaseAssets = [moonbaseAlphaAsset];

// moonbase-local
export const moonbaseLocal = new Chain({
  key: 'moonbase-local',
  assets: moonbaseAssets,
  defaultAsset: moonbaseAlphaAsset,
  endpoint: 'ws://127.0.0.1:9949',
  network: 'rococo',
  relayChain: 'local',
  instructionWeight: new Weight(new BN('250000000'), new BN('10000')),
});

// moonbase-alpha
export const moonbaseAlpha = new Chain({
  key: 'moonbase-alpha',
  assets: moonbaseAssets,
  defaultAsset: moonbaseAlphaAsset,
  endpoint: 'wss://wss.api.moonbase.moonbeam.network',
  network: 'rococo',
  relayChain: 'moonbase-alpha-relay',
  instructionWeight: new Weight(new BN('250000000'), new BN('10000')),
});

// moonriver
export const moonriver = new Chain({
  key: 'moonriver',
  assets: moonbaseAssets,
  defaultAsset: moonbaseAlphaAsset,
  network: 'kusama',
  relayChain: 'kusama',
  endpoint: 'wss://wss.api.moonriver.moonbeam.network',
  instructionWeight: new Weight(new BN('200000000'), new BN('10000')),
});
