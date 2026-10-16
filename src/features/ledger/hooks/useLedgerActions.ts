import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { collection, deleteDoc, doc, setDoc } from 'firebase/firestore'
import { useMemo } from 'react'

import type { Income, Mark, Profile } from '~/core'
import { seal } from '~/services/crypto'
import { getFirebase } from '~/services/firebase'
import { useDataKey, useSyncStore, useUid } from '~/store'

import {
  COLLECTIONS,
  incomeToPayload,
  markToPayload,
  profileToPayload,
} from '../services'

import { ledgerKey } from './useLedger'

type WithId = { id: string }

const upsert = <Model extends WithId>(
  queryClient: QueryClient,
  name: string,
  uid: string,
  model: Model,
) =>
  queryClient.setQueryData<Model[]>(ledgerKey(name, uid), (current = []) =>
    current.some(item => item.id === model.id)
      ? current.map(item => (item.id === model.id ? model : item))
      : [...current, model],
  )

const removeFrom = (
  queryClient: QueryClient,
  name: string,
  uid: string,
  id: string,
) =>
  queryClient.setQueryData<WithId[]>(ledgerKey(name, uid), (current = []) =>
    current.filter(item => item.id !== id),
  )

/**
 * A Firestore write resolves only when the server has it, which offline means
 * "not for a long time". So writes are sent and not awaited: the cache already
 * has the change, and a refusal is reported through the sync store.
 */
const send = (write: Promise<unknown>) => {
  write.catch((error: unknown) => {
    console.error(error)
    useSyncStore.getState().markFailed()
  })
}

/** A fresh random document id, made on the device. */
export const newId = (name: string) =>
  doc(collection(getFirebase().db, name)).id

/** Every write goes through here: the model is sealed before it leaves. */
export const useLedgerActions = () => {
  const uid = useUid()
  const dataKey = useDataKey()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const ready = () => {
      if (!uid || !dataKey) throw new Error('the vault is locked')
      return { uid, dataKey }
    }

    const write = async (name: string, id: string, payload: unknown) => {
      const { uid: owner, dataKey: key } = ready()
      const envelope = await seal(key, payload, {
        collection: name,
        id,
        uid: owner,
      })
      send(
        setDoc(doc(getFirebase().db, name, id), {
          owner_uid: owner,
          ...envelope,
        }),
      )
    }

    const erase = (name: string, id: string) => {
      ready()
      send(deleteDoc(doc(getFirebase().db, name, id)))
    }

    return {
      saveIncome: async (income: Income) => {
        await write(COLLECTIONS.incomes, income.id, incomeToPayload(income))
        upsert(queryClient, COLLECTIONS.incomes, ready().uid, income)
      },
      deleteIncome: (id: string) => {
        erase(COLLECTIONS.incomes, id)
        removeFrom(queryClient, COLLECTIONS.incomes, ready().uid, id)
      },
      saveMark: async (mark: Mark) => {
        await write(COLLECTIONS.marks, mark.id, markToPayload(mark))
        upsert(queryClient, COLLECTIONS.marks, ready().uid, mark)
      },
      deleteMark: (id: string) => {
        erase(COLLECTIONS.marks, id)
        removeFrom(queryClient, COLLECTIONS.marks, ready().uid, id)
      },
      saveProfile: async (profile: Profile) => {
        const { uid: owner } = ready()
        await write(COLLECTIONS.profiles, owner, profileToPayload(profile))
        queryClient.setQueryData(
          ledgerKey(COLLECTIONS.profiles, owner),
          profile,
        )
      },
    }
  }, [uid, dataKey, queryClient])
}
