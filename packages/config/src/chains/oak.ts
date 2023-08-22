import _ from 'lodash';
import BN from 'bn.js';
import { Chain } from '@oak-network/sdk-types';
import { assets } from '../assets';
import { ChainAsset, Weight } from '@oak-network/sdk-types';

// turing-local
const turAsset = new ChainAsset({ asset: assets.tur, isNative: true });
const moonbaseAlphaAsset = new ChainAsset({ asset: assets.moonbaseAlpha, isNative: false });
const turingRococoAssets = [turAsset, moonbaseAlphaAsset];
export const turingLocal = new Chain({
	key: 'turing-local',
	assets: turingRococoAssets,
	defaultAsset: turAsset,
	endpoint: 'ws://127.0.0.1:9946',
	relayChain: 'local',
	instructionWeight: new Weight(new BN('1000000000'), new BN(0)),
});

// turing-staging
export const turingStaging = new Chain({
	key: 'turing-staging',
	assets: turingRococoAssets,
	defaultAsset: turAsset,
	relayChain: 'rococo',
	endpoint: 'wss://rpc.turing-staging.oak.tech',
	instructionWeight: new Weight(new BN('1000000000'), new BN('0')),
});

// turing-moonbase
export const turingMoonbase = new Chain({
	key: 'turing-moonbase',
	assets: turingRococoAssets,
	defaultAsset: turAsset,
	relayChain: 'moonbase-alpha-relay',
	endpoint: 'ws://167.99.226.24:8846',
	instructionWeight: new Weight(new BN('1000000000'), new BN('0')),
});

// turing-kusama
const turingKusamaAssets = [ turAsset, moonbaseAlphaAsset ];
export const turing = new Chain({
	key: 'turing',
	assets: turingKusamaAssets,
	defaultAsset: turAsset,
	endpoint: 'wss://rpc.turing.oak.tech',
	relayChain: 'local',
	instructionWeight: new Weight(new BN('1000000000'), new BN('0')),
});
