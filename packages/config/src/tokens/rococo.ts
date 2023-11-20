import { createToken } from "./types/Token";

// You can now create assets without repeating the same structure over and over.
const tur = createToken({ key: "tur", symbol: "TUR", decimals: 10, network: "rococo", parachainId: 2114 });
const rstr = createToken({ key: "rocstar", symbol: "RSTR", decimals: 18, network: "rococo", parachainId: 2006 });
const mgr = createToken({ key: "mangata-rococo", symbol: "MGR", decimals: 18, network: "rococo", parachainId: 2110 });

export default { tur, rstr, mgr };
