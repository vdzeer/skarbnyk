'use client'

import { useState } from 'react'

import { Button, Field, Row, SelectInput, Stack, Text } from '~/components'
import type { Income } from '~/core'
import { useSignOut } from '~/features/auth/hooks'
import { APP_NAME } from '~/services/brand'
import { downloadFile } from '~/services/download'
import { useT, type TranslationKey } from '~/services/i18n'
import { useAuthStore, useSettingsStore, useVaultStore } from '~/store'
import { THEME_PREFERENCES, type ThemePreference } from '~/types'

import { deleteAccount, incomesCsv } from '../../services'
import { Section } from '../Section'

import { Line } from './styled'

const THEME_KEYS: Record<ThemePreference, TranslationKey> = {
  system: 'theme_system',
  light: 'theme_light',
  dark: 'theme_dark',
}

/** Who is signed in, the theme, the data out, and the way to leave. */
export const AccountSection = ({ incomes }: { incomes: Income[] }) => {
  const t = useT()
  const signOut = useSignOut()
  const email = useAuthStore(state => state.user?.email ?? '')
  const theme = useSettingsStore(state => state.theme)
  const setTheme = useSettingsStore(state => state.setTheme)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [failed, setFailed] = useState(false)

  const exportCsv = () =>
    downloadFile(
      t('export_file_name', { app: APP_NAME }),
      incomesCsv(incomes, [
        t('incomes_day'),
        t('incomes_amount'),
        t('income_currency'),
        t('incomes_rate'),
        t('incomes_uah'),
        t('incomes_note'),
      ]),
      'text/csv;charset=utf-8',
    )

  const remove = async () => {
    setDeleting(true)
    setFailed(false)
    try {
      await deleteAccount()
      useVaultStore.getState().reset()
    } catch (error) {
      console.error(error)
      setFailed(true)
      setDeleting(false)
    }
  }

  return (
    <Section id="settings-account" title={t('settings_account')}>
      <Line>
        <Stack $gap="xxs">
          <Text>{t('account_google')}</Text>
          <Text variant="secondary" tone="muted">
            {email}
          </Text>
        </Stack>
        <Button icon="logout" onClick={signOut}>
          {t('action_sign_out')}
        </Button>
      </Line>
      <Line>
        <Field label={t('account_theme')} htmlFor="theme">
          <SelectInput
            id="theme"
            value={theme}
            onChange={event => setTheme(event.target.value as ThemePreference)}>
            {THEME_PREFERENCES.map(value => (
              <option key={value} value={value}>
                {t(THEME_KEYS[value])}
              </option>
            ))}
          </SelectInput>
        </Field>
      </Line>
      <Line>
        <Button
          icon="download"
          disabled={incomes.length === 0}
          onClick={exportCsv}>
          {t('account_export')}
        </Button>
        {confirming ? null : (
          <Button
            variant="danger"
            icon="trash"
            onClick={() => setConfirming(true)}>
            {t('account_delete')}
          </Button>
        )}
      </Line>
      {confirming ? (
        <Stack $gap="sm">
          <Text>{t('account_delete_confirm')}</Text>
          <Row>
            <Button variant="danger" disabled={deleting} onClick={remove}>
              {deleting ? t('account_deleting') : t('account_delete_yes')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {t('action_cancel')}
            </Button>
          </Row>
          {failed ? (
            <Text variant="secondary" tone="danger">
              {t('account_delete_failed')}
            </Text>
          ) : null}
        </Stack>
      ) : null}
    </Section>
  )
}
