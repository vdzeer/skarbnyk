'use client'

import { useState, type FormEvent } from 'react'

import { Button, Field, Row, Stack, Text, TextInput } from '~/components'
import { NewPasswordFields, RecoveryKeyCard } from '~/features/vault/components'
import { useVaultActions } from '~/features/vault/hooks'
import { passwordProblem } from '~/features/vault/services'
import { useT } from '~/services/i18n'

import { Section } from '../Section'

import { Warning } from './styled'

type Mode = 'idle' | 'password' | 'recovery'

/** New password, new recovery key: both ask for the current password. */
export const SecuritySection = () => {
  const t = useT()
  const { replacePassword, newRecoveryKey } = useVaultActions()
  const [mode, setMode] = useState<Mode>('idle')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [tried, setTried] = useState(false)
  const [pending, setPending] = useState(false)
  const [wrong, setWrong] = useState(false)
  const [failed, setFailed] = useState(false)
  const [done, setDone] = useState(false)
  const [recoveryText, setRecoveryText] = useState<string | null>(null)

  const reset = (to: Mode) => {
    setMode(to)
    setCurrent('')
    setNext('')
    setRepeat('')
    setTried(false)
    setWrong(false)
    setFailed(false)
    setDone(false)
    setRecoveryText(null)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTried(true)
    if (mode === 'password' && passwordProblem(next, repeat)) return
    setPending(true)
    setWrong(false)
    setFailed(false)
    try {
      if (mode === 'password') {
        const ok = await replacePassword(current, next)
        setWrong(!ok)
        if (ok) {
          reset('idle')
          setDone(true)
        }
      } else {
        const text = await newRecoveryKey(current)
        setWrong(text === null)
        setRecoveryText(text)
      }
    } catch (error) {
      // Usually the key record did not reach the server, so nothing changed.
      console.error(error)
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <Section
      id="settings-security"
      title={t('settings_security')}
      text={t('settings_security_text')}>
      {mode === 'idle' ? (
        <Row>
          <Button icon="key" onClick={() => reset('password')}>
            {t('security_change_password')}
          </Button>
          <Button onClick={() => reset('recovery')}>
            {t('security_new_recovery')}
          </Button>
        </Row>
      ) : null}
      {done ? (
        <Text variant="secondary">{t('security_password_changed')}</Text>
      ) : null}

      {mode !== 'idle' && !recoveryText ? (
        <form onSubmit={submit} noValidate>
          <Stack $gap="md">
            <Field
              label={t('security_current')}
              htmlFor="current-password"
              error={wrong ? t('unlock_wrong') : undefined}>
              <TextInput
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={current}
                aria-invalid={wrong}
                onChange={event => setCurrent(event.target.value)}
              />
            </Field>
            {mode === 'password' ? (
              <NewPasswordFields
                password={next}
                repeat={repeat}
                onPassword={setNext}
                onRepeat={setRepeat}
                problem={tried ? passwordProblem(next, repeat) : null}
              />
            ) : (
              <Text variant="secondary" tone="muted">
                {t('security_new_recovery_text')}
              </Text>
            )}
            {failed ? (
              <Text variant="secondary" tone="danger">
                {t('security_failed')}
              </Text>
            ) : null}
            <Row>
              <Button type="submit" variant="primary" disabled={pending}>
                {pending
                  ? t('unlock_pending')
                  : t(
                      mode === 'password'
                        ? 'security_save_password'
                        : 'security_make_recovery',
                    )}
              </Button>
              <Button variant="ghost" onClick={() => reset('idle')}>
                {t('action_cancel')}
              </Button>
            </Row>
          </Stack>
        </form>
      ) : null}

      {recoveryText ? (
        <Stack $gap="md">
          <RecoveryKeyCard recoveryText={recoveryText} />
          <Button variant="primary" onClick={() => reset('idle')}>
            {t('recovery_saved')}
          </Button>
        </Stack>
      ) : null}

      <Warning>
        <Text variant="secondary">{t('security_warning')}</Text>
      </Warning>
    </Section>
  )
}
