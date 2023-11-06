import { createToken } from "./types/Token";

const moonbaseTur = createToken({ key: "tur", symbol: "TUR", decimals: 10, network: "moonbase", parachainId: 2114 });
const moonbaseAlpha = createToken({ key: "dev", symbol: "DEV", decimals: 10, network: "moonbase", parachainId: 1000, palletInstance: 3 });

export default { moonbaseTur, moonbaseAlpha };
