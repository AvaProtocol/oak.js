import { createToken } from "./types/Token";

const tur = createToken({
  decimals: 10,
  key: "tur",
  network: "kusama",
  parachainId: 2114,
  symbol: "TUR",
});
const xcTur = createToken({
  decimals: 10,
  key: "xcTur",
  network: "kusama",
  parachainId: 2114,
  symbol: "xcTUR",
});

// TODO: movr is not defined in the original file; need to double check its value
const movr = createToken({
  decimals: 18,
  interior: { PalletInstance: 10 },
  key: "movr",
  network: "kusama",
  parachainId: 2023,
  symbol: "MOVR",
});
const sdn = createToken({
  decimals: 18,
  key: "shiden",
  network: "kusama",
  parachainId: 2007,
  symbol: "SDN",
});
const mgx = createToken({
  decimals: 18,
  interior: {
    GeneralKey: {
      data: "0x0000000000000000000000000000000000000000000000000000000000000000",
      length: 4,
    },
  },
  key: "mangata",
  network: "kusama",
  parachainId: 2110,
  symbol: "MGX",
});

// eslint-disable-next-line import/no-default-export
export default { mgx, movr, sdn, tur, xcTur };
