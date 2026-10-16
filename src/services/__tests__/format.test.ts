import {
  DAY_FULL,
  DAY_MONTH,
  formatDay,
  formatDue,
  formatMoney,
  moneyInput,
  parseMoney,
  parseRate,
} from '../format'

describe('formatDay', () => {
  it('writes a calendar day in Ukrainian', () => {
    expect(formatDay('2026-10-20', DAY_MONTH)).toBe('20 жовтня')
    expect(formatDay('2025-04-21', DAY_FULL)).toBe('21 квітня 2025 р.')
  })

  // A date field being typed in or cleared hands over '' or a half-day; the
  // screen must keep standing (the RangeError seen live on 2026-10-14).
  it.each(['', '2026-10', 'вчора', '2026-13-45'])(
    'returns nothing for %p instead of throwing',
    day => {
      expect(formatDay(day, DAY_MONTH)).toBe('')
    },
  )

  it('adds the year only when it is not the current one', () => {
    expect(formatDue('2026-11-19', '2026-10-14')).toBe('19 листопада')
    expect(formatDue('2027-01-20', '2026-10-14')).toBe('20 січня 2027 р.')
  })
})

describe('money', () => {
  it('formats kopecks with Ukrainian separators', () => {
    expect(formatMoney(570702).replace(/\s/g, ' ')).toBe('5 707,02')
    expect(moneyInput(350000)).toBe('3 500,00')
  })

  it('reads what people type', () => {
    expect(parseMoney('3 500,50')).toBe(350050)
    expect(parseMoney('3500.5')).toBe(350050)
    expect(parseMoney('1,555')).toBeNull()
    expect(parseRate('44,9567')).toBe(44.9567)
    expect(parseRate('0')).toBeNull()
  })
})
