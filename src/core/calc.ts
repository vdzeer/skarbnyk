import {
  QUARTERS,
  compareDays,
  dayOf,
  lastDayOfMonth,
  monthOf,
  quarterOf,
  yearOf,
  type DayKey,
  type Quarter,
} from './dates'
import { roundKop, sum, type Kop } from './money'
import { ratesFor, type YearRates } from './rates'
import type { Group, GroupPeriod, Income, Profile } from './types'

/**
 * The calculator. One pure function from the profile and the incomes to
 * every sum of a year, under the single-tax rules of the Tax Code (ПКУ).
 */

export type MonthStatus = {
  /** 1…12 */
  month: number
  /** Null before registration. */
  group: Group | null
  vat: boolean
  /** Mobilised or under contract: nothing is owed for this month. */
  onService: boolean
  /** Income credited in the month, in hryvnias. */
  income: Kop
  /** Groups 1–2, the fixed monthly single tax; 0 otherwise. */
  singleTax: Kop
  /** Groups 1–2, the fixed monthly levy; 0 otherwise. */
  levy: Kop
  /**
   * The share of the month's income: group 3's percent (15% over the limit),
   * or 15% on a group 1–2 excess. Rounded from 1 January, so the months of a
   * quarter add up to exactly what the quarterly return shows.
   */
  shareTax: Kop
  shareLevy: Kop
  esv: Kop
}

export type QuarterSummary = {
  quarter: Quarter
  /** The group the quarter ends on; null when not registered by then. */
  group: Group | null
  /** All income credited in the quarter, in hryvnias. */
  income: Kop
  /** The part of it over the year's limit. */
  excess: Kop
  /** From 1 January to the end of the quarter: what a group-3 return shows. */
  cumulativeIncome: Kop
  singleTax: Kop
  levy: Kop
  esv: Kop
  total: Kop
  months: MonthStatus[]
}

export type YearSummary = {
  year: number
  rates: YearRates
  quarters: QuarterSummary[]
  income: Kop
  singleTax: Kop
  levy: Kop
  esv: Kop
  total: Kop
  /** The group whose limit applies: the latest one in the year. */
  limitGroup: Group | null
  limit: Kop
  excess: Kop
}

const monthStart = (year: number, month: number) => dayOf(year, month, 1)

/**
 * The group of a month: the latest period that began on or before its first
 * day. In the month of registration the first period counts from its day.
 */
const periodOfMonth = (
  periods: GroupPeriod[],
  year: number,
  month: number,
): GroupPeriod | null => {
  const start = monthStart(year, month)
  const covering = periods.filter(period => period.from <= start)
  if (covering.length > 0) return covering[covering.length - 1]
  const [first] = periods
  return first && first.from <= lastDayOfMonth(year, month) ? first : null
}

const monthIndex = (day: DayKey) => yearOf(day) * 12 + monthOf(day)

const isOnService = (profile: Profile, year: number, month: number) => {
  const { service } = profile
  if (!service) return false
  const index = year * 12 + month
  return (
    index >= monthIndex(service.from) &&
    (service.to === null || index <= monthIndex(service.to))
  )
}

const esvFor = (
  profile: Profile,
  rates: YearRates,
  year: number,
  month: number,
): Kop => {
  const { esv } = profile
  const least = rates.esvMin[month - 1]
  if (esv.mode === 'exempt') {
    const freeFrom = esv.since ? monthIndex(esv.since) : 0
    return year * 12 + month >= freeFrom ? 0 : least
  }
  if (esv.mode === 'custom') {
    return Math.min(Math.max(esv.monthly, least), rates.esvMax[month - 1])
  }
  return least
}

const monthStatus = (
  profile: Profile,
  rates: YearRates,
  year: number,
  month: number,
): MonthStatus => {
  const period = periodOfMonth(profile.periods, year, month)
  const registered = profile.registeredOn <= lastDayOfMonth(year, month)
  const onService = isOnService(profile, year, month)
  const empty = {
    month,
    group: null,
    vat: false,
    onService,
    income: 0,
    singleTax: 0,
    levy: 0,
    shareTax: 0,
    shareLevy: 0,
    esv: 0,
  }
  if (!period || !registered) return empty

  // Groups 1–2 join the single tax from the month after registration and
  // spend the month itself on the general system. Group 3 pays from the
  // day of registration, its first period starting on the 1st.
  const registrationMonth =
    monthIndex(profile.registeredOn) === year * 12 + month
  const fixedGroup = period.group !== 3
  const paysFixed = fixedGroup && !registrationMonth && !onService
  const paysEsv = !onService && !(fixedGroup && registrationMonth)

  return {
    ...empty,
    group: period.group,
    vat: period.group === 3 && period.vat,
    singleTax: paysFixed ? rates.singleTaxMonthly[period.group as 1 | 2] : 0,
    levy: paysFixed ? rates.levyMonthly : 0,
    esv: paysEsv ? esvFor(profile, rates, year, month) : 0,
  }
}

/** Income split at the limit, with its tax in hundredths of a kopeck. */
type Taxed = {
  month: number
  quarter: Quarter
  uah: Kop
  excess: Kop
  /** `Σ amount × percent`, divided by 100 only when a quarter is rounded. */
  singleTaxExact: number
  levyExact: number
}

