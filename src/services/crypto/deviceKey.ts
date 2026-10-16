/**
 * "Remember on this device": a non-extractable copy of the data key in
 * IndexedDB. Script on the page can use it but cannot read its bytes, so it
 * cannot be copied off the device. Lock and sign-out delete it.
 *
 * Browser only. Every failure (private mode, storage blocked) reads as "no
 * key here": the user types the password, nothing breaks.
 */

const DB_NAME = 'skarbnyk-device'
const STORE = 'keys'

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const run = async <Result>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<Result>,
): Promise<Result> => {
  const db = await openDb()
  try {
    return await new Promise<Result>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } finally {
    db.close()
  }
}

export const rememberDeviceKey = async (uid: string, dataKey: CryptoKey) => {
  try {
    const raw = await crypto.subtle.exportKey('raw', dataKey)
    const local = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [
      'encrypt',
      'decrypt',
    ])
    await run('readwrite', store => store.put(local, uid))
  } catch (error) {
    console.warn(error)
  }
}

export const loadDeviceKey = async (uid: string): Promise<CryptoKey | null> => {
  try {
    const key = await run<unknown>('readonly', store => store.get(uid))
    return key instanceof CryptoKey ? key : null
  } catch {
    return null
  }
}

/** Forgets every remembered key, not only the current account's. */
export const forgetDeviceKeys = async () => {
  try {
    await run('readwrite', store => store.clear())
  } catch (error) {
    console.warn(error)
  }
}
