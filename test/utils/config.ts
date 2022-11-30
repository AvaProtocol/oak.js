import { chainConfigs } from "./constants";

const env = process.env.ENV || 'Turing Dev';

const chainConfig = {
	env,
	...chainConfigs[env],
};

export default chainConfig;
