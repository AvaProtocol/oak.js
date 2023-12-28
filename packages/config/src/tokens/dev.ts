import { createToken } from "./types/Token";

const tur = createToken({
  decimals: 10,
  key: "tur",
  network: "moonbase",
  parachainId: 2114,
  symbol: "TUR",
});
const sby = createToken({
  decimals: 18,
  key: "shibuya",
  network: "moonbase",
  parachainId: 2000,
  symbol: "SBY",
});
const moonbaseLocal = createToken({
  decimals: 18,
  interior: { PalletInstance: 3 },
  key: "unit",
  network: "moonbase",
  parachainId: 1000,
  symbol: "UNIT",
});
const mgr = createToken({
  decimals: 18,
  interior: {
    GeneralKey: {
      data: "0x0000000000000000000000000000000000000000000000000000000000000000",
      length: 4,
    },
  },
  key: "mgr",
  network: "mangata",
  parachainId: 2110,
  symbol: "MGR",
});

// eslint-disable-next-line import/no-default-export
export default { mgr, moonbaseLocal, sby, tur };
