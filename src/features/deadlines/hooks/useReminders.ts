import { useQuery, useQueryClient } from '@tanstack/react-query'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useCallback } from 'react'

import type { Group } from '~/core'
import { COLLECTIONS } from '~/features/ledger/services'
import { getFirebase } from '~/services/firebase'
import { useAuthStore, useUid } from '~/store'

/** How many days before a deadline a letter can come. */
export const REMINDER_OFFSETS = [7, 3, 1, 0] as const
export type ReminderOffset = (typeof REMINDER_OFFSETS)[number]

export type Reminders = { enabled: boolean; offsets: ReminderOffset[] }

export const REMINDERS_READY = process.env.NEXT_PUBLIC_EMAIL_REMINDERS === '1'

const DEFAULT: Reminders = { enabled: false, offsets: [7, 1] }

const fromDoc = (data: Record<string, unknown> | undefined): Reminders => {
  if (!data) return DEFAULT
  const offsets = Array.isArray(data.offsets)
    ? (data.offsets.filter(value =>
        (REMINDER_OFFSETS as readonly unknown[]).includes(value),
      ) as ReminderOffset[])
    : DEFAULT.offsets
  return { enabled: data.enabled === true, offsets }
}

/**
 * The one plaintext document: the mailer has to know where to write, which
 * group's dates apply and when. No sums. It exists only once switched on.
 */
export const useReminders = (group: Group) => {
  const uid = useUid()
  const email = useAuthStore(state => state.user?.email ?? null)
  const queryClient = useQueryClient()
  const key = ['reminders', uid] as const

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const snapshot = await getDoc(
        doc(getFirebase().db, COLLECTIONS.reminders, uid as string),
      )
      return fromDoc(snapshot.data())
    },
    enabled: uid !== null,
    staleTime: Infinity,
  })

  const save = useCallback(
    async (next: Reminders) => {
      if (!uid || !email) throw new Error('no verified email')
      await setDoc(doc(getFirebase().db, COLLECTIONS.reminders, uid), {
        owner_uid: uid,
        email,
        enabled: next.enabled,
        group,
        offsets: next.offsets,
        updated_at: serverTimestamp(),
      })
      queryClient.setQueryData(key, next)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, email, group, queryClient],
  )

  return {
    reminders: query.data ?? DEFAULT,
    loading: query.isPending,
    email,
    save,
  }
}
