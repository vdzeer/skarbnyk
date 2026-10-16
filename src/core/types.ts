import type { DayKey } from './dates'
import type { Kop } from './money'

export const GROUPS = [1, 2, 3] as const
export type Group = (typeof GROUPS)[number]

export const CURRENCIES = ['UAH', 'USD', 'EUR'] as const
export type Currency = (typeof CURRENCIES)[number]

/** Money that reached the account. The tax base is `uah`, whatever the currency. */
export type Income = {
  id: string
  /** The day it was credited to the account. */
  day: DayKey
  /** In the currency's own minor units: kopecks or cents. */
  amount: Kop
  currency: Currency
  /** Hryvnias per unit; null for hryvnias. */
  rate: number | null
  uah: Kop
  note: string
}

/** From `from` on, the FOP is on `group` (and, on the 3rd, a VAT payer or not). */
export type GroupPeriod = {
  from: DayKey
  group: Group
  vat: boolean
}

export const ESV_MODES = ['minimum', 'custom', 'exempt'] as const
export type EsvMode = (typeof ESV_MODES)[number]

/**
 * Why a FOP pays no ЄСВ for themselves: a pension or disability (from the
 * month after the status), or an employer that pays at least the minimum.
 * Military service is its own setting, because it frees the taxes too.
 */
export const ESV_EXEMPTIONS = ['pensioner', 'disability', 'employed'] as const
export type EsvExemption = (typeof ESV_EXEMPTIONS)[number]

export type EsvSettings = {
  mode: EsvMode
  /** The monthly sum when the mode is `custom`. */
  monthly: Kop
  exemption: EsvExemption | null
  /** With `exempt`: the first day of the first month without ЄСВ. */
  since: DayKey | null
}

/**
 * Mobilised or serving under contract: no single tax, military levy or ЄСВ
 * from the first day of the month of call-up to the last day of the month of
 * demobilisation. `to` is null while the service goes on.
 */
export type ServicePeriod = {
  from: DayKey
  to: DayKey | null
}

/** What the user changed against the law's numbers for one year. */
export type RateOverrides = {
  /** Group 3, percent of income. */
  singleTaxPercent?: number
  /** Groups 1 and 2, a month. */
  singleTaxMonthly?: Kop
  /** Group 3, percent of income. */
  levyPercent?: number
  /** Groups 1 and 2, a month. */
  levyMonthly?: Kop
  minWage?: Kop
  limit?: Kop
}

/** Where one kind of payment goes. */
export type Account = {
  iban: string
  recipient: string
  /** ЄДРПОУ of the recipient. */
  code: string
}

export type Requisites = {
  /** The payer's РНОКПП, which goes into the payment purpose. */
  taxId: string
  singleTax: Account
  levy: Account
  esv: Account
}

export type Profile = {
  registeredOn: DayKey
  /**
   * The app tracks payments from this day. What fell due before it was
   * handled outside the app and is not shown as owed.
   */
  trackFrom: DayKey
  /** Sorted by `from`; the first one starts on the registration day. */
  periods: GroupPeriod[]
  esv: EsvSettings
  service: ServicePeriod | null
  paySchedule: PaySchedule
  /**
   * The day monthly paying was chosen. Months whose payment date had already
   * passed by then stay with the quarter's legal date.
   */
  monthlySince: DayKey
  /** Keyed by year, `'2026'`. */
  overrides: Record<string, RateOverrides>
  requisites: Requisites
}

/**
 * The law's deadlines are quarterly; paying monthly, ahead of them, is the
 * user's own choice.
 */
export const PAY_SCHEDULES = ['quarterly', 'monthly'] as const
export type PaySchedule = (typeof PAY_SCHEDULES)[number]

export const MARK_KINDS = ['paid', 'filed'] as const
export type MarkKind = (typeof MARK_KINDS)[number]

/** The user's note that an obligation is done. */
export type Mark = {
  id: string
  /** `Obligation.id` it closes. */
  obligation: string
  kind: MarkKind
  day: DayKey
  amount: Kop | null
}
