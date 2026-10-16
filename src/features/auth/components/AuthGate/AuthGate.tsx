'use client'

import { useEffect, type ReactNode } from 'react'

import { Button, Shell, StatePanel, Welcome } from '~/components'
import { WrongKeyError, useLedger } from '~/features/ledger/hooks'
import { ProfileSetupScreen } from '~/features/settings/screens'
import { useVaultActions, useVaultLoader } from '~/features/vault/hooks'
import { SetupScreen, UnlockScreen } from '~/features/vault/screens'
import { useT } from '~/services/i18n'
import { useAuthStore, useVaultStore } from '~/store'

import { useAuthListener } from '../../hooks'
import { SignInScreen } from '../../screens'
import { rootView } from '../../services'

import { Splash } from './styled'

/** Once the vault is open: the first setup, or the app itself. */
const ProfileGate = ({ children }: { children: ReactNode }) => {
  const t = useT()
  const { state, profile, error, retry } = useLedger()
  const { lock } = useVaultActions()
  const email = useAuthStore(store => store.user?.email ?? '')
  const wrongKey = error instanceof WrongKeyError

  // A key remembered from an account that no longer exists: forget it and
  // ask for the password, which opens the account that does.
  useEffect(() => {
    if (wrongKey) lock()
  }, [wrongKey, lock])

  if (state === 'loading' || wrongKey) return <Splash aria-busy="true" />
  if (state === 'error') {
    return (
      <Welcome>
        <StatePanel
          role="alert"
          title={t('state_error_title')}
          text={t('state_error_text')}
          actions={<Button onClick={retry}>{t('action_retry')}</Button>}
        />
      </Welcome>
    )
  }
  if (!profile) return <ProfileSetupScreen />

  return (
    <Shell email={email} onLock={lock}>
      {children}
    </Shell>
  )
}

/** The top-level decision: wait, sign in, make or type the password, open. */
export const AuthGate = ({ children }: { children: ReactNode }) => {
  const t = useT()
  useAuthListener()
  const retryVault = useVaultLoader()
  const view = rootView(
    useAuthStore(state => state.status),
    useVaultStore(state => state.status),
  )

  if (view === 'splash') return <Splash aria-busy="true" />
  if (view === 'signin') return <SignInScreen />
  if (view === 'setup') return <SetupScreen />
  if (view === 'unlock') return <UnlockScreen />
  if (view === 'vaultError') {
    return (
      <Welcome>
        <StatePanel
          role="alert"
          title={t('state_error_title')}
          text={t('state_error_text')}
          actions={<Button onClick={retryVault}>{t('action_retry')}</Button>}
        />
      </Welcome>
    )
  }

  return <ProfileGate>{children}</ProfileGate>
}
