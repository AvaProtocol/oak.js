import * as _ from 'lodash';
import { Recurrer } from '../utils/recurrer'

test('getDailyRecurringTimestamps works with viable timestamps', async () => {
  // const numberRecurring = 20
  // const hourOfDay = 0
  // const currentTime = Date.now()
  // const recurrer = new Recurrer()
  // const times = recurrer.getDailyRecurringTimestamps(currentTime, numberRecurring, hourOfDay)
  // expect(times.length).toBe(numberRecurring)
  // _.forEach(times, (time, index) => {
  //   const currentMonth = (new Date(currentTime)).getUTCMonth()
  //   const currentYear = (new Date(currentTime)).getUTCFullYear()
  //   const currentHour = (new Date(currentTime)).getUTCHours()
  //   const currentDay = currentHour >= hourOfDay ? (new Date(currentTime)).getUTCDate() + 1 : (new Date(currentTime)).getUTCDate()
  //   const newExpectedDate = (Date.UTC(currentYear, currentMonth, currentDay + index, hourOfDay))
  //   expect(time).toBe(newExpectedDate)
  // })
})

test('getDailyRecurringTimestamps works when start hour greater than scheduled hour of day', async () => {
  const numberRecurring = 20
  const hourOfDay = 0
  const currentTime = 1651233600000
  const recurrer = new Recurrer()
  const times = recurrer.getDailyRecurringTimestamps(currentTime, numberRecurring, hourOfDay)
  expect(times.length).toBe(numberRecurring)
  _.forEach(times, (time, index) => {
    const currentMonth = (new Date(currentTime)).getUTCMonth()
    const currentYear = (new Date(currentTime)).getUTCFullYear()
    const currentHour = (new Date(currentTime)).getUTCHours()
    const currentDay = currentHour >= hourOfDay ? (new Date(currentTime)).getUTCDate() + 1 : (new Date(currentTime)).getUTCDate()
    const newExpectedDate = (Date.UTC(currentYear, currentMonth, currentDay + index, hourOfDay))
    expect(time).toBe(newExpectedDate)
  })
})

test('getDailyRecurringTimestamps works when start hour less than scheduled hour of day', async () => {
  const numberRecurring = 20
  const hourOfDay = 20
  const currentTime = 1651233600000
  const recurrer = new Recurrer()
  const times = recurrer.getDailyRecurringTimestamps(currentTime, numberRecurring, hourOfDay)
  expect(times.length).toBe(numberRecurring)
  _.forEach(times, (time, index) => {
    const currentMonth = (new Date(currentTime)).getUTCMonth()
    const currentYear = (new Date(currentTime)).getUTCFullYear()
    const currentHour = (new Date(currentTime)).getUTCHours()
    const currentDay = currentHour >= hourOfDay ? (new Date(currentTime)).getUTCDate() + 1 : (new Date(currentTime)).getUTCDate()
    const newExpectedDate = (Date.UTC(currentYear, currentMonth, currentDay + index, hourOfDay))
    expect(time).toBe(newExpectedDate)
  })
})

test('getHourlyRecurringTimestamps', async () => {
  const numberRecurring = 20
  const currentTime = Date.now()
  const recurrer = new Recurrer()
  const times = recurrer.getHourlyRecurringTimestamps(currentTime, numberRecurring)
  expect(times.length).toBe(20)
  _.forEach(times, (time, index) => {
    const currentMonth = (new Date(currentTime)).getUTCMonth()
    const currentYear = (new Date(currentTime)).getUTCFullYear()
    const currentDay = (new Date(currentTime)).getUTCDate()
    const currentHour = (new Date(currentTime)).getUTCHours()
    const newExpectedDate = (Date.UTC(currentYear, currentMonth, currentDay, currentHour + index + 1))
    expect(time).toBe(newExpectedDate)
  })
})

test('getMonthlyRecurringTimestampsByDate works when start hour greater than scheduled hour of day', async () => {
  const numberRecurring = 20
  const hourOfDay = 5
  const dateOfMonth = 11
  const currentTime = 1651233600000
  const recurrer = new Recurrer()
  const times = recurrer.getMonthlyRecurringTimestampsByDate(currentTime, numberRecurring, hourOfDay, dateOfMonth)
  expect(times.length).toBe(20)
  _.forEach(times, (time, index) => {
    const currentMonth = (new Date(currentTime)).getUTCMonth()
    const currentYear = (new Date(currentTime)).getUTCFullYear()
    const newExpectedDate = (Date.UTC(currentYear, currentMonth + index + 1, dateOfMonth, hourOfDay))
    expect(time).toBe(newExpectedDate)
  })
})

