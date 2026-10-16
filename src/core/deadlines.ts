import type { MonthStatus, YearSummary } from './calc'
import {
  QUARTERS,
  addDays,
  dayOf,
  isWeekend,
  quarterEnd,
  weekdayOf,
  type DayKey,
  type Quarter,
} from './dates'
import { sum, type Kop } from './money'
import type { Group, Mark, MarkKind, PaySchedule } from './types'

/**
 * Payment and filing deadlines under the Tax Code (ПКУ). The tests pin every
 * 2026 date.
 */

export const OBLIGATION_KINDS = [
  'single_tax',
  'levy',
  'esv',
  'declaration',
] as const
export type ObligationKind = (typeof OBLIGATION_KINDS)[number]

export type ObligationPeriod =
  | { unit: 'month'; index: number }
  | { unit: 'quarter'; index: Quarter }
  | { unit: 'year'; index: 0 }

export type Obligation = {
  /** Stable across sessions: a mark refers to it. */
  id: string
  kind: ObligationKind
  /** What closes it: a payment or a filed report. */
  action: MarkKind
  /** The tax year it belongs to; the date may fall in the next one. */
  year: number
  period: ObligationPeriod
  group: Group
  /** The date to act by: the law's, or the user's monthly plan. */
  due: DayKey
  /** The law's deadline; the same as `due` unless paying monthly ahead. */
  legalDue: DayKey
  /** Null for a report. */
  amount: Kop | null
  /** The return carries the ЄСВ annex: the yearly one for groups 1–2, Q4 for group 3. */
  esvAnnex: boolean
  /**
   * Part of a quarter only: the months left over when monthly paying began
   * mid-quarter. Null when the obligation covers its whole period.
   */
  months: number[] | null
}

/**
 * While martial law lasts, public holidays are working days for tax dates,
 * so only Saturday and Sunday move a deadline.
 */
const isDayOff = isWeekend

/** A deadline on a day off moves to the next working day. */
export const nextWorkingDay = (day: DayKey): DayKey =>
  isDayOff(day) ? nextWorkingDay(addDays(day, 1)) : day

/**
 * Groups 1–2 advances are not moved forward: on a weekend the tax office
 * dates them on the Friday before.
 */
export const advanceDue = (year: number, month: number): DayKey => {
  const twentieth = dayOf(year, month, 20)
  const weekday = weekdayOf(twentieth)
  if (weekday === 6) return addDays(twentieth, -1)
  if (weekday === 0) return addDays(twentieth, -2)
  return twentieth
}

/** Group 3: the return 40 days after the quarter, moved off a weekend. */
export const quarterReturnDue = (year: number, quarter: Quarter) =>
  nextWorkingDay(addDays(quarterEnd(year, quarter), 40))

/** Group 3: payment 10 days after the unmoved return date, then moved. */
export const quarterPaymentDue = (year: number, quarter: Quarter) =>
  nextWorkingDay(addDays(quarterEnd(year, quarter), 50))

/** Groups 1–2: the yearly return 60 days after 31 December, moved. */
export const yearReturnDue = (year: number) =>
  nextWorkingDay(addDays(dayOf(year, 12, 31), 60))

/** ЄСВ: by the 20th of the month after the quarter, moved forward. */
export const esvDue = (year: number, quarter: Quarter) =>
  quarter === 4
    ? nextWorkingDay(dayOf(year + 1, 1, 20))
    : nextWorkingDay(dayOf(year, quarter * 3 + 1, 20))

const pad = (value: number) => String(value).padStart(2, '0')

const obligationId = (
  year: number,
  period: ObligationPeriod,
  kind: ObligationKind,
) => {
  if (period.unit === 'month') return `${year}-m${pad(period.index)}-${kind}`
  if (period.unit === 'quarter') return `${year}-q${period.index}-${kind}`
  return `${year}-y-${kind}`
}

const make = (
  year: number,
  period: ObligationPeriod,
  kind: ObligationKind,
  group: Group,
  due: DayKey,
  amount: Kop | null,
  options: { esvAnnex?: boolean; legalDue?: DayKey; months?: number[] } = {},
): Obligation => ({
  id: obligationId(year, period, kind),
  kind,
  action: kind === 'declaration' ? 'filed' : 'paid',
  year,
  period,
  group,
  due,
  legalDue: options.legalDue ?? due,
  amount,
  esvAnnex: options.esvAnnex ?? false,
  months: options.months ?? null,
})

