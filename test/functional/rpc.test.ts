import _ from 'lodash';

import { OakChains, AutomationAction } from '../../src/constants'
import { Scheduler } from '../../src/scheduler';
import { getPolkadotApi } from './helpFn';

beforeEach(() => {
  jest.setTimeout(540000);
});

test('scheduler.getTimeAutomationFees works', async () => {
  const options = { providerUrl: process.env.PROVIDER_URL };
  const scheduler = new Scheduler(OakChains.STUR, options);
  const fee = await scheduler.getTimeAutomationFees(AutomationAction.Notify, 3);
  expect(fee > 0).toEqual(true);
});

test('scheduler.calculateOptimalAutostaking works', async () => {
  const options = { providerUrl: process.env.PROVIDER_URL };
  const scheduler = new Scheduler(OakChains.STUR, options);
  const polkadotApi = await getPolkadotApi();
  
  // Find first collator
  const pool = (await polkadotApi.query.parachainStaking.candidatePool()).toJSON() as { owner }[];
  const { owner } = pool[0];

  const result = await scheduler.calculateOptimalAutostaking(10000000000, owner);
  expect(Object.keys(result).sort()).toEqual(["apy", "period"].sort());
});

test('scheduler.getAutoCompoundDelegatedStakeTaskIds works', async () => {
  const options = { providerUrl: process.env.PROVIDER_URL };
  const scheduler = new Scheduler(OakChains.STUR, options);
  const result = await scheduler.getAutoCompoundDelegatedStakeTaskIds("68vqVx27xVYeCkqJTQnyXrcMCaKADUa7Rywn9TSrUZyp4NGP");
  expect(_.isArray(result)).toEqual(true);
});
