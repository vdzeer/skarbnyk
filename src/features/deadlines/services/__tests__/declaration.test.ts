import {
  obligationsFor,
  summarizeYear,
  type Income,
  type Profile,
} from '~/core'

import { calendarStamp } from '../calendar'
import { declarationNumbers } from '../declaration'

const profile: Profile = {
  registeredOn: '2021-03-15',
  trackFrom: '2021-03-15',
  periods: [{ from: '2021-03-15', group: 3, vat: false }],
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
}

const income = (day: string, uah: number): Income => ({
  id: day,
  day,
  amount: uah,
  currency: 'UAH',
  rate: null,
  uah,
  note: '',
})

describe('declarationNumbers', () => {
  const summary = summarizeYear(
    profile,
    [income('2026-02-10', 1000000), income('2026-08-10', 3000000)],
    2026,
  )
  const returns = obligationsFor(summary).filter(
    item => item.kind === 'declaration',
  )

  it('counts the nine-month return from 1 January', () => {
    const q3 = returns.find(item => item.id === '2026-q3-declaration')
    expect(q3 && declarationNumbers(q3, summary)).toEqual({
      income: 4000000,
      singleTax: 200000,
      levy: 40000,
      esv: null,
    })
  })

  it('puts the year’s ЄСВ on the fourth-quarter return', () => {
    const q4 = returns.find(item => item.id === '2026-q4-declaration')
    expect(q4 && declarationNumbers(q4, summary).esv).toBe(12 * 190234)
  })
})

describe('calendarStamp', () => {
  it('writes a UTC moment the way calendars want it', () => {
    expect(calendarStamp(new Date('2026-10-14T09:05:07.123Z'))).toBe(
      '20261014T090507Z',
    )
  })
})
