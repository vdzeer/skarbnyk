import type { Income, Mark, Profile } from '~/core'

import {
  incomeFromPayload,
  incomeToPayload,
  markFromPayload,
  markToPayload,
  profileFromPayload,
} from '../payloads'

const INCOME: Income = {
  id: 'income-1',
  day: '2026-10-02',
  amount: 350000,
  currency: 'USD',
  rate: 44.8333,
  uah: 15691655,
  note: 'Acme Corp, рахунок 41',
}

const PROFILE: Profile = {
  registeredOn: '2021-03-15',
  trackFrom: '2026-10-14',
  periods: [
    { from: '2026-07-01', group: 3, vat: false },
    { from: '2021-03-15', group: 2, vat: false },
  ],
  esv: { mode: 'minimum', monthly: 0, exemption: null, since: null },
  service: { from: '2026-04-17', to: null },
  paySchedule: 'monthly',
  monthlySince: '2026-10-14',
  overrides: { '2026': { singleTaxMonthly: 120000 } },
  requisites: {
    taxId: '1234567890',
    singleTax: { iban: 'UA00', recipient: 'ГУК', code: '37000000' },
    levy: { iban: '', recipient: '', code: '' },
    esv: { iban: '', recipient: '', code: '' },
  },
}

describe('incomes', () => {
  it('round-trip without the id inside', () => {
    const payload = incomeToPayload(INCOME)
    expect(payload).not.toHaveProperty('id')
    expect(incomeFromPayload('income-1', payload)).toEqual(INCOME)
  })

  it('keep hryvnias without a rate', () => {
    const uah = { ...incomeToPayload(INCOME), currency: 'UAH', rate: null }
    expect(incomeFromPayload('x', uah)?.rate).toBeNull()
  })

  it.each([
    ['not an object', 'income'],
    ['a bad day', { ...incomeToPayload(INCOME), day: '02.10.2026' }],
    ['an unknown currency', { ...incomeToPayload(INCOME), currency: 'PLN' }],
    ['a float amount', { ...incomeToPayload(INCOME), amount: 3500.5 }],
    ['a negative sum', { ...incomeToPayload(INCOME), uah: -1 }],
    [
      'a foreign sum without a rate',
      { ...incomeToPayload(INCOME), rate: null },
    ],
    ['hryvnias with a rate', { ...incomeToPayload(INCOME), currency: 'UAH' }],
    ['a note too long', { ...incomeToPayload(INCOME), note: 'x'.repeat(201) }],
  ])('drop %s', (_label, payload) => {
    expect(incomeFromPayload('x', payload)).toBeNull()
  })
})

describe('marks', () => {
  const MARK: Mark = {
    id: 'mark-1',
    obligation: '2026-q3-esv',
    kind: 'paid',
    day: '2026-10-19',
    amount: 570702,
  }

  it('round-trip', () => {
    expect(markFromPayload('mark-1', markToPayload(MARK))).toEqual(MARK)
  })

  it('drop an unknown kind', () => {
    expect(
      markFromPayload('m', { ...markToPayload(MARK), kind: 'ignored' }),
    ).toBeNull()
  })
})

describe('the profile', () => {
  it('round-trips, with the group periods put in order', () => {
    const read = profileFromPayload(PROFILE)
    expect(read?.periods.map(period => period.group)).toEqual([2, 3])
    expect(read?.service).toEqual({ from: '2026-04-17', to: null })
    expect(read?.paySchedule).toBe('monthly')
    expect(
      profileFromPayload({ ...PROFILE, paySchedule: 'weekly' })?.paySchedule,
    ).toBe('quarterly')
    expect(read?.overrides).toEqual({ '2026': { singleTaxMonthly: 120000 } })
  })

  it('drops overrides it does not know instead of the whole profile', () => {
    const read = profileFromPayload({
      ...PROFILE,
      overrides: { '2026': { singleTaxMonthly: 'a lot', limit: 5 }, x: {} },
    })
    expect(read?.overrides).toEqual({ '2026': { limit: 5 } })
  })

  it.each([
    ['no periods', { ...PROFILE, periods: [] }],
    [
      'a group 4 period',
      { ...PROFILE, periods: [{ from: '2021-03-15', group: 4, vat: false }] },
    ],
    [
      'an unknown ЄСВ mode',
      { ...PROFILE, esv: { ...PROFILE.esv, mode: 'never' } },
    ],
    ['a bad registration day', { ...PROFILE, registeredOn: 'yesterday' }],
  ])('is dropped with %s', (_label, payload) => {
    expect(profileFromPayload(payload)).toBeNull()
  })
})
