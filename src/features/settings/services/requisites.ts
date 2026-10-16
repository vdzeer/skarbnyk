import type { Account, Requisites } from '~/core'

export type RequisitesField =
  'taxId' | `${'singleTax' | 'levy' | 'esv'}.${keyof Account}`

export type RequisitesErrors = Partial<Record<RequisitesField, 'format'>>

const ACCOUNTS = ['singleTax', 'levy', 'esv'] as const

/** UA, two check digits, then 25 digits: 29 characters in all. */
export const isIban = (value: string) =>
  /^UA\d{27}$/.test(value.replace(/\s/g, '').toUpperCase())

/**
 * Only the shape is checked, and only when something is typed: an empty
 * field is allowed, a wrong one is not. The IBAN check digits are verified.
 */
const ibanChecksum = (value: string) => {
  const compact = value.replace(/\s/g, '').toUpperCase()
  const moved = compact.slice(4) + compact.slice(0, 4)
  const digits = moved.replace(/[A-Z]/g, char =>
    String(char.charCodeAt(0) - 55),
  )
  return (
    [...digits].reduce((rest, digit) => (rest * 10 + Number(digit)) % 97, 0) ===
    1
  )
}

export const requisitesErrors = (requisites: Requisites): RequisitesErrors => {
  const errors: RequisitesErrors = {}
  if (requisites.taxId && !/^\d{10}$/.test(requisites.taxId)) {
    errors.taxId = 'format'
  }
  ACCOUNTS.forEach(name => {
    const account = requisites[name]
    if (account.iban && !(isIban(account.iban) && ibanChecksum(account.iban))) {
      errors[`${name}.iban`] = 'format'
    }
    if (account.code && !/^\d{8}$/.test(account.code)) {
      errors[`${name}.code`] = 'format'
    }
  })
  return errors
}

/** IBANs are stored without spaces, in capitals. */
export const cleanRequisites = (requisites: Requisites): Requisites => {
  const clean = (account: Account): Account => ({
    iban: account.iban.replace(/\s/g, '').toUpperCase(),
    recipient: account.recipient.trim(),
    code: account.code.trim(),
  })
  return {
    taxId: requisites.taxId.trim(),
    singleTax: clean(requisites.singleTax),
    levy: clean(requisites.levy),
    esv: clean(requisites.esv),
  }
}
