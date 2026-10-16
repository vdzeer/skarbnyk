'use client'

import { Checkbox, Stack, Text } from '~/components'
import type { DayKey, Profile } from '~/core'
import { useT } from '~/services/i18n'

import { Section } from '../Section'

type Props = {
  profile: Profile
  today: DayKey
  onChange: (profile: Profile) => void
}

/** Pay by the law's quarterly dates, or split it into months and pay ahead. */
export const ScheduleSection = ({ profile, today, onChange }: Props) => {
  const t = useT()
  // Monthly paying starts now: what was already due stays with the quarter.
  const set = (paySchedule: Profile['paySchedule']) =>
    onChange({
      ...profile,
      paySchedule,
      monthlySince: paySchedule === 'monthly' ? today : '',
    })

  return (
    <Section
      id="settings-schedule"
      title={t('settings_schedule')}
      text={t('settings_schedule_text')}>
      <Stack $gap="xxs" role="radiogroup" aria-label={t('settings_schedule')}>
        <Checkbox
          type="radio"
          name="schedule"
          checked={profile.paySchedule === 'quarterly'}
          onChange={() => set('quarterly')}
          label={t('schedule_quarterly')}
          hint={t('schedule_quarterly_hint')}
        />
        <Checkbox
          type="radio"
          name="schedule"
          checked={profile.paySchedule === 'monthly'}
          onChange={() => set('monthly')}
          label={t('schedule_monthly')}
          hint={t('schedule_monthly_hint')}
        />
      </Stack>
      <Text variant="caption" tone="muted">
        {t('schedule_note')}
      </Text>
    </Section>
  )
}
