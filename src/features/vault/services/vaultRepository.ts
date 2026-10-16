import { doc, getDoc, setDoc } from 'firebase/firestore'

import { COLLECTIONS } from '~/features/ledger/services/collections'
import type { KeyRecord } from '~/services/crypto'
import { getFirebase } from '~/services/firebase'
import { keyRecordFromDoc, keyRecordToDoc } from '~/services/keyRecord'

/** Null when the account has never created a password. */
export const fetchKeyRecord = async (uid: string) => {
  const snapshot = await getDoc(doc(getFirebase().db, COLLECTIONS.keys, uid))
  return snapshot.exists() ? keyRecordFromDoc(snapshot.data()) : null
}

/**
 * Awaited, unlike ordinary writes: nothing may be encrypted with a key that
 * the server has not stored, or it could never be opened again.
 */
export const saveKeyRecord = (uid: string, record: KeyRecord) =>
  setDoc(
    doc(getFirebase().db, COLLECTIONS.keys, uid),
    keyRecordToDoc(record, uid),
  )
