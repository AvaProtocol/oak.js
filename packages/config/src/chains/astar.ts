import _ from 'lodash';
import BN from 'bn.js';
import { Chain } from '@oak-network/sdk-types';
import { assets } from '../assets';
import { ChainAsset, Weight } from '@oak-network/sdk-types';

// Shibuya
const sbyAsset = new ChainAsset({ asset: assets.sby, isNative: true });
const shibuyaAssets = [sbyAsset];
export const shibuya = new Chain({
  key: 'shibuya',
  assets: shibuyaAssets,
  defaultAsset: sbyAsset,
  endpoint: 'ws://127.0.0.1:9948',
  network: 'rococo',
  relayChain: 'local',
  instructionWeight: new Weight(new BN('1000000000'), new BN(64 * 1024)),
});

// Rocstar
const rstrAsset = new ChainAsset({ asset: assets.rstr, isNative: true });
const rocstarAssets = [rstrAsset];
export const rocstar = new Chain({
  key: 'rocstar',
  assets: rocstarAssets,
  defaultAsset: rstrAsset,
  endpoint: 'wss://rocstar.astar.network',
  network: 'rococo',
  relayChain: 'rococo',
  instructionWeight: new Weight(new BN('1000000000'), new BN(64 * 1024)),
});

// Shiden
const sdnAsset = new ChainAsset({ asset: assets.sdn, isNative: true });
const shidenAssets = [sdnAsset];
export const shiden = new Chain({
  key: 'shiden',
  assets: shidenAssets,
  defaultAsset: sdnAsset,
  network: 'kusama',
  endpoint: 'wss://shiden-rpc.dwellir.com',
  relayChain: 'kusama',
  instructionWeight: new Weight(new BN('1000000000'), new BN(64 * 1024)),
});
