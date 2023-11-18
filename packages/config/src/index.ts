// Importing the variables from the respective files
import { DevTokens, MoonbaseTokens, RococoTokens, KusamaTokens, PolkadotTokens } from "./tokens";
import { devChains, moonbaseChains, rococoChains, kusamaChains, polkadotChains } from "./chains";

// Exporting them as objects within an object
export const tokens = { DevTokens, MoonbaseTokens, RococoTokens, KusamaTokens, PolkadotTokens };
export const chains = { devChains, moonbaseChains, rococoChains, kusamaChains, polkadotChains };
