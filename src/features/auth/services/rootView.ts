import type { AuthStatus, VaultStatus } from '~/store'

export type RootView =
  'splash' | 'signin' | 'setup' | 'unlock' | 'vaultError' | 'app'

/**
 * What the app shows at the top level: wait, sign in, create the password,
 * type the password, or open. It follows live state, not a stored flag, so a
 * returning user is not bounced to sign-in on every load.
 */
export const rootView = (auth: AuthStatus, vault: VaultStatus): RootView => {
  if (auth === 'signed_out') return 'signin'
  if (auth === 'unknown') return 'splash'
  if (vault === 'missing') return 'setup'
  if (vault === 'locked') return 'unlock'
  if (vault === 'error') return 'vaultError'
  if (vault === 'unlocked') return 'app'
  return 'splash'
}
