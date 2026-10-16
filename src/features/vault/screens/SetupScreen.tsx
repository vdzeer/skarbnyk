'use client'

import { useState, type FormEvent } from 'react'

import {
  Button,
  Card,
  Checkbox,
  Stack,
  Steps,
  Text,
  Welcome,
} from '~/components'
import type { NewVault } from '~/services/crypto'
import { useT } from '~/services/i18n'

import { NewPasswordFields, RecoveryKeyCard } from '../components'
import { useVaultActions } from '../hooks'
import { passwordProblem } from '../services'

/** First visit: a password for the data key, then the recovery key, once. */
export const SetupScreen = () => {
  const t = useT()
  const { create, finishSetup } = useVaultActions()
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [tried, setTried] = useState(false)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const [vault, setVault] = useState<NewVault | null>(null)
  const [saved, setSaved] = useState(false)
  const [remember, setRemember] = useState(false)

  const problem = tried ? passwordProblem(password, repeat) : null
  const steps = [t('step_google'), t('step_password'), t('step_profile')]

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTried(true)
    if (passwordProblem(password, repeat)) return
    setPending(true)
    setFailed(false)
    try {
      setVault(await create(password))
      setPassword('')
      setRepeat('')
    } catch (error) {
      console.error(error)
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  if (vault) {
    return (
      <Welcome>
        <Steps current={2} labels={steps} />
        <Card>
          <Stack $gap="md">
            <Text as="h2" variant="title">
              {t('recovery_title')}
            </Text>
            <Text tone="muted">{t('recovery_text')}</Text>
            <RecoveryKeyCard recoveryText={vault.recoveryText} />
            <Checkbox
              checked={saved}
              onChange={setSaved}
              label={t('recovery_saved')}
            />
            <Checkbox
              checked={remember}
              onChange={setRemember}
              label={t('unlock_remember')}
              hint={t('unlock_remember_hint')}
            />
            <Button
              variant="primary"
              size="lg"
              disabled={!saved}
              onClick={() => finishSetup(vault, remember)}>
              {t('action_next')}
            </Button>
          </Stack>
        </Card>
      </Welcome>
    )
  }

  return (
    <Welcome>
      <Steps current={2} labels={steps} />
      <Card as="form" onSubmit={submit} noValidate>
        <Stack $gap="md">
          <Text as="h2" variant="title">
            {t('setup_title')}
          </Text>
          <Text tone="muted">{t('setup_text')}</Text>
          <NewPasswordFields
            password={password}
            repeat={repeat}
            onPassword={setPassword}
            onRepeat={setRepeat}
            problem={problem}
          />
          {failed ? (
            <Text variant="secondary" tone="danger">
              {t('setup_failed')}
            </Text>
          ) : null}
          <Button type="submit" variant="primary" size="lg" disabled={pending}>
            {pending ? t('setup_pending') : t('setup_submit')}
          </Button>
        </Stack>
      </Card>
    </Welcome>
  )
}
