import type { Kop } from './money'

/**
 * The numbers the law sets for each year (the State Budget law, the Tax Code
 * and the ЄСВ law). The tests in `__tests__/law.test.ts` repeat every figure,
 * so a change to one without the other fails.
 */
export type YearLaw = {
  /** January first; index 0 is January. Kopecks. */
  minWage: readonly Kop[]
  /** Прожитковий мінімум for working-age people on 1 January. */
  subsistence: Kop
  /** The most ЄСВ is paid on, in minimum wages. */
  esvMaxBaseWages: number
  /** Military levy for single-tax FOPs exists from 2025. */
  levy: boolean
}

const months = (...parts: [Kop, number][]) =>
  parts.flatMap(([amount, count]) => Array<Kop>(count).fill(amount))

export const LAW: Record<number, YearLaw> = {
  2024: {
    minWage: months([710000, 3], [800000, 9]),
    subsistence: 302800,
    esvMaxBaseWages: 15,
    levy: false,
  },
  2025: {
    minWage: months([800000, 12]),
    subsistence: 302800,
    esvMaxBaseWages: 20,
    levy: true,
  },
  2026: {
    minWage: months([864700, 12]),
    subsistence: 332800,
    esvMaxBaseWages: 20,
    levy: true,
  },
}

export const LAW_YEARS = Object.keys(LAW).map(Number)

/** Annual income limits in minimum wages on 1 January (ПКУ 291.4). */
export const LIMIT_WAGES = { 1: 167, 2: 834, 3: 1167 } as const

/** Percents of the law. */
export const PERCENT = {
  /** Group 1 single tax: at most this share of the subsistence minimum. */
  group1OfSubsistence: 10,
  /** Group 2 single tax: at most this share of the January minimum wage. */
  group2OfMinWage: 20,
  group3: 5,
  group3Vat: 3,
  /** On income over the limit. */
  excess: 15,
  /** Groups 1–2 military levy, a share of the January minimum wage. */
  levyOfMinWage: 10,
  /** Group 3 military levy, a share of income. */
  levyGroup3: 1,
  esv: 22,
} as const
