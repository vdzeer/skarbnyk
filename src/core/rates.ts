import { LAW, LAW_YEARS, LIMIT_WAGES, PERCENT } from './law'
import { percentOf, type Kop } from './money'
import type { Group, RateOverrides } from './types'

/** Every number the calculator uses for one year, after the user's changes. */
export type YearRates = {
  year: number
  /** The law for this year is not in the table: the nearest year's is used. */
  estimated: boolean
  /** The year whose law the numbers come from. */
  lawYear: number
  /** By month, index 0 is January. */
  minWage: Kop[]
  minWageJan: Kop
  limit: Record<Group, Kop>
  /** Groups 1 and 2, a month: the maximum unless the user set their council's. */
  singleTaxMonthly: { 1: Kop; 2: Kop }
  /** Group 3. */
  singleTaxPercent: { base: number; vat: number }
  excessPercent: number
  /** Groups 1 and 2, a month; 0 in a year without the levy. */
  levyMonthly: Kop
  /** Group 3; 0 in a year without the levy. */
  levyPercent: number
  /** The least and the most ЄСВ for each month. */
  esvMin: Kop[]
  esvMax: Kop[]
}

const nearestLawYear = (year: number) =>
  LAW_YEARS.reduce((best, candidate) =>
    Math.abs(candidate - year) < Math.abs(best - year) ? candidate : best,
  )

export const ratesFor = (
  year: number,
  overrides: RateOverrides = {},
): YearRates => {
  const lawYear = LAW[year] ? year : nearestLawYear(year)
  const law = LAW[lawYear]

  const minWage =
    overrides.minWage === undefined
      ? [...law.minWage]
      : Array<Kop>(12).fill(overrides.minWage)
  const minWageJan = minWage[0]

  const limitFor = (group: Group) =>
    overrides.limit ?? minWageJan * LIMIT_WAGES[group]

  const levyOn = law.levy

  return {
    year,
    estimated: lawYear !== year,
    lawYear,
    minWage,
    minWageJan,
    limit: { 1: limitFor(1), 2: limitFor(2), 3: limitFor(3) },
    singleTaxMonthly: {
      1:
        overrides.singleTaxMonthly ??
        percentOf(law.subsistence, PERCENT.group1OfSubsistence),
      2:
        overrides.singleTaxMonthly ??
        percentOf(minWageJan, PERCENT.group2OfMinWage),
    },
    singleTaxPercent: {
      base: overrides.singleTaxPercent ?? PERCENT.group3,
      vat: overrides.singleTaxPercent ?? PERCENT.group3Vat,
    },
    excessPercent: PERCENT.excess,
    levyMonthly: levyOn
      ? (overrides.levyMonthly ?? percentOf(minWageJan, PERCENT.levyOfMinWage))
      : 0,
    levyPercent: levyOn ? (overrides.levyPercent ?? PERCENT.levyGroup3) : 0,
    esvMin: minWage.map(wage => percentOf(wage, PERCENT.esv)),
    esvMax: minWage.map(wage =>
      percentOf(wage * law.esvMaxBaseWages, PERCENT.esv),
    ),
  }
}
