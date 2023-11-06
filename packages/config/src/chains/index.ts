import { Chain, XcmConfig } from "./types/Chain";
import { Weight } from "./types/Weight";
import devChains from "./dev";
import kusamaChains from "./kusama";
import polkadotChains from "./polkadot";
import rococoChains from "./rococo";
import moonbaseChains from "./moonbase";

export { devChains, moonbaseChains, rococoChains, kusamaChains, polkadotChains };
export type { Chain, XcmConfig, Weight };
