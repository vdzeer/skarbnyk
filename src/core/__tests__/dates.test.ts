import {
  addDays,
  daysBetween,
  isDayKey,
  quarterEnd,
  quarterOf,
  quarterStart,
  weekdayOf,
} from '..'

describe('days', () => {
  it('accepts real calendar dates only', () => {
    expect(isDayKey('2026-10-14')).toBe(true)
    expect(isDayKey('2028-02-29')).toBe(true)
    expect(isDayKey('2026-02-29')).toBe(false)
    expect(isDayKey('2026-13-01')).toBe(false)
    expect(isDayKey('14.10.2026')).toBe(false)
    expect(isDayKey(20261014)).toBe(false)
  })

  it('adds days across months and years', () => {
    expect(addDays('2026-09-30', 40)).toBe('2026-11-09')
    expect(addDays('2026-12-31', 60)).toBe('2027-03-01')
    expect(daysBetween('2026-10-14', '2026-10-20')).toBe(6)
  })

  it('knows the weekday', () => {
    expect(weekdayOf('2026-10-14')).toBe(3)
    expect(weekdayOf('2026-05-10')).toBe(0)
  })

  it('knows the quarters', () => {
    expect(quarterOf('2026-07-01')).toBe(3)
    expect(quarterOf('2026-12-31')).toBe(4)
    expect(quarterStart(2026, 2)).toBe('2026-04-01')
    expect(quarterEnd(2026, 1)).toBe('2026-03-31')
    expect(quarterEnd(2028, 1)).toBe('2028-03-31')
  })
})
