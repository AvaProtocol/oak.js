import { createToken } from "./types/Token";

const glmr = createToken({ key: "glmr", symbol: "GLMR", decimals: 10, network: "kusama", parachainId: 2023, palletInstance: 10 });

export default { glmr };
