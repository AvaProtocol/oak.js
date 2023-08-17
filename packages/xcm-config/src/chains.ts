import _ from 'lodash';
import { Chain } from '@oak-foundation/xcm-types';
import { local as localAssets } from '@oak-foundation/xcm-config';

const turAsset = _.find(localAssets, { key: 'tur' });
if (!turAsset) throw new Error('Asset not found');
export const turingLocal = new Chain([turAsset]);

const moonbaseLocalAsset = _.find(localAssets, { key: 'moonbase-local' });
if (!moonbaseLocalAsset) throw new Error('Asset not found');
export const moonbaseLocal = new Chain([moonbaseLocalAsset]);
