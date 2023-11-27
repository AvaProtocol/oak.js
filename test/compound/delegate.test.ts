import { ApiPromise, WsProvider } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import { chains } from "@oak-network/config";
import { OakAdapter } from "@oak-network/adapter";
import { rpc, types, runtime } from "@oak-network/types";
import {
  DEFAULT_TIMEOUT_INITIALIZE,
  DEFAULT_TIMEOUT_PER_TEST,
} from "../utils/constants";
import { findEvent, getKeyringPair } from "../utils/helpFn";

// delegate-with-auto-compound test can only be run once on a fresh parachain
describe("delegate-with-auto-compound", () => {
  let keyringPair: KeyringPair | undefined;
  let turingApi: ApiPromise | undefined;
  let turingAdapter: OakAdapter | undefined;
  beforeAll(async () => {
    // Create keyringPair
    keyringPair = await getKeyringPair();
    const {
      DevChains: { turingLocal: turingConfig },
    } = chains;

    // Initialize adapters
    turingApi = await ApiPromise.create({
      provider: new WsProvider(turingConfig.endpoint),
      rpc,
      runtime,
      types,
    });
    turingAdapter = new OakAdapter(turingApi, turingConfig);
    await turingAdapter.initialize();
  }, DEFAULT_TIMEOUT_INITIALIZE);

  afterAll(async () => {
    await turingApi?.disconnect();
  });

  it(
    "delegate-with-auto-compound",
    async () => {
      expect(turingApi).toBeDefined();
      expect(keyringPair).toBeDefined();
      expect(turingAdapter).toBeDefined();
      const pools = await turingApi.query.parachainStaking.candidatePool();
      const collatorWalletAddress = pools[0].owner.toHex();
      const { minDelegation } = turingApi.consts.parachainStaking;
      const result = await turingAdapter?.delegateWithAutoCompound(
        collatorWalletAddress,
        minDelegation,
        50,
        keyringPair,
      );
      expect(result).toBeDefined();
      const { events } = result;
      const event = findEvent(events, "parachainStaking", "Delegation");
      expect(event).toBeDefined();
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );
});
