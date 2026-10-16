import { convert, percentOf, roundKop } from '..'

describe('money', () => {
  it('rounds half a kopeck up', () => {
    expect(roundKop(0.5)).toBe(1)
    expect(roundKop(1.4999)).toBe(1)
    expect(roundKop(2.5)).toBe(3)
  })

  it('takes percents without float drift', () => {
    expect(percentOf(54921044, 5)).toBe(2746052)
    expect(percentOf(864700, 22)).toBe(190234)
    expect(percentOf(332800, 10)).toBe(33280)
  })

  it('converts at a four-decimal rate', () => {
    expect(convert(350000, 44.8333)).toBe(15691655)
    expect(convert(120000, 51.8082)).toBe(6216984)
  })
})
