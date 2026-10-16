import {
  advanceDue,
  monthPayments,
  paidSoFar,
  esvDue,
  nextWorkingDay,
  obligationStatus,
  obligationsFor,
  quarterPaymentDue,
  quarterReturnDue,
  summarizeYear,
  yearReturnDue,
  type Quarter,
} from '..'

import { income, profileOn } from './fixtures'

// The expected 2026 dates for each group.

describe('group 3 deadlines', () => {
  it.each([
    [2025, 4, '2026-02-09', '2026-02-19'],
    [2026, 1, '2026-05-11', '2026-05-20'],
    [2026, 2, '2026-08-10', '2026-08-19'],
    [2026, 3, '2026-11-09', '2026-11-19'],
    [2026, 4, '2027-02-09', '2027-02-19'],
  ])('%i Q%i: return by %s, payment by %s', (year, quarter, file, pay) => {
    expect(quarterReturnDue(year, quarter as Quarter)).toBe(file)
    expect(quarterPaymentDue(year, quarter as Quarter)).toBe(pay)
  })
})

describe('ЄСВ deadlines', () => {
  it.each([
    [2025, 4, '2026-01-20'],
    [2026, 1, '2026-04-20'],
    [2026, 2, '2026-07-20'],
    [2026, 3, '2026-10-20'],
    [2026, 4, '2027-01-20'],
    // 20.07.2025 was a Sunday: the calendar moved it to Monday.
    [2025, 2, '2025-07-21'],
  ])('%i Q%i: by %s', (year, quarter, due) => {
    expect(esvDue(year, quarter as Quarter)).toBe(due)
  })
})

describe('groups 1–2 deadlines', () => {
  it('pays each month by the 20th, on the Friday before a weekend', () => {
    expect(
      Array.from({ length: 12 }, (_, index) => advanceDue(2026, index + 1)),
    ).toEqual([
      '2026-01-20',
      '2026-02-20',
      '2026-03-20',
      '2026-04-20',
      '2026-05-20',
      '2026-06-19',
      '2026-07-20',
      '2026-08-20',
      '2026-09-18',
      '2026-10-20',
      '2026-11-20',
      '2026-12-18',
    ])
  })

  it('files the yearly return 60 days after the year, moved off a Sunday', () => {
    expect(yearReturnDue(2025)).toBe('2026-03-02')
    expect(yearReturnDue(2026)).toBe('2027-03-01')
    expect(yearReturnDue(2027)).toBe('2028-02-29')
  })
})

describe('nextWorkingDay', () => {
  it('keeps a weekday and moves a weekend to Monday', () => {
    expect(nextWorkingDay('2026-10-20')).toBe('2026-10-20')
    expect(nextWorkingDay('2026-05-10')).toBe('2026-05-11')
    expect(nextWorkingDay('2026-08-08')).toBe('2026-08-10')
  })
})

describe('obligationsFor', () => {
  it('lists group 3’s year in date order with the sums', () => {
    const summary = summarizeYear(
      profileOn(3),
      [income('2026-08-04', 15675660)],
      2026,
    )
    const list = obligationsFor(summary)

    expect(list.map(item => [item.due, item.kind, item.amount])).toEqual([
      ['2026-04-20', 'esv', 570702],
      ['2026-05-11', 'declaration', null],
      ['2026-07-20', 'esv', 570702],
      ['2026-08-10', 'declaration', null],
      ['2026-10-20', 'esv', 570702],
      ['2026-11-09', 'declaration', null],
      ['2026-11-19', 'single_tax', 783783],
      ['2026-11-19', 'levy', 156757],
      ['2027-01-20', 'esv', 570702],
      ['2027-02-09', 'declaration', null],
    ])
    expect(list.find(item => item.id === '2026-q4-declaration')?.esvAnnex).toBe(
      true,
    )
  })

  it('gives every obligation an id that marks can point at', () => {
    const list = obligationsFor(summarizeYear(profileOn(2), [], 2026))
    const ids = list.map(item => item.id)

    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('2026-m06-single_tax')
    expect(ids).toContain('2026-m06-levy')
    expect(ids).toContain('2026-q3-esv')
    expect(ids).toContain('2026-y-declaration')
    expect(list.find(item => item.id === '2026-m06-levy')?.due).toBe(
      '2026-06-19',
    )
  })

  it('asks a group 1–2 FOP over the limit for a quarterly return and 15%', () => {
    const list = obligationsFor(
      summarizeYear(profileOn(1), [income('2026-06-10', 144504900)], 2026),
    )
    const extra = list.filter(item => item.id.startsWith('2026-q2-'))

    expect(extra.map(item => [item.kind, item.due, item.amount])).toEqual([
      ['esv', '2026-07-20', 570702],
      ['declaration', '2026-08-10', null],
      ['single_tax', '2026-08-19', 15000],
    ])
  })
})

