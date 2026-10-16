/**
 * Money is whole kopecks (or cents, for a foreign currency), never a float
 * of hryvnias: 0.1 + 0.2 must not reach a tax return. Rounding happens here
 * and nowhere else.
 */
export type Kop = number

/** Half away from zero, the way a kopeck is rounded on paper. */
export const roundKop = (value: number): Kop =>
  Math.sign(value) * Math.round(Math.abs(value) + Number.EPSILON * 10)

/** `rate` percent of an amount: `percentOf(54921044, 5)` → `2746052`. */
export const percentOf = (amount: Kop, rate: number): Kop =>
  roundKop((amount * rate) / 100)

/** A sum in another currency at a rate in hryvnias per unit. */
export const convert = (amount: Kop, rate: number): Kop =>
  roundKop(amount * rate)

export const sum = (amounts: Kop[]): Kop =>
  amounts.reduce((total, amount) => total + amount, 0)

export const isKop = (value: unknown): value is Kop =>
  typeof value === 'number' && Number.isSafeInteger(value)
