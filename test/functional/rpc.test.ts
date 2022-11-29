import _ from 'lodash';
import { ApiPromise } from '@polkadot/api';

import { OakChains, AutomationAction } from '../utils/constants'
import { getPolkadotApi } from '../utils/helpFn';

let api: ApiPromise;

const initialize = async () => {
  jest.setTimeout(540000);
  api = await getPolkadotApi(OakChains.STUR, { providerUrl: process.env.PROVIDER_URL });
}

beforeEach(() => initialize());
afterEach(() => api.disconnect());

test('scheduler.getTimeAutomationFees works', async () => {
  const resultCodec = await (api.rpc as any).automationTime.getTimeAutomationFees(AutomationAction.Notify, 3)
  const fee =  resultCodec.toJSON();

  expect(fee > 0).toEqual(true);
});

test('scheduler.calculateOptimalAutostaking works', async () => {
  // Find first collator
  const pool = (await api.query.parachainStaking.candidatePool()).toJSON() as { owner: any }[];
  const { owner } = pool[0];

  const resultCodec = await (api.rpc as any).automationTime.calculateOptimalAutostaking(10000000000, owner);
  const result = resultCodec.toPrimitive();

  expect(Object.keys(result).sort()).toEqual(["apy", "period"].sort());
});

test('scheduler.getAutoCompoundDelegatedStakeTaskIds works', async () => {
  const resultCodec = await (api.rpc as any).automationTime.getAutoCompoundDelegatedStakeTaskIds('68vqVx27xVYeCkqJTQnyXrcMCaKADUa7Rywn9TSrUZyp4NGP')
  const result = resultCodec.toJSON();

  expect(_.isArray(result)).toEqual(true);
});
