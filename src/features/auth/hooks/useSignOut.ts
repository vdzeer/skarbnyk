import { useQueryClient } from '@tanstack/react-query'
import { signOut } from 'firebase/auth'
import { useCallback } from 'react'

import { forgetDeviceKeys } from '~/services/crypto'
import { getFirebase, settleWrites } from '~/services/firebase'
import { useVaultStore } from '~/store'

/** How long a change made just before signing out may take to reach the server. */
const SETTLE_MS = 3000

/**
 * Signing out also forgets the key on this device and every decrypted row.
 * The auth listener then deletes Firestore's offline cache and reloads.
 */
export const useSignOut = () => {
  const queryClient = useQueryClient()

  return useCallback(async () => {
    // The cache that holds unsent writes is deleted after sign-out, so a
    // change made a moment ago gets a chance to reach the server first.
    await settleWrites(SETTLE_MS)
    await forgetDeviceKeys()
    useVaultStore.getState().reset()
    queryClient.clear()
    await signOut(getFirebase().auth)
  }, [queryClient])
}
