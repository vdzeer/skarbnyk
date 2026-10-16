import { create } from 'zustand'

export type AuthUser = { uid: string; email: string | null }

/**
 * Three states, not two: until Firebase has answered, the app does not know
 * whether anyone is signed in, and treating "unknown" as "signed out" would
 * flash the sign-in screen at every returning user.
 */
export type AuthStatus = 'unknown' | 'signed_in' | 'signed_out'

type AuthState = {
  status: AuthStatus
  user: AuthUser | null
  /** Written by the one auth listener and by nothing else. */
  setUser: (user: AuthUser | null) => void
}

export const useAuthStore = create<AuthState>(set => ({
  status: 'unknown',
  user: null,
  setUser: user => set({ status: user ? 'signed_in' : 'signed_out', user }),
}))

/** The uid, but only once the user is known to be signed in. */
export const useUid = () =>
  useAuthStore(state =>
    state.status === 'signed_in' ? (state.user?.uid ?? null) : null,
  )