/**
 * Paying monthly is paying ahead: the month's share by the 20th of the next
 * month, the same day ЄСВ for a quarter falls due. The law's quarterly date
 * still stands beside it.
 */
export const monthlyPlanDue = (year: number, month: number) =>
  month === 12
    ? nextWorkingDay(dayOf(year + 1, 1, 20))
    : nextWorkingDay(dayOf(year, month + 1, 20))

const KIND_ORDER: Record<ObligationKind, number> = {
  declaration: 0,
  single_tax: 1,
  levy: 2,
  esv: 3,
}

/**
 * Everything owed for one tax year, in date order. Nothing is owed for zero.
 * With a monthly schedule the quarter's payments are split by month; the
 * returns stay quarterly.
 */
/**
 * What one month owes when paid on its own: group 3's share of its income
 * and the military levy, and ЄСВ for any group. Due by the 20th of the next
 * month; the quarter's legal dates stand beside it.
 */
const monthItems = (
  year: number,
  quarter: Quarter,
  month: MonthStatus,
  group: Group,
): Obligation[] => {
  const byMonth = { unit: 'month', index: month.month } as const
  const due = monthlyPlanDue(year, month.month)
  const legalPayment = { legalDue: quarterPaymentDue(year, quarter) }
  const legalEsv = { legalDue: esvDue(year, quarter) }
  const owner = month.group ?? group
  return [
    ...(owner === 3 && month.shareTax > 0
      ? [
          make(
            year,
            byMonth,
            'single_tax',
            owner,
            due,
            month.shareTax,
            legalPayment,
          ),
        ]
      : []),
    ...(owner === 3 && month.shareLevy > 0
      ? [make(year, byMonth, 'levy', owner, due, month.shareLevy, legalPayment)]
      : []),
    ...(month.esv > 0
      ? [make(year, byMonth, 'esv', owner, due, month.esv, legalEsv)]
      : []),
  ]
}

const MONTH_ID = /^(\d{4})-m(\d{2})-(single_tax|levy|esv)$/

/**
 * Months the user paid on their own from a quarterly schedule: a "paid" mark
 * on a month's ЄСВ, or on a group-3 month's tax or levy. (A group 1–2 tax
 * is monthly anyway, so its mark says nothing about splitting.)
 */
const monthsPaidAlone = (summary: YearSummary, marks: Mark[]) => {
  const months = summary.quarters.flatMap(quarter => quarter.months)
  return new Set(
    marks
      .filter(mark => mark.kind === 'paid')
      .map(mark => MONTH_ID.exec(mark.obligation))
      .filter((match): match is RegExpExecArray => match !== null)
      .filter(match => Number(match[1]) === summary.year)
      .filter(
        match =>
          match[3] === 'esv' || months[Number(match[2]) - 1]?.group === 3,
      )
      .map(match => Number(match[2])),
  )
}

/** The payments of one month, as they are when it is paid on its own. */
export const monthPayments = (
  summary: YearSummary,
  month: number,
): Obligation[] => {
  const quarter = Math.ceil(month / 3) as Quarter
  const status = summary.quarters[quarter - 1].months[(month - 1) % 3]
  const group = status.group ?? summary.quarters[quarter - 1].group
  return group === null ? [] : monthItems(summary.year, quarter, status, group)
}

/**
 * Everything owed for one tax year, in date order. Nothing is owed for zero.
 * A month comes out of its quarter when the schedule is monthly or the user
 * paid that month on its own; the rest of the quarter keeps the legal date.
 * Returns stay quarterly.
 */