const taxIncomes = (
  incomes: Income[],
  months: MonthStatus[],
  rates: YearRates,
): Taxed[] => {
  // The limit counts every hryvnia from 1 January, whatever the group.
  const ordered = [...incomes].sort((one, other) =>
    compareDays(one.day, other.day),
  )

  return ordered.reduce<{ before: Kop; rows: Taxed[] }>(
    (state, income) => {
      const status = months[monthOf(income.day) - 1]
      const row: Taxed = {
        month: monthOf(income.day),
        quarter: quarterOf(income.day),
        uah: income.uah,
        excess: 0,
        singleTaxExact: 0,
        levyExact: 0,
      }
      if (!status.group) {
        return { before: state.before, rows: [...state.rows, row] }
      }

      const room = Math.max(rates.limit[status.group] - state.before, 0)
      const within = Math.min(room, income.uah)
      const excess = income.uah - within
      const taxed = !status.onService

      // Group 3 pays a share of every hryvnia, 15% over the limit, and the
      // 1% levy on all of it. Groups 1–2 pay 15% on the excess only.
      const percent = status.vat
        ? rates.singleTaxPercent.vat
        : rates.singleTaxPercent.base
      const singleTaxExact =
        status.group === 3
          ? within * percent + excess * rates.excessPercent
          : excess * rates.excessPercent
      const levyExact = status.group === 3 ? income.uah * rates.levyPercent : 0

      return {
        before: state.before + income.uah,
        rows: [
          ...state.rows,
          {
            ...row,
            excess,
            singleTaxExact: taxed ? singleTaxExact : 0,
            levyExact: taxed ? levyExact : 0,
          },
        ],
      }
    },
    { before: 0, rows: [] },
  ).rows
}

/**
 * Rounded the way a group-3 return is filled in: the tax on the income from
 * 1 January, minus what was counted before. Done by month; a quarter is the sum of its months, which by
 * the same telescoping equals the return's quarterly figure.
 */
const cumulativeRounded = (exactByPeriod: number[]): Kop[] =>
  exactByPeriod.map((_, index) => {
    const upTo = sum(exactByPeriod.slice(0, index + 1))
    const before = sum(exactByPeriod.slice(0, index))
    return roundKop(upTo / 100) - roundKop(before / 100)
  })

/** Every sum of one year for this profile and these incomes. */
export const summarizeYear = (
  profile: Profile,
  incomes: Income[],
  year: number,
): YearSummary => {
  const rates = ratesFor(year, profile.overrides[String(year)])
  const statuses = Array.from({ length: 12 }, (_, index) =>
    monthStatus(profile, rates, year, index + 1),
  )
  const ofYear = incomes.filter(
    income => yearOf(income.day) === year && income.day >= profile.registeredOn,
  )
  const taxed = taxIncomes(ofYear, statuses, rates)

  const byMonth = (pick: (row: Taxed) => number) =>
    statuses.map(status =>
      sum(taxed.filter(row => row.month === status.month).map(pick)),
    )
  const incomeByMonth = byMonth(row => row.uah)
  const shareTax = cumulativeRounded(byMonth(row => row.singleTaxExact))
  const shareLevy = cumulativeRounded(byMonth(row => row.levyExact))
  const months: MonthStatus[] = statuses.map((status, index) => ({
    ...status,
    income: incomeByMonth[index],
    shareTax: shareTax[index],
    shareLevy: shareLevy[index],
  }))

  const byQuarter = (pick: (row: Taxed) => number) =>
    QUARTERS.map(quarter =>
      sum(taxed.filter(row => row.quarter === quarter).map(pick)),
    )
  const incomeByQuarter = byQuarter(row => row.uah)
  const excessByQuarter = byQuarter(row => row.excess)

  const quarters = QUARTERS.map((quarter, index): QuarterSummary => {
    const own = months.slice(index * 3, index * 3 + 3)
    const singleTax = sum(own.map(month => month.singleTax + month.shareTax))
    const levy = sum(own.map(month => month.levy + month.shareLevy))
    const esv = sum(own.map(month => month.esv))
    const last = [...own].reverse().find(month => month.group !== null)

    return {
      quarter,
      group: last?.group ?? null,
      income: incomeByQuarter[index],
      excess: excessByQuarter[index],
      cumulativeIncome: sum(incomeByQuarter.slice(0, index + 1)),
      singleTax,
      levy,
      esv,
      total: singleTax + levy + esv,
      months: own,
    }
  })

  const limitGroup =
    [...months].reverse().find(month => month.group !== null)?.group ?? null

  return {
    year,
    rates,
    quarters,
    income: sum(quarters.map(quarter => quarter.income)),
    singleTax: sum(quarters.map(quarter => quarter.singleTax)),
    levy: sum(quarters.map(quarter => quarter.levy)),
    esv: sum(quarters.map(quarter => quarter.esv)),
    total: sum(quarters.map(quarter => quarter.total)),
    limitGroup,
    limit: limitGroup ? rates.limit[limitGroup] : 0,
    excess: sum(excessByQuarter),
  }
}
