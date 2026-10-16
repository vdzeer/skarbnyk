import { daysBetween, type DayKey, type Obligation, type Quarter } from '~/core'
import type { Translate, TranslationKey } from '~/services/i18n'

export const QUARTER_NAMES: Record<Quarter, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
}

const MONTH_KEYS: TranslationKey[] = [
  'month_1',
  'month_2',
  'month_3',
  'month_4',
  'month_5',
  'month_6',
  'month_7',
  'month_8',
  'month_9',
  'month_10',
  'month_11',
  'month_12',
]

export const monthName = (t: Translate, month: number) =>
  t(MONTH_KEYS[month - 1])

/** «липень–вересень». */
export const quarterMonths = (t: Translate, quarter: Quarter) =>
  t('quarter_months', {
    from: monthName(t, quarter * 3 - 2),
    to: monthName(t, quarter * 3),
  })

/** «за III квартал 2026», «за жовтень 2026», «за 2026 рік». */
export const periodLabel = (t: Translate, obligation: Obligation) => {
  const { period, year } = obligation
  if (period.unit === 'month') {
    return t('period_month', { month: monthName(t, period.index), year })
  }
  if (period.unit === 'quarter' && obligation.months) {
    const [first] = obligation.months
    const last = obligation.months[obligation.months.length - 1]
    return first === last
      ? t('period_month', { month: monthName(t, first), year })
      : t('period_months', {
          from: monthName(t, first),
          to: monthName(t, last),
          year,
        })
  }
  if (period.unit === 'quarter') {
    return t('period_quarter', { quarter: QUARTER_NAMES[period.index], year })
  }
  return t('period_year', { year })
}

/**
 * A return names the time it covers from 1 January: the first quarter, the
 * half-year, nine months, the year.
 */
const returnPeriod = (t: Translate, obligation: Obligation) => {
  const { period, year } = obligation
  if (period.unit !== 'quarter' || period.index === 4) {
    return t('return_year', { year })
  }
  const keys: Record<1 | 2 | 3, TranslationKey> = {
    1: 'return_q1',
    2: 'return_q2',
    3: 'return_q3',
  }
  return t(keys[period.index], { year })
}

/** What the user has to do, in a few words. */
export const obligationTitle = (t: Translate, obligation: Obligation) => {
  if (obligation.kind === 'declaration') {
    return obligation.period.unit === 'year'
      ? t('obligation_return_yearly', { year: obligation.year })
      : t('obligation_return', { period: returnPeriod(t, obligation) })
  }
  const keys: Record<
    Exclude<Obligation['kind'], 'declaration'>,
    TranslationKey
  > = {
    single_tax: 'obligation_single_tax',
    levy: 'obligation_levy',
    esv: 'obligation_esv',
  }
  return t(keys[obligation.kind], { period: periodLabel(t, obligation) })
}

/** The payment purpose field of a tax payment: `*;101;РНОКПП;текст;;;`. */
export const paymentPurpose = (
  t: Translate,
  obligation: Obligation,
  taxId: string,
) =>
  `*;101;${taxId || t('purpose_tax_id')};${obligationTitle(t, obligation)};;;`

/**
 * The day to count down to: the plan's, or, once a monthly plan has slipped,
 * the law's, which is the one that still matters.
 */
export const countdownDay = (obligation: Obligation, today: DayKey) =>
  obligation.due < today && obligation.legalDue >= today
    ? obligation.legalDue
    : obligation.due

/** «сьогодні», «завтра», «лишилося днів: 6», «прострочено, днів: 3». */
export const dueLabel = (t: Translate, due: DayKey, today: DayKey) => {
  const days = daysBetween(today, due)
  if (days === 0) return t('due_today')
  if (days === 1) return t('due_tomorrow')
  return days > 0
    ? t('due_in', { days })
    : t('due_overdue', { days: Math.abs(days) })
}

/** The quarter an obligation belongs to; null for a yearly one. */
export const quarterOfObligation = (obligation: Obligation): Quarter | null => {
  const { period } = obligation
  if (period.unit === 'quarter') return period.index
  if (period.unit === 'month') return Math.ceil(period.index / 3) as Quarter
  return null
}