export const obligationsFor = (
  summary: YearSummary,
  schedule: PaySchedule = 'quarterly',
  monthlySince: DayKey = '',
  marks: Mark[] = [],
): Obligation[] => {
  const { year } = summary
  const monthly = schedule === 'monthly'
  const paidAlone = monthsPaidAlone(summary, marks)
  const ownMonth = (month: number) =>
    paidAlone.has(month) ||
    (monthly && monthlyPlanDue(year, month) >= monthlySince)

  const perQuarter = QUARTERS.flatMap(quarter => {
    const own = summary.quarters[quarter - 1]
    if (own.group === null) return []
    const group = own.group
    const period = { unit: 'quarter', index: quarter } as const
    const items: Obligation[] = []

    // What the quarter owes on top of the fixed monthly sums: group 3's share
    // of income, or 15% on a group 1–2 excess over the limit.
    const shareTax = own.months.reduce((total, m) => total + m.shareTax, 0)
    const shareLevy = own.months.reduce((total, m) => total + m.shareLevy, 0)
    const legalPayment = quarterPaymentDue(year, quarter)

    if (group === 3 || shareTax > 0) {
      items.push(
        make(
          year,
          period,
          'declaration',
          group,
          quarterReturnDue(year, quarter),
          null,
          { esvAnnex: group === 3 && quarter === 4 },
        ),
      )
    }

    // The months paid on their own, and what is left for the quarter's date.
    const split = own.months.filter(month => ownMonth(month.month))
    const rest = own.months.filter(month => !ownMonth(month.month))
    const sumOf = (
      months: typeof rest,
      pick: (m: (typeof rest)[number]) => Kop,
    ) => months.reduce((total, month) => total + pick(month), 0)

    split.forEach(month =>
      items.push(...monthItems(year, quarter, month, group)),
    )

    // When some months went their own way, the rest is named by its months.
    const partial =
      split.length > 0 && rest.length > 0
        ? { months: rest.map(month => month.month) }
        : {}
    const restTax = group === 3 ? sumOf(rest, m => m.shareTax) : shareTax
    const restLevy = group === 3 ? sumOf(rest, m => m.shareLevy) : shareLevy
    if (restTax > 0) {
      items.push(
        make(year, period, 'single_tax', group, legalPayment, restTax, partial),
      )
    }
    if (restLevy > 0) {
      items.push(
        make(year, period, 'levy', group, legalPayment, restLevy, partial),
      )
    }
    const restEsv = sumOf(rest, m => m.esv)
    if (restEsv > 0) {
      items.push(
        make(
          year,
          period,
          'esv',
          group,
          esvDue(year, quarter),
          restEsv,
          partial,
        ),
      )
    }
    return items
  })

  const months = summary.quarters.flatMap(quarter => quarter.months)
  const perMonth = months.flatMap(month => {
    if (month.group === null || month.group === 3) return []
    const period = { unit: 'month', index: month.month } as const
    const due = advanceDue(year, month.month)
    return [
      ...(month.singleTax > 0
        ? [make(year, period, 'single_tax', month.group, due, month.singleTax)]
        : []),
      ...(month.levy > 0
        ? [make(year, period, 'levy', month.group, due, month.levy)]
        : []),
    ]
  })

  const fixedGroup = months.find(
    month => month.group !== null && month.group !== 3,
  )?.group
  const perYear = fixedGroup
    ? [
        make(
          year,
          { unit: 'year', index: 0 },
          'declaration',
          fixedGroup,
          yearReturnDue(year),
          null,
          { esvAnnex: true },
        ),
      ]
    : []

  return [...perQuarter, ...perMonth, ...perYear].sort(
    (one, other) =>
      one.due.localeCompare(other.due) ||
      KIND_ORDER[one.kind] - KIND_ORDER[other.kind] ||
      one.id.localeCompare(other.id),
  )
}

export type ObligationStatus = 'done' | 'overdue' | 'soon' | 'upcoming'

/** Within this many days a deadline is shown as close. */
export const SOON_DAYS = 7

export const markFor = (obligation: Obligation, marks: Mark[]) =>
  marks.find(
    mark =>
      mark.obligation === obligation.id && mark.kind === obligation.action,
  ) ?? null

/**
 * How much of a payment the marks cover. A sum entered later for a month
 * already paid makes the obligation larger than what was marked: then only
 * the difference is still owed.
 */
export const paidSoFar = (obligation: Obligation, marks: Mark[]): Kop => {
  const own = marks.filter(
    mark =>
      mark.obligation === obligation.id && mark.kind === obligation.action,
  )
  if (own.some(mark => mark.amount === null)) return obligation.amount ?? 0
  return sum(own.map(mark => mark.amount ?? 0))
}

export const isSettled = (obligation: Obligation, marks: Mark[]) =>
  obligation.amount === null
    ? markFor(obligation, marks) !== null
    : paidSoFar(obligation, marks) >= obligation.amount

export const obligationStatus = (
  obligation: Obligation,
  marks: Mark[],
  today: DayKey,
  trackFrom: DayKey = '',
): ObligationStatus => {
  if (isSettled(obligation, marks)) return 'done'
  if (obligation.legalDue < trackFrom) return 'done'
  // Missing one's own monthly plan is not a debt until the law's date passes.
  if (obligation.legalDue < today) return 'overdue'
  return obligation.due <= addDays(today, SOON_DAYS) ? 'soon' : 'upcoming'
}
