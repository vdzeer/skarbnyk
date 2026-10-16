/**
 * Every collection the app writes. Deleting an account walks this list, so a
 * new collection added here is erased with the rest.
 */
export const COLLECTIONS = {
  keys: 'keys',
  profiles: 'profiles',
  incomes: 'incomes',
  marks: 'marks',
  reminders: 'reminders',
} as const

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS]

/** Decrypted data lives in the query cache under this prefix; locking drops it. */
export const LEDGER_QUERY = 'ledger'
