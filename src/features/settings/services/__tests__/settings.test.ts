import type { Income, Requisites } from '~/core'

import { incomesCsv } from '../exportCsv'
import { cleanRequisites, isIban, requisitesErrors } from '../requisites'

const EMPTY = { iban: '', recipient: '', code: '' }
// A valid IBAN shape with correct check digits (generated for the test).
const IBAN = 'UA213223130000026007233566001'

const requisites = (patch: Partial<Requisites> = {}): Requisites => ({
  taxId: '',
  singleTax: EMPTY,
  levy: EMPTY,
  esv: EMPTY,
  ...patch,
})

describe('requisites', () => {
  it('accept empty fields', () => {
    expect(requisitesErrors(requisites())).toEqual({})
  })

  it('accept a Ukrainian IBAN with spaces and lower case', () => {
    expect(isIban('ua21 3223 1300 0002 6007 2335 6600 1')).toBe(true)
    expect(
      requisitesErrors(
        requisites({
          singleTax: { iban: IBAN, recipient: 'ГУК', code: '37993783' },
        }),
      ),
    ).toEqual({})
  })

  it('refuse a wrong IBAN, code or tax number', () => {
    expect(
      requisitesErrors(
        requisites({
          taxId: '12345',
          levy: {
            iban: 'UA213223130000026007233566002',
            recipient: '',
            code: '123',
          },
          esv: {
            iban: 'PL61109010140000071219812874',
            recipient: '',
            code: '',
          },
        }),
      ),
    ).toEqual({
      taxId: 'format',
      'levy.iban': 'format',
      'levy.code': 'format',
      'esv.iban': 'format',
    })
  })

  it('store IBANs compact and upper case', () => {
    expect(
      cleanRequisites(
        requisites({
          esv: {
            iban: 'ua21 3223 1300 0002 6007 2335 6600 1',
            recipient: ' ГУ ДПС ',
            code: '',
          },
        }),
      ).esv,
    ).toEqual({ iban: IBAN, recipient: 'ГУ ДПС', code: '' })
  })
})

describe('incomesCsv', () => {
  const income: Income = {
    id: 'x',
    day: '2026-10-02',
    amount: 350000,
    currency: 'USD',
    rate: 44.8333,
    uah: 15691655,
    note: 'Acme "Corp"',
  }

  it('writes what Excel in Ukrainian settings reads', () => {
    const csv = incomesCsv([income], ['Дата', 'Сума'])
    expect(csv.startsWith('﻿"Дата";"Сума"\r\n')).toBe(true)
    expect(csv).toContain(
      '2026-10-02;3500,00;USD;44,8333;156916,55;"Acme ""Corp"""',
    )
  })

  it.each(['=1+1', '+380', '-2', '@SUM(A1)', '\tx', '\rx'])(
    'keeps a note starting like a formula as text: %j',
    note => {
      const csv = incomesCsv([{ ...income, note }], [])
      expect(csv).toContain(`;"'${note}"\r\n`)
    },
  )

  it('leaves other notes and the number columns as they are', () => {
    const csv = incomesCsv(
      [{ ...income, amount: -150000, uah: -150000, rate: null, note: 'a=b' }],
      ['=Дата'],
    )
    expect(csv).toContain('"\'=Дата"\r\n')
    expect(csv).toContain('2026-10-02;-1500,00;USD;;-1500,00;"a=b"\r\n')
  })
})
