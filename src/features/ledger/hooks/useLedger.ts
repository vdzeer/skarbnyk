import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { useCallback } from 'react'

import type { Income, Mark, Profile } from '~/core'
import { open } from '~/services/crypto'
import { getFirebase } from '~/services/firebase'
import { queryLoadState, type LoadState } from '~/services/queryState'
import { useDataKey, useUid } from '~/store'

import {
  COLLECTIONS,
  LEDGER_QUERY,
  incomeFromPayload,
  markFromPayload,
  profileFromPayload,
} from '../services'

/** Query keys carry the uid, so one account never reads another's cache. */
export const ledgerKey = (name: string, uid: string | null) =>
  [LEDGER_QUERY, name, uid] as const

/**
 * Thrown when the profile exists but the key in memory cannot open it: a key
 * remembered on this device from an account that was since deleted and made
 * again. The gate answers by locking, so the user types the password.
 */
export class WrongKeyError extends Error {
  constructor() {
    super('the data key does not open this account')
  }
}

const fetchProfile = async (uid: string, dataKey: CryptoKey) => {
  const snapshot = await getDoc(
    doc(getFirebase().db, COLLECTIONS.profiles, uid),
  )
  if (!snapshot.exists()) return null
  const payload = await open(dataKey, snapshot.data(), {
    collection: COLLECTIONS.profiles,
    id: uid,
    uid,
  })
  if (payload === null) throw new WrongKeyError()
  return profileFromPayload(payload)
}

/**
 * The owner-scoped list read. The `where` clause is not an optimisation: the
 * security rules refuse a list that does not carry it. A document that does
 * not open or does not parse is left out.
 */
const fetchOwned = async <Model>(
  name: typeof COLLECTIONS.incomes | typeof COLLECTIONS.marks,
  uid: string,
  dataKey: CryptoKey,
  fromPayload: (id: string, data: unknown) => Model | null,
): Promise<Model[]> => {
  const { db } = getFirebase()
  const snapshot = await getDocs(
    query(collection(db, name), where('owner_uid', '==', uid)),
  )
  const models = await Promise.all(
    snapshot.docs.map(async document => {
      const payload = await open(dataKey, document.data(), {
        collection: name,
        id: document.id,
        uid,
      })
      return payload === null ? null : fromPayload(document.id, payload)
    }),
  )
  return models.filter((model): model is Awaited<Model> => model !== null)
}

const EMPTY_INCOMES: Income[] = []
const EMPTY_MARKS: Mark[] = []

export type Ledger = {
  state: LoadState
  /** Null until the user has gone through the first setup. */
  profile: Profile | null
  incomes: Income[]
  marks: Mark[]
  error: unknown
  retry: () => void
}

/** Everything the signed-in user has stored, decrypted, with one load state. */
export const useLedger = (): Ledger => {
  const uid = useUid()
  const dataKey = useDataKey()
  const queryClient = useQueryClient()
  const enabled = uid !== null && dataKey !== null
  const shared = {
    enabled,
    // Every write updates the cache by hand; a refetch would only spend reads
    // and decryption time.
    staleTime: Infinity,
    retry: (count: number, error: unknown) =>
      !(error instanceof WrongKeyError) && count < 1,
  }

  const profile = useQuery({
    ...shared,
    queryKey: ledgerKey(COLLECTIONS.profiles, uid),
    queryFn: () => fetchProfile(uid as string, dataKey as CryptoKey),
  })
  const incomes = useQuery({
    ...shared,
    queryKey: ledgerKey(COLLECTIONS.incomes, uid),
    queryFn: () =>
      fetchOwned(
        COLLECTIONS.incomes,
        uid as string,
        dataKey as CryptoKey,
        incomeFromPayload,
      ),
  })
  const marks = useQuery({
    ...shared,
    queryKey: ledgerKey(COLLECTIONS.marks, uid),
    queryFn: () =>
      fetchOwned(
        COLLECTIONS.marks,
        uid as string,
        dataKey as CryptoKey,
        markFromPayload,
      ),
  })

  const retry = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [LEDGER_QUERY] })
  }, [queryClient])

  return {
    state: queryLoadState([profile, incomes, marks]),
    profile: profile.data ?? null,
    incomes: incomes.data ?? EMPTY_INCOMES,
    marks: marks.data ?? EMPTY_MARKS,
    error: profile.error ?? incomes.error ?? marks.error,
    retry,
  }
}
