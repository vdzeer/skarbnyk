import { summarizeYear } from '..'

import { income, profileOn } from './fixtures'

// Q3 2026 of the approved mockup: five incomes, 549 210,44 грн.
const Q3_2026 = [
  income('2026-07-02', 15669045),
  income('2026-08-04', 15675660),
  income('2026-08-18', 6216984),
  income('2026-09-02', 15559355),
  income('2026-09-25', 1800000),
]

describe('group 3', () => {
  const summary = summarizeYear(profileOn(3), Q3_2026, 2026)
  const q3 = summary.quarters[2]

  it('adds up the quarter', () => {
    expect(q3.income).toBe(54921044)
  })

  it('splits the quarter into months that add up to it exactly', () => {
    expect(q3.months.map(month => month.income)).toEqual([
      15669045, 21892644, 17359355,
    ])
    const monthTax = q3.months.reduce(
      (total, month) => total + month.singleTax + month.shareTax,
      0,
    )
    const monthLevy = q3.months.reduce(
      (total, month) => total + month.levy + month.shareLevy,
      0,
    )
    expect(monthTax).toBe(q3.singleTax)
    expect(monthLevy).toBe(q3.levy)
  })

  it('takes 5% single tax, 1% levy and three minimum ЄСВ', () => {
    expect(q3.singleTax).toBe(2746052)
    expect(q3.levy).toBe(549210)
    expect(q3.esv).toBe(570702)
    expect(q3.total).toBe(2746052 + 549210 + 570702)
  })

  it('still owes ЄСВ in a quarter without income', () => {
    expect(summary.quarters[0].income).toBe(0)
    expect(summary.quarters[0].singleTax).toBe(0)
    expect(summary.quarters[0].esv).toBe(570702)
  })

  it('takes 3% from a VAT payer', () => {
    const vat = profileOn(3, {
      periods: [{ from: '2021-03-15', group: 3, vat: true }],
    })
    expect(summarizeYear(vat, Q3_2026, 2026).quarters[2].singleTax).toBe(
      1647631,
    )
  })

  it('has no military levy in 2024', () => {
    const summary2024 = summarizeYear(
      profileOn(3),
      [income('2024-05-10', 10000000)],
      2024,
    )
    expect(summary2024.quarters[1].levy).toBe(0)
    expect(summary2024.quarters[1].singleTax).toBe(500000)
  })

  it('rounds like a return: from 1 January, minus what was declared', () => {
    const odd = summarizeYear(
      profileOn(3),
      [income('2026-02-01', 3333), income('2026-05-01', 3333)],
      2026,
    )
    // 1% of 33,33 is 0,3333: 0,33 in Q1, then 0,67 − 0,33 = 0,34 in Q2.
    expect(odd.quarters[0].levy).toBe(33)
    expect(odd.quarters[1].levy).toBe(34)
  })

  it('takes 15% on the part over the limit, and the levy on all of it', () => {
    const limit = 1009104900
    const over = summarizeYear(
      profileOn(3),
      [income('2026-03-01', limit - 1000000), income('2026-11-02', 3000000)],
      2026,
    )
    const q4 = over.quarters[3]
    expect(q4.excess).toBe(2000000)
    expect(q4.singleTax).toBe(50000 + 300000)
    expect(q4.levy).toBe(30000)
    expect(over.excess).toBe(2000000)
  })

  it('counts income only from the day of registration', () => {
    const fresh = profileOn(3, {
      registeredOn: '2026-08-10',
      periods: [{ from: '2026-08-10', group: 3, vat: false }],
    })
    const summary2026 = summarizeYear(
      fresh,
      [income('2026-08-01', 100000), income('2026-08-20', 200000)],
      2026,
    )
    expect(summary2026.quarters[2].income).toBe(200000)
    // ЄСВ from the month of registration: August and September.
    expect(summary2026.quarters[2].esv).toBe(2 * 190234)
    expect(summary2026.quarters[1].esv).toBe(0)
  })
})

describe('groups 1 and 2', () => {
  it('pay the fixed maximum and levy every month', () => {
    const summary = summarizeYear(profileOn(2), [], 2026)
    expect(summary.quarters[0].singleTax).toBe(3 * 172940)
    expect(summary.quarters[0].levy).toBe(3 * 86470)
    expect(summary.singleTax).toBe(12 * 172940)
  })

  it('pay what the council set instead of the maximum', () => {
    const council = profileOn(1, {
      overrides: { '2026': { singleTaxMonthly: 20000 } },
    })
    expect(summarizeYear(council, [], 2026).quarters[1].singleTax).toBe(60000)
  })

  it('start the month after registration', () => {
    const fresh = profileOn(2, {
      registeredOn: '2026-05-14',
      periods: [{ from: '2026-05-14', group: 2, vat: false }],
    })
    const q2 = summarizeYear(fresh, [], 2026).quarters[1]
    expect(q2.months.map(month => month.singleTax)).toEqual([0, 0, 172940])
    expect(q2.months.map(month => month.esv)).toEqual([0, 0, 190234])
  })

  it('pay 15% on income over the limit', () => {
    const summary = summarizeYear(
      profileOn(1),
      [income('2026-06-10', 144404900 + 100000)],
      2026,
    )
    expect(summary.quarters[1].excess).toBe(100000)
    expect(summary.quarters[1].singleTax).toBe(3 * 33280 + 15000)
  })
})

describe('changes during the year', () => {
  it('switch group from a quarter', () => {
    const moved = profileOn(2, {
      periods: [
        { from: '2021-03-15', group: 2, vat: false },
        { from: '2026-07-01', group: 3, vat: false },
      ],
    })
    const summary = summarizeYear(
      moved,
      [income('2026-05-05', 1000000), income('2026-08-05', 1000000)],
      2026,
    )
    expect(summary.quarters[1].singleTax).toBe(3 * 172940)
    expect(summary.quarters[2].singleTax).toBe(50000)
    expect(summary.quarters[2].group).toBe(3)
    expect(summary.limitGroup).toBe(3)
  })

  it('owe nothing for the months of military service', () => {
    const serving = profileOn(3, {
      service: { from: '2026-04-17', to: '2026-08-02' },
    })
    const summary = summarizeYear(
      serving,
      [income('2026-05-01', 1000000), income('2026-09-01', 1000000)],
      2026,
    )
    expect(summary.quarters[1].singleTax).toBe(0)
    expect(summary.quarters[1].esv).toBe(0)
    expect(summary.quarters[2].months.map(month => month.esv)).toEqual([
      0, 0, 190234,
    ])
    expect(summary.quarters[2].singleTax).toBe(50000)
  })

  it('stop ЄСВ from the month the exemption starts', () => {
    const pensioner = profileOn(3, {
      esv: {
        mode: 'exempt',
        monthly: 0,
        exemption: 'pensioner',
        since: '2026-05-01',
      },
    })
    const q2 = summarizeYear(pensioner, [], 2026).quarters[1]
    expect(q2.months.map(month => month.esv)).toEqual([190234, 0, 0])
  })

  it('keep a chosen ЄСВ between the minimum and the maximum', () => {
    const generous = (monthly: number) =>
      summarizeYear(
        profileOn(3, {
          esv: { mode: 'custom', monthly, exemption: null, since: null },
        }),
        [],
        2026,
      ).quarters[0].months[0].esv

    expect(generous(500000)).toBe(500000)
    expect(generous(1000)).toBe(190234)
    expect(generous(99999999)).toBe(3804680)
  })
})
