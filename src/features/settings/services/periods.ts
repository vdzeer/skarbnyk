import { isDayKey, type DayKey, type Group, type GroupPeriod } from '~/core'

export type PeriodProblem = 'not_quarter' | 'before_last' | null

/** A change of group takes effect from the first day of a quarter. */
export const isQuarterStart = (day: DayKey) =>
  isDayKey(day) && /-(01|04|07|10)-01$/.test(day)

export const periodProblem = (
  periods: GroupPeriod[],
  from: DayKey,
): PeriodProblem => {
  if (!isQuarterStart(from)) return 'not_quarter'
  const last = periods[periods.length - 1]
  return last && from <= last.from ? 'before_last' : null
}

export const addPeriod = (
  periods: GroupPeriod[],
  from: DayKey,
  group: Group,
  vat: boolean,
): GroupPeriod[] => [...periods, { from, group, vat: group === 3 && vat }]

/** The first period always starts on the registration day. */
export const withRegistration = (
  periods: GroupPeriod[],
  registeredOn: DayKey,
): GroupPeriod[] =>
  periods.map((period, index) =>
    index === 0 ? { ...period, from: registeredOn } : period,
  )
