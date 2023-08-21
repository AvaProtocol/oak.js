import _ from 'lodash';
import BN from 'bn.js';
import { Chain } from '@oak-foundation/xcm-types';
import { assets } from '../assets';
import { ChainAsset, Weight } from '@oak-foundation/xcm-types';

// Shibuya
const sbyAsset = new ChainAsset({ asset: assets.sby, isNative: true });
const shibuyaAssets = [sbyAsset];
export const shibuya = new Chain({
	assets: shibuyaAssets,
	defaultAsset: sbyAsset,
	endpoint: 'ws://127.0.0.1:9948',
	instructionWeight: new Weight(new BN('1000000000'), new BN(64 * 1024)),
});

// Rocstar
const rstrAsset = new ChainAsset({ asset: assets.rstr, isNative: true });
const rocstarAssets = [rstrAsset];
export const rocstar = new Chain({
	assets: rocstarAssets,
	defaultAsset: rstrAsset,
	endpoint: 'wss://rocstar.astar.network',
	instructionWeight: new Weight(new BN('1000000000'), new BN(64 * 1024)),
});

// Shiden
const sdnAsset = new ChainAsset({ asset: assets.sdn, isNative: true });
const shidenAssets = [sdnAsset];
export const shiden = new Chain({
	assets: shidenAssets,
	defaultAsset: sdnAsset,
	endpoint: 'wss://shiden-rpc.dwellir.com',
	instructionWeight: new Weight(new BN('1000000000'), new BN(64 * 1024)),
});
