import { Asset } from '@oak-network/xcm-types';

const tur = new Asset({
  key: 'tur',
  symbol: 'TUR',
  decimals: 10,
	location: { parents: 1, interior: { X1: { Parachain: 2114 } } }
});

const moonbaseLocal = new Asset({
  key: 'moonbase-local',
  symbol: 'UNIT',
  decimals: 18,
	location: { parents: 1, interior: { X2: [{ Parachain: 1000 }, { PalletInstace: 3 }] } }
});

const moonbaseAlpha = new Asset({
  key: 'moonbase-alpha',
  symbol: 'DEV',
  decimals: 18,
	location: { parents: 1, interior: { X2: [{ Parachain: 1000 }, { PalletInstace: 3 }] } }
});

const glmr = new Asset({
  key: 'glmr',
  symbol: 'GLMR',
  decimals: 18,
	location: { parents: 1, interior: { X2: [{ Parachain: 2023 }, { PalletInstace: 10 }] } }
});

const sby = new Asset({
  key: 'shibuya',
  symbol: 'SBY',
  decimals: 18,
  location: { parents: 1, interior: { X1: { Parachain: 2000 } } },
});

const rstr = new Asset({
  key: 'rocstar',
  symbol: 'RSTR',
  decimals: 18,
  location: { parents: 1, interior: { X1: { Parachain: 2006 } } },
});

const sdn = new Asset({
  key: 'shiden',
  symbol: 'SDN',
  decimals: 18,
  location: { parents: 1, interior: { X1: { Parachain: 2007 } } },
});

const mgr = new Asset({
  key: 'mangata-rococo',
  symbol: 'MGR',
  decimals: 18,
  location: { parents: 1, interior: { X1: { Parachain: 2110 } } },
});

const mgx = new Asset({
  key: 'mangata-kusama',
  symbol: 'MGX',
  decimals: 18,
  location: { parents: 1, interior: { X1: { Parachain: 2110 } } },
});

export const assets = { tur, moonbaseLocal, moonbaseAlpha, glmr, sby, rstr, sdn, mgr, mgx };
