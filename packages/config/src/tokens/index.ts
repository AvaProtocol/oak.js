import DevTokens from "./dev";
import MoonbaseTokens from "./moonbase";
import RococoTokens from "./rococo";
import KusamaTokens from "./kusama";
import PolkadotTokens from "./polkadot";
import { XToken } from "./types/XToken";

const tokens = { DevTokens, MoonbaseTokens, RococoTokens, KusamaTokens, PolkadotTokens };

export { tokens };
export type { XToken };
