import { sum, type Kop, type Obligation, type YearSummary } from '~/core'

export type DeclarationNumbers = {
  /** From 1 January to the end of the period. */
  income: Kop
  singleTax: Kop
  levy: Kop
  /** The ЄСВ annex: the year's total, on the return that carries it. */
  esv: Kop | null
}

/**
 * The sums a return asks for. A group-3 return counts from 1 January; the
 * yearly one of groups 1–2 covers the whole year.
 */
export const declarationNumbers = (
  obligation: Obligation,
  summary: YearSummary,
): DeclarationNumbers => {
  const upTo =
    obligation.period.unit === 'quarter' ? obligation.period.index : 4
  const quarters = summary.quarters.slice(0, upTo)

  return {
    income: sum(quarters.map(quarter => quarter.income)),
    singleTax: sum(quarters.map(quarter => quarter.singleTax)),
    levy: sum(quarters.map(quarter => quarter.levy)),
    esv: obligation.esvAnnex ? summary.esv : null,
  }
}
