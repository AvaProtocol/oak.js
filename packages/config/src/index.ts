// Importing variables
import {
  DevChains,
  MoonbaseChains,
  RococoChains,
  KusamaChains,
  PolkadotChains,
  Weight,
} from "./chains";
import {
  XToken,
  DevTokens,
  MoonbaseTokens,
  RococoTokens,
  KusamaTokens,
  PolkadotTokens,
} from "./tokens";
import { XcmInstructionNetworkType } from "./chains/types/XcmInstructionNetworkType";

// Importing types
import type { Chain, XcmConfig } from "./chains";

// Exporting variables as objects within tokens and chains
export const chains = {
  DevChains,
  KusamaChains,
  MoonbaseChains,
  PolkadotChains,
  RococoChains,
};
export const tokens = {
  DevTokens,
  KusamaTokens,
  MoonbaseTokens,
  PolkadotTokens,
  RococoTokens,
};

export { XToken, Weight, XcmInstructionNetworkType };

// Exporting types
export type { Chain, XcmConfig };
