'use client'

import { useState } from 'react'

import { Button, Stack, StatePanel, Text } from '~/components'
import type { Profile } from '~/core'
import { useLedger, useLedgerActions, useTaxes } from '~/features/ledger/hooks'
import { useYear } from '~/hooks'
import { useT } from '~/services/i18n'

import {
  AccountSection,
  EsvSection,
  GroupSection,
  RatesSection,
  RequisitesSection,
  ScheduleSection,
  SecuritySection,
} from '../components'
import { cleanRequisites, requisitesErrors } from '../services'

import { SaveBar } from './styled'

/**
 * The profile is edited as a draft and saved in one go, so a half-made
 * change never recalculates the taxes under the user's feet.
 */
export const SettingsScreen = () => {
  const t = useT()
  const { today, year } = useYear()
  const { profile, incomes } = useLedger()
  const taxes = useTaxes(today)
  const { saveProfile } = useLedgerActions()
  const [draft, setDraft] = useState<Profile | null>(null)
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!profile) return <StatePanel title={t('state_loading')} role="status" />

  const current = draft ?? profile
  const dirty =
    draft !== null && JSON.stringify(draft) !== JSON.stringify(profile)
  const errors = requisitesErrors(cleanRequisites(current.requisites))
  const invalid = Object.keys(errors).length > 0

  const change = (next: Profile) => {
    setDraft(next)
    setSaved(false)
  }

  const save = async () => {
    if (!draft || invalid) return
    setPending(true)
    try {
      await saveProfile({
        ...draft,
        requisites: cleanRequisites(draft.requisites),
      })
      setDraft(null)
      setSaved(true)
    } finally {
      setPending(false)
    }
  }

  const years = [...new Set([year + 1, ...taxes.years])].sort((a, b) => b - a)

  return (
    <Stack $gap="lg">
      <Text as="h1" variant="pageTitle">
        {t('nav_settings')}
      </Text>
      <GroupSection profile={current} today={today} onChange={change} />
      <RatesSection
        profile={current}
        years={years}
        initialYear={year}
        onChange={change}
      />
      <ScheduleSection profile={current} today={today} onChange={change} />
      <EsvSection profile={current} today={today} onChange={change} />
      <RequisitesSection profile={current} errors={errors} onChange={change} />
      <SecuritySection />
      <AccountSection incomes={incomes} />

      {dirty || saved ? (
        <SaveBar role="region" aria-label={t('settings_save_bar')}>
          {dirty ? (
            <>
              <Text variant="secondary">
                {invalid ? t('settings_fix_errors') : t('settings_unsaved')}
              </Text>
              <Button variant="ghost" onClick={() => setDraft(null)}>
                {t('action_cancel')}
              </Button>
              <Button
                variant="primary"
                disabled={pending || invalid}
                onClick={save}>
                {t('settings_save')}
              </Button>
            </>
          ) : (
            <Text variant="secondary">{t('settings_saved')}</Text>
          )}
        </SaveBar>
      ) : null}
    </Stack>
  )
}
