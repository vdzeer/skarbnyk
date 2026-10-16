import {
  addPeriod,
  isQuarterStart,
  periodProblem,
  withRegistration,
} from '../periods'

const PERIODS = [{ from: '2021-03-15', group: 2 as const, vat: false }]

describe('group periods', () => {
  it('change only from the first day of a quarter', () => {
    expect(isQuarterStart('2026-07-01')).toBe(true)
    expect(isQuarterStart('2026-08-01')).toBe(false)
    expect(periodProblem(PERIODS, '2026-08-01')).toBe('not_quarter')
  })

  it('come after the last change', () => {
    expect(periodProblem(PERIODS, '2021-01-01')).toBe('before_last')
    expect(periodProblem(PERIODS, '2026-07-01')).toBeNull()
  })

  it('keep VAT for group 3 only', () => {
    expect(addPeriod(PERIODS, '2026-07-01', 2, true)[1].vat).toBe(false)
    expect(addPeriod(PERIODS, '2026-07-01', 3, true)[1].vat).toBe(true)
  })

  it('start the first period on the registration day', () => {
    expect(withRegistration(PERIODS, '2020-05-05')[0].from).toBe('2020-05-05')
  })
})
