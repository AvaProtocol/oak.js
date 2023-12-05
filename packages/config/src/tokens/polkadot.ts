import { createToken } from "./types/Token";

const glmr = createToken({
  decimals: 10,
  interior: { palletInstance: 10 },
  key: "glmr",
  network: "kusama",
  parachainId: 2023,
  symbol: "GLMR",
});

// eslint-disable-next-line import/no-default-export
export default { glmr };
