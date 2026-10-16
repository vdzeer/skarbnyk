import { useMemo } from 'react'

import {
  EARLIEST_DAY,
  obligationStatus,
  paidSoFar,
  obligationsFor,
  summarizeYear,
  yearOf,
  type DayKey,
  type Kop,
  type Obligation,
  type ObligationStatus,
  type YearSummary,
} from '~/core'

import { useLedger } from './useLedger'

/**
 * An obligation as the screens show it. `amount` is what is still owed; a
 * part paid earlier (a month that grew after paying) is in `paid`.
 */
export type ObligationRow = Obligation & {
  status: ObligationStatus
  paid: Kop
}

export type Taxes = {
  /** Every year from registration (or the first income) to this one. */
  years: number[]
  summaryOf: (year: number) => YearSummary | null
  /** The obligations of `year`, which may fall due in the next one. */
  obligationsOf: (year: number) => ObligationRow[]
  /** Last year's and this year's, not done, in date order. */
  open: ObligationRow[]
}

const EMPTY: Taxes = {
  years: [],
  summaryOf: () => null,
  obligationsOf: () => [],
  open: [],
}

/** The calculator run over the stored data, once per change. */
export const useTaxes = (today: DayKey): Taxes => {
  const { profile, incomes, marks } = useLedger()

  return useMemo(() => {
    if (!profile) return EMPTY

    const thisYear = yearOf(today)
    const first = Math.max(
      yearOf(EARLIEST_DAY),
      Math.min(
        yearOf(profile.registeredOn),
        ...incomes.map(income => yearOf(income.day)),
        thisYear,
      ),
    )
    const years = Array.from(
      { length: thisYear - first + 1 },
      (_, index) => thisYear - index,
    )

    const summaries = new Map(
      years.map(year => [year, summarizeYear(profile, incomes, year)]),
    )
    const rows = new Map(
      years.map(year => [
        year,
        obligationsFor(
          summaries.get(year) as YearSummary,
          profile.paySchedule,
          profile.monthlySince,
          marks,
        ).map(item => {
          const status = obligationStatus(item, marks, today, profile.trackFrom)
          const paid = item.amount === null ? 0 : paidSoFar(item, marks)
          const owed =
            item.amount === null || status === 'done'
              ? item.amount
              : item.amount - paid
          return { ...item, status, paid, amount: owed }
        }),
      ]),
    )

    const open = [thisYear - 1, thisYear]
      .flatMap(year => rows.get(year) ?? [])
      .filter(item => item.status !== 'done')
      .sort((one, other) => one.due.localeCompare(other.due))

    return {
      years,
      summaryOf: year => summaries.get(year) ?? null,
      obligationsOf: year => rows.get(year) ?? [],
      open,
    }
  }, [profile, incomes, marks, today])
}
