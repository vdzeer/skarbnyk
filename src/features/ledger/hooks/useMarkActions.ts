import { useMemo } from 'react'

import type { DayKey, Obligation } from '~/core'

import { COLLECTIONS } from '../services'

import { useLedger } from './useLedger'
import { newId, useLedgerActions } from './useLedgerActions'

/** "Paid" and "filed" are marks the user puts on an obligation, and takes back. */
export const useMarkActions = () => {
  const { marks } = useLedger()
  const { saveMark, deleteMark } = useLedgerActions()

  return useMemo(
    () => ({
      markDone: (obligation: Obligation, day: DayKey) =>
        saveMark({
          id: newId(COLLECTIONS.marks),
          obligation: obligation.id,
          kind: obligation.action,
          day,
          amount: obligation.amount,
        }),
      /** Every mark on it: a payment and a later top-up come off together. */
      undo: (obligation: Obligation) => {
        marks
          .filter(
            mark =>
              mark.obligation === obligation.id &&
              mark.kind === obligation.action,
          )
          .forEach(mark => deleteMark(mark.id))
      },
      /** A month paid on its own: its tax, levy and ЄСВ marked at once. */
      markMonth: (payments: Obligation[], day: DayKey) =>
        Promise.all(
          payments
            .filter(payment => (payment.amount ?? 0) > 0)
            .map(payment =>
              saveMark({
                id: newId(COLLECTIONS.marks),
                obligation: payment.id,
                kind: 'paid',
                day,
                amount: payment.amount,
              }),
            ),
        ),
      undoMonth: (ids: string[]) => {
        marks
          .filter(mark => ids.includes(mark.obligation))
          .forEach(mark => deleteMark(mark.id))
      },
    }),
    [marks, saveMark, deleteMark],
  )
}
