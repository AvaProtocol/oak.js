import _ from 'lodash';
import BN from 'bn.js';
import { Chain } from '@oak-foundation/xcm-types';
import { assets } from '../assets';
import { ChainAsset, Weight } from '@oak-foundation/xcm-types';

const moonbaseAlphaAsset = new ChainAsset({ asset: assets.moonbaseAlpha, isNative: true });
const turAsset = new ChainAsset({ asset: assets.tur, isNative: false });
const moonbaseAssets = [moonbaseAlphaAsset, turAsset];

// moonbase-local
export const moonbaseLocal = new Chain({
	assets: moonbaseAssets,
	endpoint: 'ws://127.0.0.1:9949',
	instructionWeight: new Weight(new BN('250000000'), new BN('10000')),
});

// moonbase-alpha
export const moonbaseAlpha = new Chain({
	assets: moonbaseAssets,
	endpoint: 'wss://wss.api.moonbase.moonbeam.network',
	instructionWeight: new Weight(new BN('250000000'), new BN('10000')),
});
