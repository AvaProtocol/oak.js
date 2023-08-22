import _ from 'lodash';
import BN from 'bn.js';
import { Chain } from '@oak-network/xcm-types';
import { assets } from '../assets';
import { ChainAsset, Weight } from '@oak-network/xcm-types';

// mangata-local
const mgrAsset = new ChainAsset({ asset: assets.mgr, isNative: true });
const mangataRococoAssets = [mgrAsset];
export const mangataLocal = new Chain({
	key: 'mangata-local',
	assets: mangataRococoAssets,
	defaultAsset: mgrAsset,
	endpoint: 'ws://127.0.0.1:9947',
	relayChain: 'local',
	instructionWeight: new Weight(new BN('150000000'), new BN('0')),
});

// mangata-rococo
export const mangataRococo = new Chain({
	key: 'mangata-rococo',
	assets: mangataRococoAssets,
	defaultAsset: mgrAsset,
	endpoint: 'wss://collator-01-ws-rococo.mangata.online',
	relayChain: 'rococo',
	instructionWeight: new Weight(new BN('150000000'), new BN('0')),
});

// mangata-kusama
const mgxAsset = new ChainAsset({ asset: assets.mgx, isNative: true });
const mangataKusamaAssets = [mgxAsset];
export const mangataKusama = new Chain({
	key: 'mangata-kusama',
	assets: mangataKusamaAssets,
	defaultAsset: mgxAsset,
	endpoint: 'wss://kusama-rpc.mangata.online',
	relayChain: 'rococo',
	instructionWeight: new Weight(new BN('150000000'), new BN('0')),
});
