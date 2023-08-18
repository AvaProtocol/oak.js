import _ from 'lodash';
import BN from 'bn.js';
import { Chain } from '@oak-foundation/xcm-types';
import { assets } from '../assets';
import { ChainAsset, Weight } from '@oak-foundation/xcm-types';

// mangata-local
const mgrnAsset = new ChainAsset({ asset: assets.mgr, isNative: true });
const turAsset = new ChainAsset({ asset: assets.tur, isNative: false });
const mangataRococoAssets = [mgrnAsset, turAsset];
export const mangataLocal = new Chain({
	assets: mangataRococoAssets,
	endpoint: 'ws://127.0.0.1:9947',
	instructionWeight: new Weight(new BN('150000000'), new BN('0')),
});

// mangata-rococo
export const mangataRococo = new Chain({
	assets: mangataRococoAssets,
	endpoint: 'wss://collator-01-ws-rococo.mangata.online',
	instructionWeight: new Weight(new BN('150000000'), new BN('0')),
});

// mangata-kusama
const mgxAsset = new ChainAsset({ asset: assets.mgx, isNative: true });
const mangataKusamaAssets = [mgxAsset, turAsset];
export const mangataKusama = new Chain({
	assets: mangataKusamaAssets,
	endpoint: 'wss://kusama-rpc.mangata.online',
	instructionWeight: new Weight(new BN('150000000'), new BN('0')),
});
