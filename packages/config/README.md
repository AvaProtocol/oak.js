# @oak-network/config
The default configs of @oak-network libraries that contain basic chain informs of Polkadot, Kusama, Rococo, Moonbase, and Dev chains.

## Usage
```
import { chains, tokens } from "@oak-network/config";

const { DevChains, MoonbaseChains, RococoChains, KusamaChains, PolkadotChains } = chains;
const { DevTokens, MoonbaseTokens, RococoTokens, KusamaTokens, PolkadotTokens } = tokens;

```