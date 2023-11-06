import { createToken } from "./types/Token";

const tur = createToken({ key: "tur", symbol: "TUR", decimals: 10, network: "moonbase", parachainId: 2114 });
const sby = createToken({ key: "shibuya", symbol: "SBY", decimals: 18, network: "moonbase", parachainId: 2000 });
const moonbaseLocal = createToken({ key: "unit", symbol: "UNIT", decimals: 18, network: "moonbase", parachainId: 1000, palletInstance: 3 });
const mgr = createToken({ key: "mgr", symbol: "MGR", decimals: 18, network: "mangata", parachainId: 2110 });

export default { tur, sby, moonbaseLocal, mgr };
