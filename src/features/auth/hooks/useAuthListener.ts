import { useQueryClient } from '@tanstack/react-query'
import { onAuthStateChanged } from 'firebase/auth'
import { useEffect } from 'react'

import { getFirebase } from '~/services/firebase'
import { useAuthStore } from '~/store'

import { forgetDevice } from '../services'

/** The single writer of the auth state. Mounted once, at the root. */
export const useAuthListener = () => {
  const queryClient = useQueryClient()
  const setUser = useAuthStore(state => state.setUser)

  useEffect(
    () =>
      onAuthStateChanged(getFirebase().auth, user => {
        const wasSignedIn = useAuthStore.getState().status === 'signed_in'
        // Another account's data must not survive in memory after sign-out.
        if (!user) queryClient.clear()
        setUser(user ? { uid: user.uid, email: user.email } : null)
        // Signed out here or in another tab, or the account was deleted:
        // the browser's copies go too, and the page starts over.
        if (!user && wasSignedIn) forgetDevice()
      }),
    [queryClient, setUser],
  )
}
