import { createToken } from "./types/Token";

const tur = createToken({
  decimals: 10,
  key: "tur",
  network: "moonbase",
  parachainId: 2114,
  symbol: "TUR",
});

const dev = createToken({
  decimals: 10,
  interior: { PalletInstance: 3 },
  key: "dev",
  network: "moonbase",
  parachainId: 1000,
  symbol: "DEV",
});

// eslint-disable-next-line import/no-default-export
export default { dev, tur };
