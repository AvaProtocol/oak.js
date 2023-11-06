import * as astarChains from "./astar";
import * as mangataChains from "./mangata";
import * as moonbeamChains from "./moonbeam";
import * as oakChains from "./oak";
import { Chain, XcmConfig } from "./types/Chain";
import { Weight } from "./types/Weight";

const chains = {
	...astarChains,
	...mangataChains,
	...moonbeamChains,
	...oakChains,
};

export { chains };
export type { Chain, XcmConfig, Weight };
