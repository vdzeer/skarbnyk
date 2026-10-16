import { LAW, ratesFor } from '..'

// Every number below is written out by hand, independently of law.ts.

describe('the law table', () => {
  it('has 2024, 2025 and 2026', () => {
    expect(Object.keys(LAW).sort()).toEqual(['2024', '2025', '2026'])
  })

  it.each([
    [2024, 710000, 800000, 302800],
    [2025, 800000, 800000, 302800],
    [2026, 864700, 864700, 332800],
  ])(
    '%i: minimum wage %i in January, %i in December, subsistence %i',
    (year, january, december, subsistence) => {
      expect(LAW[year].minWage[0]).toBe(january)
      expect(LAW[year].minWage[11]).toBe(december)
      expect(LAW[year].minWage).toHaveLength(12)
      expect(LAW[year].subsistence).toBe(subsistence)
    },
  )

  it('raised the 2024 minimum wage from April', () => {
    expect(LAW[2024].minWage.slice(0, 4)).toEqual([
      710000, 710000, 710000, 800000,
    ])
  })
})

describe('ratesFor', () => {
  it.each([
    [2024, 118570000, 592140000, 828570000],
    [2025, 133600000, 667200000, 933600000],
    [2026, 144404900, 721159800, 1009104900],
  ])('%i limits: %i, %i, %i kopecks', (year, one, two, three) => {
    expect(ratesFor(year).limit).toEqual({ 1: one, 2: two, 3: three })
  })

  it.each([
    [2024, 30280, 142000],
    [2025, 30280, 160000],
    [2026, 33280, 172940],
  ])(
    '%i monthly single tax maximum: group 1 %i, group 2 %i',
    (year, one, two) => {
      expect(ratesFor(year).singleTaxMonthly).toEqual({ 1: one, 2: two })
    },
  )

  it.each([
    [2024, 0, 0],
    [2025, 80000, 1],
    [2026, 86470, 1],
  ])(
    '%i military levy: %i a month for groups 1–2, %i%% for group 3',
    (year, monthly, percent) => {
      expect(ratesFor(year).levyMonthly).toBe(monthly)
      expect(ratesFor(year).levyPercent).toBe(percent)
    },
  )

  it('takes the minimum ЄСВ from each month’s wage', () => {
    expect(ratesFor(2024).esvMin.slice(0, 4)).toEqual([
      156200, 156200, 156200, 176000,
    ])
    expect(ratesFor(2025).esvMin[0]).toBe(176000)
    expect(ratesFor(2026).esvMin[0]).toBe(190234)
  })

  it('caps ЄСВ at 15 wages in 2024 and 20 from 2025', () => {
    expect(ratesFor(2024).esvMax[0]).toBe(2343000)
    expect(ratesFor(2024).esvMax[11]).toBe(2640000)
    expect(ratesFor(2025).esvMax[0]).toBe(3520000)
    expect(ratesFor(2026).esvMax[0]).toBe(3804680)
  })

  it('uses 5% and 3% for group 3 and 15% over the limit', () => {
    const rates = ratesFor(2026)
    expect(rates.singleTaxPercent).toEqual({ base: 5, vat: 3 })
    expect(rates.excessPercent).toBe(15)
  })

  it('borrows the nearest year, and says so, for a year it has no law for', () => {
    const rates = ratesFor(2027)
    expect(rates.estimated).toBe(true)
    expect(rates.minWageJan).toBe(864700)
    expect(ratesFor(2026).estimated).toBe(false)
  })

  it('applies the user’s numbers on top of the law', () => {
    const rates = ratesFor(2026, {
      singleTaxMonthly: 100000,
      singleTaxPercent: 4,
      minWage: 900000,
    })
    expect(rates.singleTaxMonthly).toEqual({ 1: 100000, 2: 100000 })
    expect(rates.singleTaxPercent).toEqual({ base: 4, vat: 4 })
    expect(rates.limit[3]).toBe(900000 * 1167)
    expect(rates.esvMin[5]).toBe(198000)
    expect(rates.levyMonthly).toBe(90000)
  })
})
