/**
 * Calendar days as `YYYY-MM-DD` strings. Taxes run on calendar dates, not
 * moments, so all arithmetic is done in UTC and no time zone can move a day.
 */
export type DayKey = string

export type Quarter = 1 | 2 | 3 | 4

export const QUARTERS: Quarter[] = [1, 2, 3, 4]

/**
 * The single tax exists since 1999. Nothing earlier is a real FOP date; it is
 * a year still being typed into a date field (`0002-…`, `0020-…`).
 */
export const EARLIEST_DAY = '1999-01-01'

const DAY_MS = 86_400_000

export const isDayKey = (value: unknown): value is DayKey => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

const pad = (value: number) => String(value).padStart(2, '0')

export const dayOf = (year: number, month: number, day: number): DayKey =>
  `${year}-${pad(month)}-${pad(day)}`

const toUtc = (day: DayKey) => {
  const [year, month, date] = day.split('-').map(Number)
  return Date.UTC(year, month - 1, date)
}

const fromUtc = (ms: number): DayKey => {
  const date = new Date(ms)
  return dayOf(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

/** The local calendar day of a moment, as the device sees it. */
export const localDay = (moment: Date): DayKey =>
  dayOf(moment.getFullYear(), moment.getMonth() + 1, moment.getDate())

export const addDays = (day: DayKey, days: number): DayKey =>
  fromUtc(toUtc(day) + days * DAY_MS)

export const daysBetween = (from: DayKey, to: DayKey) =>
  Math.round((toUtc(to) - toUtc(from)) / DAY_MS)

export const yearOf = (day: DayKey) => Number(day.slice(0, 4))

export const monthOf = (day: DayKey) => Number(day.slice(5, 7))

export const quarterOf = (day: DayKey): Quarter =>
  (Math.floor((monthOf(day) - 1) / 3) + 1) as Quarter

/** 0 is Sunday, 6 is Saturday. */
export const weekdayOf = (day: DayKey) => new Date(toUtc(day)).getUTCDay()

export const isWeekend = (day: DayKey) => [0, 6].includes(weekdayOf(day))

export const lastDayOfMonth = (year: number, month: number): DayKey =>
  fromUtc(Date.UTC(year, month, 0))

export const firstMonthOfQuarter = (quarter: Quarter) => (quarter - 1) * 3 + 1

export const quarterStart = (year: number, quarter: Quarter): DayKey =>
  dayOf(year, firstMonthOfQuarter(quarter), 1)

export const quarterEnd = (year: number, quarter: Quarter): DayKey =>
  lastDayOfMonth(year, firstMonthOfQuarter(quarter) + 2)

export const compareDays = (one: DayKey, other: DayKey) =>
  one < other ? -1 : Number(one > other)
