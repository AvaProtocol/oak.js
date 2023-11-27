import BN from "bn.js";
import { u8aToHex } from "@polkadot/util";
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

describe("compound", () => {
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
    "ensure-balance",
    async () => {
      expect(turingAdapter).toBeDefined();
      expect(keyringPair).toBeDefined();
      expect(keyringPair).toBeDefined();
      await expect(
        turingAdapter?.ensureBalance(
          u8aToHex(keyringPair?.addressRaw),
          new BN("10000000000"),
        ),
      ).resolves.toBeUndefined();
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  it("get-delegation", async () => {
    expect(turingApi).toBeDefined();
    expect(keyringPair).toBeDefined();
    expect(turingAdapter).toBeDefined();
    const pools = await turingApi.query.parachainStaking.candidatePool();
    const collatorWalletAddress = pools[0].owner.toHex();
    const result = await turingAdapter?.getDelegation(
      u8aToHex(keyringPair?.addressRaw),
      collatorWalletAddress,
    );
    expect(result).toBeDefined();
  });

  it("get-auto-compounding-delegation-percentage", async () => {
    expect(turingApi).toBeDefined();
    expect(keyringPair).toBeDefined();
    expect(turingAdapter).toBeDefined();
    const pools = await turingApi.query.parachainStaking.candidatePool();
    const collatorWalletAddress = pools[0].owner.toHex();
    const percentage =
      await turingAdapter?.getAutoCompoundingDelegationPercentage(
        collatorWalletAddress,
        u8aToHex(keyringPair?.addressRaw),
      );
    console.log(percentage);
    expect(typeof percentage).toBe("number");
  });

  it(
    "set-auto-compound",
    async () => {
      expect(turingApi).toBeDefined();
      expect(keyringPair).toBeDefined();
      const pools = await turingApi.query.parachainStaking.candidatePool();
      const collatorWalletAddress = pools[0].owner.toHex();
      const result = await turingAdapter?.setAutoCompound(
        collatorWalletAddress,
        70,
        keyringPair,
      );
      expect(result).toBeDefined();
      const { events } = result;
      const event = findEvent(events, "parachainStaking", "AutoCompoundSet");
      expect(event).toBeDefined();
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  it(
    "bond-more",
    async () => {
      expect(turingApi).toBeDefined();
      expect(keyringPair).toBeDefined();
      const pools = await turingApi.query.parachainStaking.candidatePool();
      const collatorWalletAddress = pools[0].owner.toHex();
      const result = await turingAdapter?.bondMore(
        collatorWalletAddress,
        new BN("10000000000"),
        keyringPair,
      );
      expect(result).toBeDefined();
      const { events } = result;
      const event = findEvent(
        events,
        "parachainStaking",
        "DelegationIncreased",
      );
      expect(event).toBeDefined();
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );
});
