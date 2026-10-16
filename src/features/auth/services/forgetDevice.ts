import { forgetDeviceKeys } from '~/services/crypto'
import { clearFirestoreCache } from '~/services/firebase'

/**
 * Everything this browser keeps of an account once it is signed out: the
 * remembered data key and Firestore's offline cache with the ciphertexts and
 * the wrapped key. Then the page loads again, with nothing in memory and
 * fresh Firebase clients. A failure to clear is logged, never a reason to
 * stay on a page whose Firestore has already stopped.
 */
export const forgetDevice = async () => {
  try {
    await forgetDeviceKeys()
    await clearFirestoreCache()
  } catch (error) {
    console.warn(error)
  } finally {
    window.location.reload()
  }
}
