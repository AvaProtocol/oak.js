import * as astarChains from './astar';
import * as mangataChains from './astar';
import * as moonbeamChains from './moonbeam';
import * as oakChains from './oak';

export const chains = { ...astarChains, ...mangataChains, ...moonbeamChains, ...oakChains };
