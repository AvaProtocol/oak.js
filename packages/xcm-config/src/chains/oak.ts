import _ from 'lodash';
import BN from 'bn.js';
import { Chain } from '@oak-foundation/xcm-types';
import { assets } from '../assets';
import { ChainAsset, Weight } from '@oak-foundation/xcm-types';

// turing-local
const turAsset = new ChainAsset({ asset: assets.tur, isNative: true });
const moonbaseAlphaAsset = new ChainAsset({ asset: assets.moonbaseAlpha, isNative: false });
const turingRococoAssets = [turAsset, moonbaseAlphaAsset];
export const turingLocal = new Chain({
	assets: turingRococoAssets,
	endpoint: 'ws://127.0.0.1:9946',
	instructionWeight: new Weight(new BN('1000000000'), new BN(0)),
});

// turing-staging
export const turingStaging = new Chain({
	assets: turingRococoAssets,
	endpoint: 'wss://rpc.turing-staging.oak.tech',
	instructionWeight: new Weight(new BN('1000000000'), new BN('0')),
});

// turing-moonbase
export const turingMoonbase = new Chain({
	assets: turingRococoAssets,
	endpoint: 'ws://167.99.226.24:8846',
	instructionWeight: new Weight(new BN('1000000000'), new BN('0')),
});

// turing-kusama
const turingKusamaAssets = [ turAsset, moonbaseAlphaAsset ];
export const turing = new Chain({
	assets: turingKusamaAssets,
	endpoint: 'wss://rpc.turing.oak.tech',
	instructionWeight: new Weight(new BN('1000000000'), new BN('0')),
});
