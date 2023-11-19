// Importing variables
import { DevChains, MoonbaseChains, RococoChains, KusamaChains, PolkadotChains } from "./chains";
import { DevTokens, MoonbaseTokens, RococoTokens, KusamaTokens, PolkadotTokens } from "./tokens";

// Importing types
import type { Chain, XcmConfig, Weight } from "./chains";
import type { XToken } from "./tokens";;

// Exporting variables as objects within tokens and chains
export const chains = { DevChains, MoonbaseChains, RococoChains, KusamaChains, PolkadotChains };
export const tokens = { DevTokens, MoonbaseTokens, RococoTokens, KusamaTokens, PolkadotTokens };

// Exporting types
export type { Chain, XcmConfig, Weight };
export type { XToken };
