import { OakChains, OakChainSchedulingLimit, RECURRING_TASK_LIMIT } from '../../src/constants'
import { Recurrer } from '../../src/recurrer'
import { Scheduler } from '../../src/scheduler'

test('validateTimestamps does not error with valid timestamps', async () => {
  const scheduler = new Scheduler(OakChains.STUR)
  const recurrer = new Recurrer()
  const timestamps = recurrer.getHourlyRecurringTimestamps(Date.now(), 5)
  scheduler.validateTimestamps(timestamps)
})

test('validateTimestamps will error with too many timestamps', async () => {
  const scheduler = new Scheduler(OakChains.STUR)
  const recurrer = new Recurrer()
  const timestamps = recurrer.getHourlyRecurringTimestamps(Date.now(), 25)
  expect(() => scheduler.validateTimestamps(timestamps)).toThrowError(`Recurring Task length cannot exceed ${RECURRING_TASK_LIMIT}`)
})

test('validateTimestamps will error with timestamps in past', async () => {
  const scheduler = new Scheduler(OakChains.STUR)
  const timestamps = [ 1588100400 ]
  expect(() => scheduler.validateTimestamps(timestamps)).toThrowError(`Scheduled timestamp in the past`)
})

test('validateTimestamps will error with non hour timestamps', async () => {
  const scheduler = new Scheduler(OakChains.STUR)
  const timestamps = [ Date.now() + 10000000 ]
  expect(() => scheduler.validateTimestamps(timestamps)).toThrowError(`Timestamp is not an hour timestamp`)
})

test('validateTimestamps will error too far in future', async () => {
  const scheduler = new Scheduler(OakChains.STUR)
  const currentTimestamp = Date.now()
  const currentHour = currentTimestamp - (currentTimestamp % 3600000)
  const timestamps = [ currentHour + OakChainSchedulingLimit.STUR + 3600000 ]
  expect(() => scheduler.validateTimestamps(timestamps)).toThrowError(`Timestamp too far in future`)
})

test('validateTransferParams will error with non hour timestamps', async () => {
  const scheduler = new Scheduler(OakChains.STUR)
  const address1 = 'address1'
  const address2 = 'address2'
  scheduler.validateTransferParams(1000000000, address1, address2)
})

test('validateTransferParams will error with too low an amount', async () => {
  const scheduler = new Scheduler(OakChains.STUR)
  const address1 = 'address1'
  const address2 = 'address2'
  expect(() => scheduler.validateTransferParams(10, address1, address2)).toThrowError(`Amount too low`)
})

test('validateTransferParams will error when sending money to self', async () => {
  const scheduler = new Scheduler(OakChains.STUR)
  const address1 = 'address1'
  const address2 = 'address2'
  expect(() => scheduler.validateTransferParams(1000000000, address1, address1)).toThrowError(`Cannot send to self`)
})
