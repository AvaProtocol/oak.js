import { createToken } from "./types/Token";

// You can now create assets without repeating the same structure over and over.
const tur = createToken({
  decimals: 10,
  key: "tur",
  network: "rococo",
  parachainId: 2114,
  symbol: "TUR",
});
const rstr = createToken({
  decimals: 18,
  key: "rocstar",
  network: "rococo",
  parachainId: 2006,
  symbol: "RSTR",
});
const mgr = createToken({
  decimals: 18,
  interior: {
    GeneralKey: {
      data: "0x0000000000000000000000000000000000000000000000000000000000000000",
      length: 4,
    },
  },
  key: "mangata-rococo",
  network: "rococo",
  parachainId: 2110,
  symbol: "MGR",
});

// eslint-disable-next-line import/no-default-export
export default { mgr, rstr, tur };
