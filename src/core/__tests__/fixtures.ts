import type { DayKey, Group, Income, Profile } from '..'

/** A profile on one group since a date long ago, minimum ЄСВ, no changes. */
export const profileOn = (
  group: Group,
  overrides: Partial<Profile> = {},
): Profile => ({
  registeredOn: '2021-03-15',
  trackFrom: '2021-03-15',
  periods: [{ from: '2021-03-15', group, vat: false }],
  esv: { mode: 'minimum', monthly: 0, exemption: null, since: null },
  service: null,
  paySchedule: 'quarterly',
  monthlySince: '',
  overrides: {},
  requisites: {
    taxId: '',
    singleTax: { iban: '', recipient: '', code: '' },
    levy: { iban: '', recipient: '', code: '' },
    esv: { iban: '', recipient: '', code: '' },
  },
  ...overrides,
})

let counter = 0

/** Hryvnias in, already converted. `uah` is in kopecks. */
export const income = (day: DayKey, uah: number): Income => {
  counter += 1
  return {
    id: `income-${counter}`,
    day,
    amount: uah,
    currency: 'UAH',
    rate: null,
    uah,
    note: '',
  }
}
