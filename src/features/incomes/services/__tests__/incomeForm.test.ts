import {
  computedUah,
  draftFromIncome,
  emptyDraft,
  readDraft,
  type IncomeDraft,
} from '../incomeForm'

const TODAY = '2026-10-14'

const usd = (overrides: Partial<IncomeDraft> = {}): IncomeDraft => ({
  ...emptyDraft(TODAY),
  day: '2026-10-13',
  currency: 'USD',
  amount: '3 500',
  rate: '44,9567',
  ...overrides,
})

describe('readDraft', () => {
  it('converts a foreign sum at the rate', () => {
    expect(readDraft(usd(), TODAY)).toEqual({
      ok: true,
      value: {
        day: '2026-10-13',
        currency: 'USD',
        amount: 350000,
        rate: 44.9567,
        uah: 15734845,
        note: '',
      },
    })
  })

  it('keeps the hryvnias the user typed over the computed ones', () => {
    const read = readDraft(usd({ uah: '156 900,00', uahManual: true }), TODAY)
    expect(read.ok && read.value.uah).toBe(15690000)
  })

  it('takes hryvnias as they are, with no rate', () => {
    const read = readDraft(
      { ...emptyDraft(TODAY), amount: '18000', note: '  ТОВ «Пріор»  ' },
      TODAY,
    )
    expect(read).toEqual({
      ok: true,
      value: {
        day: TODAY,
        currency: 'UAH',
        amount: 1800000,
        rate: null,
        uah: 1800000,
        note: 'ТОВ «Пріор»',
      },
    })
  })

  it.each([
    ['no amount', usd({ amount: '' }), { amount: 'required' }],
    ['a zero amount', usd({ amount: '0' }), { amount: 'invalid' }],
    ['three decimals', usd({ amount: '1,555' }), { amount: 'invalid' }],
    ['letters', usd({ amount: 'сто' }), { amount: 'invalid' }],
    ['no rate', usd({ rate: '' }), { rate: 'required' }],
    ['a zero rate', usd({ rate: '0' }), { rate: 'invalid' }],
    ['a day ahead', usd({ day: '2026-10-15' }), { day: 'future' }],
    ['no day', usd({ day: '' }), { day: 'required' }],
    ['a year still being typed', usd({ day: '0202-10-13' }), { day: 'old' }],
    [
      'typed hryvnias that are not a sum',
      usd({ uah: 'x', uahManual: true }),
      { uah: 'invalid' },
    ],
    ['a note too long', usd({ note: 'н'.repeat(201) }), { note: 'long' }],
  ])('refuses %s', (_label, draft, errors) => {
    expect(readDraft(draft, TODAY)).toEqual({ ok: false, errors })
  })
})

describe('computedUah', () => {
  it('waits for both numbers', () => {
    expect(computedUah(usd({ rate: '' }))).toBeNull()
    expect(computedUah(usd())).toBe(15734845)
  })
})

describe('draftFromIncome', () => {
  it('opens a stored income for editing as the user would type it', () => {
    const draft = draftFromIncome({
      id: 'x',
      day: '2026-10-02',
      currency: 'USD',
      amount: 350000,
      rate: 44.8333,
      uah: 15691655,
      note: 'Acme',
    })
    expect(draft.amount).toBe('3 500,00')
    expect(draft.rate).toBe('44,8333')
    expect(draft.uahManual).toBe(false)
    expect(readDraft(draft, TODAY)).toMatchObject({
      ok: true,
      value: { uah: 15691655 },
    })
  })

  it('remembers hryvnias that differ from amount × rate', () => {
    const draft = draftFromIncome({
      id: 'x',
      day: '2026-10-02',
      currency: 'USD',
      amount: 350000,
      rate: 44.8333,
      uah: 15600000,
      note: '',
    })
    expect(draft.uahManual).toBe(true)
  })
})
