import { createToken } from "./types/Token";

const tur = createToken({ key: "tur", symbol: "TUR", decimals: 10, network: "kusama", parachainId: 2114 });

// TODO: movr is not defined in the original file; need to double check its value
const movr = createToken({ key: "movr", symbol: "MOVR", decimals: 10, network: "kusama", parachainId: 2023, palletInstance: 10 });
const sdn = createToken({ key: "shiden", symbol: "SDN", decimals: 18, network: "kusama", parachainId: 2007 });
const mgx = createToken({ key: "mangata", symbol: "MGX", decimals: 18, network: "kusama", parachainId: 2110 });

export default { tur, movr, sdn, mgx };
