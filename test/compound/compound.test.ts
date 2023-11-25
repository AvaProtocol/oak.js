// import _ from "lodash";
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
import { getKeyringPair } from "../utils/helpFn";

describe("test-compound", () => {
  let keyringPair: KeyringPair | undefined;
  let turingApi: ApiPromise | undefined;
  let turingAdapter: OakAdapter | undefined;
  beforeAll(async () => {
    // Create keyringPair
    keyringPair = await getKeyringPair();
    const {
      DevChains: { turingLocal: turingConfig },
    } = chains;
    console.log("turingConfig.endpoint: ", turingConfig.endpoint);

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

  it("get-auto-compounding-delegation-percentage", async () => {
    expect(turingApi).toBeDefined();
    expect(keyringPair).toBeDefined();
    const pools = await turingApi.query.parachainStaking.candidatePool();
    const collatorWalletAddress = pools[0].owner.toHex();
    const result = await turingAdapter?.getAutoCompoundingDelegationPercentage(
      collatorWalletAddress,
      u8aToHex(keyringPair?.addressRaw),
    );
    console.log(result);
    expect(result).toBeDefined();
  });

  it("get-delegation", async () => {
    expect(turingApi).toBeDefined();
    expect(keyringPair).toBeDefined();
    const pools = await turingApi.query.parachainStaking.candidatePool();
    const collatorWalletAddress = pools[0].owner.toHex();
    const result = await turingAdapter?.getDelegation(
      u8aToHex(keyringPair?.addressRaw),
      collatorWalletAddress,
    );
    expect(result).toBeDefined();
  });

  it(
    "delegate-with-auto-compound",
    async () => {
      expect(turingApi).toBeDefined();
      expect(keyringPair).toBeDefined();
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
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

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
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );

  it(
    "ensure-balance",
    async () => {
      expect(turingAdapter).toBeDefined();
      expect(keyringPair).toBeDefined();
      await turingAdapter?.ensureBalance(
        u8aToHex(keyringPair?.addressRaw),
        new BN("10000000000"),
      );
    },
    DEFAULT_TIMEOUT_PER_TEST,
  );
});
