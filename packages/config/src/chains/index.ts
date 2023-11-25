import { Chain, XcmConfig } from "./types/Chain";
import { Weight } from "./types/Weight";
import DevChains from "./dev";
import MoonbaseChains from "./moonbase";
import RococoChains from "./rococo";
import KusamaChains from "./kusama";
import PolkadotChains from "./polkadot";

export {
  DevChains,
  MoonbaseChains,
  RococoChains,
  KusamaChains,
  PolkadotChains,
  Weight,
};
export type { Chain, XcmConfig };
