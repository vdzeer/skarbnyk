import {
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithPopup,
  type User,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'

import { COLLECTIONS } from '~/features/ledger/services'
import { forgetDeviceKeys } from '~/services/crypto'
import { getFirebase } from '~/services/firebase'

/** A batch holds 500 writes; staying under it leaves room for nothing else. */
const BATCH_SIZE = 400

const chunk = <Item>(items: Item[], size: number): Item[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  )

const deleteOwned = async (name: string, uid: string) => {
  const { db } = getFirebase()
  const snapshot = await getDocs(
    query(collection(db, name), where('owner_uid', '==', uid)),
  )
  await chunk<QueryDocumentSnapshot>(snapshot.docs, BATCH_SIZE).reduce(
    (previous, documents) =>
      previous.then(() => {
        const batch = writeBatch(db)
        documents.forEach(document => batch.delete(document.ref))
        return batch.commit()
      }),
    Promise.resolve(),
  )
}

const deleteSignIn = async (user: User) => {
  try {
    await deleteUser(user)
  } catch (error) {
    // Firebase refuses to delete a sign-in that is not fresh.
    if ((error as { code?: string }).code !== 'auth/requires-recent-login') {
      throw error
    }
    await reauthenticateWithPopup(user, new GoogleAuthProvider())
    await deleteUser(user)
  }
}

/**
 * Data first, the key next, the sign-in last: a deletion that stops half-way
 * can be run again, because the user can still sign in and unlock. Unlike
 * ordinary writes this one is awaited, since it only makes sense online.
 */
export const deleteAccount = async () => {
  const { auth, db } = getFirebase()
  const user = auth.currentUser
  if (!user) throw new Error('not signed in')

  await deleteOwned(COLLECTIONS.incomes, user.uid)
  await deleteOwned(COLLECTIONS.marks, user.uid)
  await deleteDoc(doc(db, COLLECTIONS.profiles, user.uid))
  await deleteDoc(doc(db, COLLECTIONS.reminders, user.uid))
  await deleteDoc(doc(db, COLLECTIONS.keys, user.uid))
  await forgetDeviceKeys()
  await deleteSignIn(user)
}
