import type { XToken, XcmConfig } from "@oak-network/config";
import { XcmInstructionNetworkType } from "../types";

export class ChainData {
  key: string | undefined;

  assets: XToken[] = [];

  defaultAsset: XToken | undefined;

  endpoint: string | undefined;

  relayChain: string | undefined;

  network: string | undefined;

  paraId: number | undefined;

  ss58Prefix: number | undefined;

  name: string | undefined;

  xcmInstructionNetworkType: XcmInstructionNetworkType =
    XcmInstructionNetworkType.Null;

  xcm: XcmConfig | undefined;
}
