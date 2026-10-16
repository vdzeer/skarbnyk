import {
  EARLIEST_DAY,
  convert,
  isDayKey,
  type Currency,
  type DayKey,
  type Income,
  type Kop,
} from '~/core'
import {
  formatRate,
  moneyInput,
  parseMoney,
  parseRate,
} from '~/services/format'

/** What the form holds: text as typed, so a half-typed number is not lost. */
export type IncomeDraft = {
  day: DayKey
  currency: Currency
  amount: string
  rate: string
  /** The rate came from the user, not from the NBU. */
  rateManual: boolean
  /** Typed only when it differs from amount × rate. */
  uah: string
  uahManual: boolean
  note: string
}

export type IncomeField = 'day' | 'amount' | 'rate' | 'uah' | 'note'
export type IncomeError = 'required' | 'invalid' | 'future' | 'old' | 'long'
export type IncomeErrors = Partial<Record<IncomeField, IncomeError>>

export const NOTE_MAX = 200

export const emptyDraft = (today: DayKey): IncomeDraft => ({
  day: today,
  currency: 'UAH',
  amount: '',
  rate: '',
  rateManual: false,
  uah: '',
  uahManual: false,
  note: '',
})

export const draftFromIncome = (income: Income): IncomeDraft => ({
  day: income.day,
  currency: income.currency,
  amount: moneyInput(income.amount),
  rate: income.rate === null ? '' : formatRate(income.rate),
  rateManual: true,
  uah: moneyInput(income.uah),
  uahManual:
    income.rate !== null && convert(income.amount, income.rate) !== income.uah,
  note: income.note,
})

/** Hryvnias as amount × rate, or null while either is not a number yet. */
export const computedUah = (draft: IncomeDraft): Kop | null => {
  const amount = parseMoney(draft.amount)
  if (amount === null) return null
  if (draft.currency === 'UAH') return amount
  const rate = parseRate(draft.rate)
  return rate === null ? null : convert(amount, rate)
}

export type ReadDraft =
  { ok: true; value: Omit<Income, 'id'> } | { ok: false; errors: IncomeErrors }

/** The income the draft describes, or what is wrong with it, field by field. */
export const readDraft = (draft: IncomeDraft, today: DayKey): ReadDraft => {
  const errors: IncomeErrors = {}
  const foreign = draft.currency !== 'UAH'

  if (!isDayKey(draft.day)) errors.day = 'required'
  else if (draft.day > today) errors.day = 'future'
  else if (draft.day < EARLIEST_DAY) errors.day = 'old'

  const amount = parseMoney(draft.amount)
  if (draft.amount.trim() === '') errors.amount = 'required'
  else if (amount === null || amount === 0) errors.amount = 'invalid'

  const rate = foreign ? parseRate(draft.rate) : null
  if (foreign && draft.rate.trim() === '') errors.rate = 'required'
  else if (foreign && rate === null) errors.rate = 'invalid'

  const manualUah =
    foreign && draft.uahManual ? parseMoney(draft.uah) : undefined
  if (manualUah === null || manualUah === 0) errors.uah = 'invalid'

  if (draft.note.length > NOTE_MAX) errors.note = 'long'

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const uah =
    manualUah ?? (foreign ? convert(amount as Kop, rate as number) : amount)

  return {
    ok: true,
    value: {
      day: draft.day,
      currency: draft.currency,
      amount: amount as Kop,
      rate,
      uah: uah as Kop,
      note: draft.note.trim(),
    },
  }
}
