import { isDayKey, type DayKey, type Kop } from '~/core'

/** The app speaks Ukrainian only; numbers and dates follow it. */
export const LOCALE = 'uk-UA'

const money = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const whole = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })

const rate = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

const percent = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 })

/** `570702` → `5 707,02`. The unit is added by the copy around it. */
export const formatMoney = (amount: Kop) => money.format(amount / 100)

/** A limit or a minimum wage: whole hryvnias, no kopecks. */
export const formatWhole = (amount: Kop) => whole.format(amount / 100)

export const formatRate = (value: number) => rate.format(value)

/** `5` → `5`, `16.723` → `16,72`: a percent without the sign. */
export const formatPercent = (value: number) => percent.format(value)

/** The number the user typed: spaces and either decimal mark allowed. */
const parseNumber = (text: string): number | null => {
  const cleaned = text.replace(/[\s  ]/g, '').replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null
  return Number(cleaned)
}

/** A sum in hryvnias or another currency, as kopecks or cents. */
export const parseMoney = (text: string): Kop | null => {
  const value = parseNumber(text)
  if (value === null) return null
  const kop = Math.round(value * 100)
  return Math.abs(kop / 100 - value) < 1e-9 ? kop : null
}

/** An exchange rate: up to four decimals, more than zero. */
export const parseRate = (text: string): number | null => {
  const value = parseNumber(text)
  if (value === null || value <= 0) return null
  return Math.round(value * 10000) / 10000
}

/** A percent rate the user typed, 0…100. */
export const parsePercent = (text: string): number | null => {
  const value = parseNumber(text)
  if (value === null || value > 100) return null
  return value
}

/** Kopecks as the user would type them back into a field. */
export const moneyInput = (amount: Kop) =>
  formatMoney(amount).replace(/[  ]/g, ' ')

export const DAY_LONG = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
} as const
export const DAY_MONTH = { day: 'numeric', month: 'long' } as const
export const DAY_FULL = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
} as const
export const DAY_NUMERIC = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
} as const
export const MONTH_SHORT = { month: 'short' } as const
export const WEEKDAY_SHORT = { weekday: 'short' } as const
export const MONTH_YEAR = { month: 'long', year: 'numeric' } as const

/** «21 квітня», or «21 квітня 2025 р.» when the year is not the current one. */
export const formatDue = (day: DayKey, today: DayKey) =>
  formatDay(day, day.slice(0, 4) === today.slice(0, 4) ? DAY_MONTH : DAY_FULL)

/**
 * A `YYYY-MM-DD` day in words. The day is a calendar date, not a moment, so
 * it is formatted in UTC and never shifts with the reader's time zone.
 * Anything that is not a whole day (a date field half typed or cleared)
 * gives an empty string rather than a RangeError that takes the page down.
 */
export const formatDay = (day: DayKey, options: Intl.DateTimeFormatOptions) => {
  if (!isDayKey(day)) return ''
  const [year, month, date] = day.split('-').map(Number)
  return new Intl.DateTimeFormat(LOCALE, {
    ...options,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, date)))
}
