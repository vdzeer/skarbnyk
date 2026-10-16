'use client'

import { useState, type FormEvent } from 'react'

import {
  Button,
  Card,
  Checkbox,
  Field,
  Stack,
  Text,
  TextInput,
  Welcome,
} from '~/components'
import { useSignOut } from '~/features/auth/hooks'
import { useT } from '~/services/i18n'
import { useAuthStore } from '~/store'

import { NewPasswordFields } from '../components'
import { useVaultActions } from '../hooks'
import { passwordProblem } from '../services'

type Stage = 'password' | 'recovery' | 'newPassword'

/**
 * The key record exists, the key is not in memory: type the password. A
 * forgotten password is replaced through the recovery key.
 */
export const UnlockScreen = () => {
  const t = useT()
  const { unlock, recover, setNewPassword } = useVaultActions()
  const signOut = useSignOut()
  const email = useAuthStore(state => state.user?.email ?? '')
  const [stage, setStage] = useState<Stage>('password')
  const [secret, setSecret] = useState('')
  const [repeat, setRepeat] = useState('')
  const [remember, setRemember] = useState(false)
  const [tried, setTried] = useState(false)
  const [pending, setPending] = useState(false)
  const [wrong, setWrong] = useState(false)
  const [recoveredKey, setRecoveredKey] = useState<CryptoKey | null>(null)

  const goTo = (next: Stage) => {
    setStage(next)
    setSecret('')
    setRepeat('')
    setTried(false)
    setWrong(false)
  }

  const attempt = async (action: () => Promise<boolean>) => {
    setPending(true)
    setWrong(false)
    try {
      setWrong(!(await action()))
    } catch (error) {
      console.error(error)
      setWrong(true)
    } finally {
      setPending(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTried(true)

    if (stage === 'password') {
      await attempt(() => unlock(secret, remember))
      return
    }

    if (stage === 'recovery') {
      await attempt(async () => {
        const key = await recover(secret)
        if (!key) return false
        setRecoveredKey(key)
        goTo('newPassword')
        return true
      })
      return
    }

    if (passwordProblem(secret, repeat) || !recoveredKey) return
    await attempt(async () => {
      await setNewPassword(recoveredKey, secret, remember)
      return true
    })
  }

  const titles = {
    password: ['unlock_title', 'unlock_text'],
    recovery: ['unlock_recovery_title', 'unlock_recovery_text'],
    newPassword: ['unlock_new_title', 'unlock_new_text'],
  } as const

  return (
    <Welcome>
      <Card as="form" onSubmit={submit} noValidate>
        <Stack $gap="md">
          <Text as="h2" variant="title">
            {t(titles[stage][0])}
          </Text>
          <Text tone="muted">{t(titles[stage][1], { email })}</Text>

          {stage === 'password' ? (
            <Field
              label={t('unlock_password_label')}
              htmlFor="password"
              error={wrong ? t('unlock_wrong') : undefined}>
              <TextInput
                id="password"
                type="password"
                autoComplete="current-password"
                value={secret}
                aria-invalid={wrong}
                onChange={event => setSecret(event.target.value)}
              />
            </Field>
          ) : null}

          {stage === 'recovery' ? (
            <Field
              label={t('recovery_key_label')}
              htmlFor="recovery"
              error={wrong ? t('unlock_recovery_wrong') : undefined}>
              <TextInput
                id="recovery"
                autoComplete="off"
                spellCheck={false}
                value={secret}
                aria-invalid={wrong}
                onChange={event => setSecret(event.target.value)}
              />
            </Field>
          ) : null}

          {stage === 'newPassword' ? (
            <NewPasswordFields
              password={secret}
              repeat={repeat}
              onPassword={setSecret}
              onRepeat={setRepeat}
              problem={tried ? passwordProblem(secret, repeat) : null}
            />
          ) : null}

          {stage !== 'recovery' ? (
            <Checkbox
              checked={remember}
              onChange={setRemember}
              label={t('unlock_remember')}
              hint={t('unlock_remember_hint')}
            />
          ) : null}

          <Button type="submit" variant="primary" size="lg" disabled={pending}>
            {pending ? t('unlock_pending') : t(`unlock_submit_${stage}`)}
          </Button>

          {stage === 'password' ? (
            <Button variant="ghost" onClick={() => goTo('recovery')}>
              {t('unlock_forgot')}
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => goTo('password')}>
              {t('unlock_back')}
            </Button>
          )}
        </Stack>
      </Card>
      <Button variant="ghost" icon="logout" onClick={signOut}>
        {t('action_sign_out')}
      </Button>
    </Welcome>
  )
}
