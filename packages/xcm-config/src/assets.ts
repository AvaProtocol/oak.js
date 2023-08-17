import { Asset } from '@oak-foundation/xcm-types';

const turing = new Asset({
  key: 'tur',
  symbol: 'TUR',
	location: { parents: 1, interior: { X1: { parachain: 2114 } } }
});

const moonbaseLocal = new Asset({
  key: 'moonbase-local',
  symbol: 'UNIT',
	location: { parents: 1, interior: { X2: [{ Parachain: 1000 }, { PalletInstace: 3 }] } }
});

const moonbaseAlpha = new Asset({
  key: 'moonbase-alpha',
  symbol: 'DEV',
	location: { parents: 1, interior: { X2: [{ Parachain: 1000 }, { PalletInstace: 3 }] } }
});

const moonriver = new Asset({
  key: 'glmr',
  symbol: 'GLMR',
	location: { parents: 1, interior: { X2: [{ Parachain: 2023 }, { PalletInstace: 10 }] } }
});

const shibuya = new Asset({
  key: 'shibuya',
  symbol: 'SBY',
  location: { parents: 1, interior: { X1: { Parachain: 2000 } } },
});

const rocstar = new Asset({
  key: 'rocstar',
  symbol: 'RSTR',
  location: { parents: 1, interior: { X1: { Parachain: 2006 } } },
});

const shiden = new Asset({
  key: 'shiden',
  symbol: 'SDN',
  location: { parents: 1, interior: { X1: { Parachain: 2007 } } },
});

const mangataRococo = new Asset({
  key: 'mangata-rococo',
  symbol: 'MGR',
  location: { parents: 1, interior: { X1: { Parachain: 2110 } } },
});

const mangataKusama = new Asset({
  key: 'mangata-kusama',
  symbol: 'MGX',
  location: { parents: 1, interior: { X1: { Parachain: 2110 } } },
});

export const local = [turing, moonbaseLocal, shibuya, mangataRococo]
export const rococo = [turing, moonbaseAlpha, rocstar, mangataRococo];
export const kusama = [turing, moonriver, shiden, mangataKusama];
export const polkadot = [];
