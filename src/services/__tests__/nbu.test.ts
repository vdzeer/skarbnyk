import { nbuUrl, rateFromResponse } from '../nbu'

describe('the NBU rate', () => {
  it('asks for one currency on one day', () => {
    expect(nbuUrl('USD', '2026-10-13')).toBe(
      'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&date=20261013&json',
    )
  })

  it('reads the rate from the answer', () => {
    expect(
      rateFromResponse([
        {
          r030: 840,
          txt: 'Долар США',
          rate: 44.9567,
          cc: 'USD',
          exchangedate: '13.10.2026',
        },
      ]),
    ).toBe(44.9567)
  })

  it.each([
    ['an empty list', []],
    ['an error object', { message: 'Wrong parameters format' }],
    ['a rate as text', [{ rate: '44.95' }]],
    ['a zero rate', [{ rate: 0 }]],
  ])('finds no rate in %s', (_label, data) => {
    expect(rateFromResponse(data)).toBeNull()
  })
})
