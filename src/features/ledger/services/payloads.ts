import {
  CURRENCIES,
  ESV_EXEMPTIONS,
  ESV_MODES,
  GROUPS,
  MARK_KINDS,
  PAY_SCHEDULES,
  isDayKey,
  isKop,
  type Account,
  type GroupPeriod,
  type Income,
  type Mark,
  type Profile,
  type RateOverrides,
  type Requisites,
  type ServicePeriod,
} from '~/core'

/**
 * What sits inside an envelope once it is opened. It came from this app, but
 * from some version of it on some device, so it is checked like anything
 * untrusted: a payload of the wrong shape is dropped, never half-read.
 *
 * This file knows nothing about Firebase or crypto, so it is tested alone.
 */

type Data = Record<string, unknown>

const isObject = (value: unknown): value is Data =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isString = (value: unknown, max = 200): value is string =>
  typeof value === 'string' && value.length <= max

const oneOf = <Value>(options: readonly Value[], value: unknown) =>
  options.includes(value as Value)

const isNonNegativeKop = (value: unknown) => isKop(value) && value >= 0

const isRate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

const isPercent = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= 100

// ---- incomes ---------------------------------------------------------------

export type IncomePayload = Omit<Income, 'id'>

export const incomeToPayload = (income: Income): IncomePayload => ({
  day: income.day,
  amount: income.amount,
  currency: income.currency,
  rate: income.rate,
  uah: income.uah,
  note: income.note,
})

export const incomeFromPayload = (id: string, data: unknown): Income | null => {
  if (!isObject(data)) return null
  const { day, amount, currency, rate, uah, note } = data
  if (!isDayKey(day) || !oneOf(CURRENCIES, currency)) return null
  if (!isNonNegativeKop(amount) || !isNonNegativeKop(uah)) return null
  if (currency === 'UAH' ? rate !== null : !isRate(rate)) return null
  if (!isString(note, 200)) return null

  return {
    id,
    day,
    amount: amount as number,
    currency: currency as Income['currency'],
    rate: rate as number | null,
    uah: uah as number,
    note,
  }
}

// ---- marks -----------------------------------------------------------------

export type MarkPayload = Omit<Mark, 'id'>

export const markToPayload = (mark: Mark): MarkPayload => ({
  obligation: mark.obligation,
  kind: mark.kind,
  day: mark.day,
  amount: mark.amount,
})

export const markFromPayload = (id: string, data: unknown): Mark | null => {
  if (!isObject(data)) return null
  const { obligation, kind, day, amount } = data
  if (!isString(obligation, 60) || obligation === '') return null
  if (!oneOf(MARK_KINDS, kind) || !isDayKey(day)) return null
  if (amount !== null && !isNonNegativeKop(amount)) return null

  return {
    id,
    obligation,
    kind: kind as Mark['kind'],
    day,
    amount: amount as number | null,
  }
}

// ---- profile ---------------------------------------------------------------

const periodFrom = (value: unknown): GroupPeriod | null => {
  if (!isObject(value)) return null
  const { from, group, vat } = value
  if (!isDayKey(from) || !oneOf(GROUPS, group) || typeof vat !== 'boolean') {
    return null
  }
  return { from, group: group as GroupPeriod['group'], vat }
}

const OVERRIDE_CHECKS: Record<
  keyof RateOverrides,
  (value: unknown) => boolean
> = {
  singleTaxPercent: isPercent,
  singleTaxMonthly: isNonNegativeKop,
  levyPercent: isPercent,
  levyMonthly: isNonNegativeKop,
  minWage: isNonNegativeKop,
  limit: isNonNegativeKop,
}

/** Unknown keys and values of the wrong kind are dropped one by one. */
const overridesFrom = (value: unknown): Record<string, RateOverrides> => {
  if (!isObject(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .filter(([year, entry]) => /^\d{4}$/.test(year) && isObject(entry))
      .map(([year, entry]) => [
        year,
        Object.fromEntries(
          Object.entries(entry as Data).filter(
            ([key, field]) =>
              key in OVERRIDE_CHECKS &&
              OVERRIDE_CHECKS[key as keyof RateOverrides](field),
          ),
        ) as RateOverrides,
      ]),
  )
}

const EMPTY_ACCOUNT: Account = { iban: '', recipient: '', code: '' }

const accountFrom = (value: unknown): Account => {
  if (!isObject(value)) return EMPTY_ACCOUNT
  const { iban, recipient, code } = value
  return {
    iban: isString(iban, 40) ? iban : '',
    recipient: isString(recipient, 200) ? recipient : '',
    code: isString(code, 12) ? code : '',
  }
}

export const EMPTY_REQUISITES: Requisites = {
  taxId: '',
  singleTax: EMPTY_ACCOUNT,
  levy: EMPTY_ACCOUNT,
  esv: EMPTY_ACCOUNT,
}

const requisitesFrom = (value: unknown): Requisites => {
  if (!isObject(value)) return EMPTY_REQUISITES
  return {
    taxId: isString(value.taxId, 12) ? value.taxId : '',
    singleTax: accountFrom(value.singleTax),
    levy: accountFrom(value.levy),
    esv: accountFrom(value.esv),
  }
}

const serviceFrom = (value: unknown): ServicePeriod | null => {
  if (!isObject(value) || !isDayKey(value.from)) return null
  if (value.to !== null && !isDayKey(value.to)) return null
  return { from: value.from, to: value.to as string | null }
}

export const profileToPayload = (profile: Profile) => profile

export const profileFromPayload = (data: unknown): Profile | null => {
  if (!isObject(data)) return null
  const { registeredOn, periods, esv } = data
  if (!isDayKey(registeredOn) || !Array.isArray(periods)) return null

  const parsed = periods.map(periodFrom)
  if (parsed.length === 0 || parsed.some(period => period === null)) {
    return null
  }

  if (!isObject(esv) || !oneOf(ESV_MODES, esv.mode)) return null
  if (!isNonNegativeKop(esv.monthly)) return null
  if (esv.exemption !== null && !oneOf(ESV_EXEMPTIONS, esv.exemption)) {
    return null
  }
  if (esv.since !== null && !isDayKey(esv.since)) return null

  return {
    registeredOn,
    trackFrom: isDayKey(data.trackFrom) ? data.trackFrom : registeredOn,
    periods: (parsed as GroupPeriod[]).sort((one, other) =>
      one.from.localeCompare(other.from),
    ),
    esv: {
      mode: esv.mode as Profile['esv']['mode'],
      monthly: esv.monthly as number,
      exemption: esv.exemption as Profile['esv']['exemption'],
      since: esv.since as string | null,
    },
    service: serviceFrom(data.service),
    paySchedule: oneOf(PAY_SCHEDULES, data.paySchedule)
      ? (data.paySchedule as Profile['paySchedule'])
      : 'quarterly',
    monthlySince: isDayKey(data.monthlySince) ? data.monthlySince : '',
    overrides: overridesFrom(data.overrides),
    requisites: requisitesFrom(data.requisites),
  }
}
