import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth'
import { useCallback, useState } from 'react'

import { USE_EMULATORS, getFirebase } from '~/services/firebase'

// Closing the popup is a decision, not a failure worth a message.
const QUIET_CODES = [
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
]

export const useSignIn = () => {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  const signIn = useCallback(async () => {
    setPending(true)
    setFailed(false)
    try {
      await signInWithPopup(getFirebase().auth, new GoogleAuthProvider())
    } catch (error) {
      const code = (error as { code?: string }).code ?? ''
      if (!QUIET_CODES.includes(code)) {
        console.error(error)
        setFailed(true)
      }
    } finally {
      setPending(false)
    }
  }, [])

  /**
   * A test user for local development only: the Auth emulator accepts this
   * unsigned Google credential, a real project never does, and the button is
   * never offered when the app talks to one. It is a Google sign-in because
   * the security rules let no other provider in.
   */
  const signInForDevelopment = useCallback(async () => {
    if (!USE_EMULATORS) return
    await signInWithCredential(
      getFirebase().auth,
      GoogleAuthProvider.credential(
        JSON.stringify({
          sub: 'dev-user',
          email: 'dev@example.com',
          email_verified: true,
        }),
      ),
    )
  }, [])

  return {
    signIn,
    pending,
    failed,
    signInForDevelopment: USE_EMULATORS ? signInForDevelopment : null,
  }
}
