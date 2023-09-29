import { chainConfigs } from "./constants";

const chainConfig = chainConfigs[process.env.ENV || "Turing Dev"];

export default chainConfig;