describe('the monthly schedule', () => {
  const summary = summarizeYear(
    profileOn(3),
    [income('2026-08-04', 15675660), income('2026-08-18', 6216984)],
    2026,
  )
  const monthly = obligationsFor(summary, 'monthly')
  const q3 = monthly.filter(
    item => item.year === 2026 && item.id.match(/-m0[789]-/),
  )

  it('splits the quarter by month, due by the 20th of the next month', () => {
    expect(
      q3.map(item => [item.id, item.due, item.legalDue, item.amount]),
    ).toEqual([
      ['2026-m07-esv', '2026-08-20', '2026-10-20', 190234],
      ['2026-m08-single_tax', '2026-09-21', '2026-11-19', 1094632],
      ['2026-m08-levy', '2026-09-21', '2026-11-19', 218926],
      ['2026-m08-esv', '2026-09-21', '2026-10-20', 190234],
      ['2026-m09-esv', '2026-10-20', '2026-10-20', 190234],
    ])
  })

  it('adds up to exactly what the quarterly schedule asks', () => {
    const quarterly = obligationsFor(summary, 'quarterly')
    const total = (items: typeof monthly, kind: string) =>
      items
        .filter(
          item =>
            item.kind === kind &&
            item.legalDue <= '2026-11-19' &&
            item.legalDue >= '2026-10-20',
        )
        .reduce((sum, item) => sum + (item.amount ?? 0), 0)

    ;['single_tax', 'levy', 'esv'].forEach(kind => {
      expect(total(monthly, kind)).toBe(total(quarterly, kind))
    })
  })

  it('keeps months already due at the switch with the quarter', () => {
    const switched = obligationsFor(summary, 'monthly', '2026-10-14')
    const ids = switched.map(item => item.id)

    expect(ids).toContain('2026-q3-single_tax')
    expect(ids).toContain('2026-q3-esv')
    expect(ids).not.toContain('2026-m08-single_tax')
    // September's plan date, 20 October, is on or after the switch.
    expect(ids).toContain('2026-m09-esv')
    const rest = switched.find(item => item.id === '2026-q3-esv')
    expect(rest?.amount).toBe(2 * 190234)
    expect(rest?.months).toEqual([7, 8])
    expect(ids).toContain('2026-m10-esv')
    expect(ids).toContain('2026-m12-esv')
  })

  it('keeps the returns quarterly', () => {
    expect(
      monthly.filter(item => item.kind === 'declaration').map(item => item.id),
    ).toEqual([
      '2026-q1-declaration',
      '2026-q2-declaration',
      '2026-q3-declaration',
      '2026-q4-declaration',
    ])
  })

  it('is not overdue for a missed plan until the law’s date passes', () => {
    const [julyEsv] = q3
    expect(obligationStatus(julyEsv, [], '2026-09-01')).toBe('soon')
    expect(obligationStatus(julyEsv, [], '2026-10-21')).toBe('overdue')
  })
})

describe('a month paid on its own', () => {
  const summary = summarizeYear(
    profileOn(3),
    [income('2026-07-02', 15669045), income('2026-08-04', 15675660)],
    2026,
  )
  const paidMark = (obligation: string, amount: number) => ({
    id: obligation,
    obligation,
    kind: 'paid' as const,
    day: '2026-08-10',
    amount,
  })

  it('lists what the month owes', () => {
    expect(
      monthPayments(summary, 7).map(item => [item.id, item.amount, item.due]),
    ).toEqual([
      ['2026-m07-single_tax', 783452, '2026-08-20'],
      ['2026-m07-levy', 156690, '2026-08-20'],
      ['2026-m07-esv', 190234, '2026-08-20'],
    ])
  })

  it('comes out of its quarter once marked, the rest keeps the legal date', () => {
    const marks = monthPayments(summary, 7).map(item =>
      paidMark(item.id, item.amount ?? 0),
    )
    const list = obligationsFor(summary, 'quarterly', '', marks)
    const byId = (id: string) => list.find(item => item.id === id)

    expect(byId('2026-m07-single_tax')?.amount).toBe(783452)
    expect(byId('2026-q3-single_tax')?.amount).toBe(783783)
    expect(byId('2026-q3-single_tax')?.months).toEqual([8, 9])
    expect(byId('2026-q3-single_tax')?.due).toBe('2026-11-19')
    expect(byId('2026-q3-esv')?.amount).toBe(2 * 190234)
    expect(
      obligationStatus(byId('2026-m07-esv') as never, marks, '2026-08-11'),
    ).toBe('done')
  })

  it('is not split by a group 1–2 monthly tax mark', () => {
    const fixed = summarizeYear(profileOn(2), [], 2026)
    const list = obligationsFor(fixed, 'quarterly', '', [
      paidMark('2026-m07-single_tax', 172940),
    ])
    expect(list.map(item => item.id)).toContain('2026-q3-esv')
    expect(list.map(item => item.id)).not.toContain('2026-m07-esv')
  })

  it('asks for the difference when the month grew after paying', () => {
    const [julyTax] = monthPayments(summary, 7)
    const marks = [paidMark(julyTax.id, 700000)]
    expect(paidSoFar(julyTax, marks)).toBe(700000)
    expect(obligationStatus(julyTax, marks, '2026-08-11')).not.toBe('done')
    expect(
      obligationStatus(
        julyTax,
        [...marks, paidMark(julyTax.id, 83452)],
        '2026-08-11',
      ),
    ).toBe('done')
  })
})

describe('obligationStatus', () => {
  const [first] = obligationsFor(summarizeYear(profileOn(3), [], 2026))

  it('is done once marked, whatever the date', () => {
    const mark = {
      id: 'm',
      obligation: first.id,
      kind: 'paid' as const,
      day: '2026-04-18',
      amount: 570702,
    }
    expect(obligationStatus(first, [mark], '2026-10-01')).toBe('done')
  })

  it('counts what fell due before tracking began as done', () => {
    expect(obligationStatus(first, [], '2026-10-14', '2026-10-14')).toBe('done')
    expect(obligationStatus(first, [], '2026-10-14', '2026-01-01')).toBe(
      'overdue',
    )
  })

  it('is overdue after the day, soon within a week, upcoming before', () => {
    expect(obligationStatus(first, [], '2026-04-21')).toBe('overdue')
    expect(obligationStatus(first, [], '2026-04-20')).toBe('soon')
    expect(obligationStatus(first, [], '2026-04-13')).toBe('soon')
    expect(obligationStatus(first, [], '2026-04-12')).toBe('upcoming')
  })
})