test('getMonthlyRecurringTimestampsByDate works when start hour less than scheduled hour of day', async () => {
  const numberRecurring = 20
  const hourOfDay = 20
  const dateOfMonth = 11
  const currentTime = 1651233600000
  const recurrer = new Recurrer()
  const times = recurrer.getMonthlyRecurringTimestampsByDate(currentTime, numberRecurring, hourOfDay, dateOfMonth)
  expect(times.length).toBe(20)
  _.forEach(times, (time, index) => {
    const currentMonth = (new Date(currentTime)).getUTCMonth()
    const currentYear = (new Date(currentTime)).getUTCFullYear()
    const newExpectedDate = (Date.UTC(currentYear, currentMonth + index + 1, dateOfMonth, hourOfDay))
    expect(time).toBe(newExpectedDate)
  })
})

test('getMonthlyRecurringTimestampsByWeekday works if already past day of current month', async () => {
  const numberRecurring = 20
  const hourOfDay = 23
  const dayOfWeek = 5
  const weekOfMonth = 1
  const currentTime = 1649995200000
  const recurrer = new Recurrer()
  const times = recurrer.getMonthlyRecurringTimestampsByWeekday(currentTime, numberRecurring, hourOfDay, dayOfWeek, weekOfMonth)
  expect(times.length).toBe(20)
  _.forEach(times, (time, index) => {
    const newTime = new Date(time)
    expect(newTime.getUTCDay()).toBe(dayOfWeek)
    expect(newTime.getUTCMonth()).toBe(((new Date(currentTime)).getUTCMonth() + index + 1) % 12)
  })
})

test('getMonthlyRecurringTimestampsByWeekday works if not past day of current month', async () => {
  const numberRecurring = 20
  const hourOfDay = 23
  const dayOfWeek = 5
  const weekOfMonth = 4
  const currentTime = 1649995200000
  const recurrer = new Recurrer()
  const times = recurrer.getMonthlyRecurringTimestampsByWeekday(currentTime, numberRecurring, hourOfDay, dayOfWeek, weekOfMonth)
  expect(times.length).toBe(20)
  _.forEach(times, (time, index) => {
    const newTime = new Date(time)
    expect(newTime.getUTCDay()).toBe(dayOfWeek)
    expect(newTime.getUTCMonth()).toBe(((new Date(currentTime)).getUTCMonth() + index) % 12)
  })
})

test('getMonthlyRecurringTimestampsByWeekday errors if week of month is greater than 4', async () => {
  const numberRecurring = 20
  const hourOfDay = 23
  const dayOfWeek = 5
  const weekOfMonth = 5
  const currentTime = Date.now()
  const recurrer = new Recurrer()
  expect(() => recurrer.getMonthlyRecurringTimestampsByWeekday(currentTime, numberRecurring, hourOfDay, dayOfWeek, weekOfMonth))
    .toThrowError('Can only schedule monthly recurring tasks based on week for the first 4 weeks of a month')
})

test('getWeeklyRecurringTimestamps works', async () => {
  const numberRecurring = 20
  const hourOfDay = 18
  const dayOfWeek = 5
  const currentTime = Date.now()
  const recurrer = new Recurrer()
  const times = recurrer.getWeeklyRecurringTimestamps(currentTime, numberRecurring, hourOfDay, dayOfWeek)
  const firstExpectedInstance = times[0]
  expect(times.length).toBe(20)
  _.forEach(times, (time, index) => {
    const newTime = new Date(time)
    const weekOfTime = 7 * 24 * 60 * 60
    expect(newTime.getUTCDay()).toBe(dayOfWeek)
    expect(time).toBe(firstExpectedInstance + (weekOfTime * index * 1000))
  })
})

test('getWeeklyRecurringTimestamps works on same day of week with earlier start time', async () => {
  const numberRecurring = 20
  const hourOfDay = 18
  const dayOfWeek = 5
  const currentTime = 1651233600000
  const recurrer = new Recurrer()
  const times = recurrer.getWeeklyRecurringTimestamps(currentTime, numberRecurring, hourOfDay, dayOfWeek)
  const firstExpectedInstance = times[0]
  expect(times.length).toBe(20)
  _.forEach(times, (time, index) => {
    const newTime = new Date(time)
    const weekOfTime = 7 * 24 * 60 * 60
    expect(newTime.getUTCDay()).toBe(dayOfWeek)
    expect(time).toBe(firstExpectedInstance + (weekOfTime * index * 1000))
  })
})

test('getWeeklyRecurringTimestamps works on same day of week with later start time', async () => {
  const numberRecurring = 20
  const hourOfDay = 5
  const dayOfWeek = 5
  const currentTime = 1651233600000
  const recurrer = new Recurrer()
  const times = recurrer.getWeeklyRecurringTimestamps(currentTime, numberRecurring, hourOfDay, dayOfWeek)
  const firstExpectedInstance = times[0]
  expect(times.length).toBe(20)
  _.forEach(times, (time, index) => {
    const newTime = new Date(time)
    const weekOfTime = 7 * 24 * 60 * 60
    expect(newTime.getUTCDay()).toBe(dayOfWeek)
    expect(time).toBe(firstExpectedInstance + (weekOfTime * index * 1000))
  })
})
