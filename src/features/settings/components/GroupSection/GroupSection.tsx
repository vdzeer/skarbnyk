'use client'

import { useState } from 'react'

import {
  Button,
  Checkbox,
  DateInput,
  Field,
  Row,
  Segmented,
  Stack,
  Text,
} from '~/components'
import {
  EARLIEST_DAY,
  GROUPS,
  isDayKey,
  type DayKey,
  type Group,
  type Profile,
} from '~/core'
import { DAY_FULL, formatDay } from '~/services/format'
import { useT, type TranslationKey } from '~/services/i18n'

import { addPeriod, periodProblem, withRegistration } from '../../services'
import { Section } from '../Section'

import { Period, Periods } from './styled'

const PROBLEM_KEYS: Record<'not_quarter' | 'before_last', TranslationKey> = {
  not_quarter: 'settings_change_not_quarter',
  before_last: 'settings_change_before_last',
}

/** A whole date from 1999 on; a year still being typed is ignored. */
const isFopDay = (day: string) => isDayKey(day) && day >= EARLIEST_DAY

type Props = {
  profile: Profile
  today: DayKey
  onChange: (profile: Profile) => void
}

/** The group, its history and the registration day. */
export const GroupSection = ({ profile, today, onChange }: Props) => {
  const t = useT()
  const [adding, setAdding] = useState(false)
  const [from, setFrom] = useState('')
  const [group, setGroup] = useState<Group>(3)
  const [vat, setVat] = useState(false)
  const [tried, setTried] = useState(false)

  const { periods } = profile
  const single = periods.length === 1
  const problem = tried ? periodProblem(periods, from) : null

  const updateFirst = (patch: Partial<(typeof periods)[number]>) =>
    onChange({
      ...profile,
      periods: [{ ...periods[0], ...patch }, ...periods.slice(1)],
    })

  const add = () => {
    setTried(true)
    if (periodProblem(periods, from)) return
    onChange({ ...profile, periods: addPeriod(periods, from, group, vat) })
    setAdding(false)
    setTried(false)
    setFrom('')
  }

  return (
    <Section id="settings-fop" title={t('settings_fop')}>
      <Field label={t('settings_registered')} htmlFor="registered-on">
        <DateInput
          id="registered-on"
          value={profile.registeredOn}
          max={today}
          onChange={event =>
            isFopDay(event.target.value) &&
            onChange({
              ...profile,
              registeredOn: event.target.value,
              periods: withRegistration(periods, event.target.value),
            })
          }
        />
      </Field>

      <Field label={t('settings_track_from')} htmlFor="track-from">
        <DateInput
          id="track-from"
          value={profile.trackFrom}
          max={today}
          onChange={event =>
            isFopDay(event.target.value) &&
            onChange({ ...profile, trackFrom: event.target.value })
          }
        />
        <Text variant="caption" tone="muted">
          {t('settings_track_from_hint')}
        </Text>
      </Field>

      {single ? (
        <>
          <Field label={t('settings_group')}>
            <Segmented
              label={t('settings_group')}
              options={GROUPS.map(value => ({
                value,
                label: t('group_name', { group: value }),
              }))}
              selected={[periods[0].group]}
              onSelect={value =>
                updateFirst({
                  group: value,
                  vat: value === 3 && periods[0].vat,
                })
              }
            />
          </Field>
          {periods[0].group === 3 ? (
            <Checkbox
              checked={periods[0].vat}
              onChange={value => updateFirst({ vat: value })}
              label={t('settings_vat')}
              hint={t('settings_vat_hint')}
            />
          ) : null}
        </>
      ) : (
        <Stack $gap="xs">
          <Text variant="label">{t('settings_periods')}</Text>
          <Periods>
            {periods.map((period, index) => (
              <Period key={period.from}>
                <Text>
                  {t(period.vat ? 'settings_period_vat' : 'settings_period', {
                    from: formatDay(period.from, DAY_FULL),
                    group: period.group,
                  })}
                </Text>
                {index > 0 ? (
                  <Button
                    variant="ghost"
                    icon="trash"
                    aria-label={t('settings_period_remove', {
                      from: formatDay(period.from, DAY_FULL),
                    })}
                    onClick={() =>
                      onChange({
                        ...profile,
                        periods: periods.filter((_, at) => at !== index),
                      })
                    }
                  />
                ) : null}
              </Period>
            ))}
          </Periods>
        </Stack>
      )}

      {adding ? (
        <Stack $gap="sm">
          <Field
            label={t('settings_change_from')}
            htmlFor="change-from"
            error={problem ? t(PROBLEM_KEYS[problem]) : undefined}>
            <DateInput
              id="change-from"
              value={from}
              aria-invalid={Boolean(problem)}
              onChange={event => setFrom(event.target.value)}
            />
          </Field>
          <Segmented
            label={t('settings_group')}
            options={GROUPS.map(value => ({
              value,
              label: t('group_name', { group: value }),
            }))}
            selected={[group]}
            onSelect={setGroup}
          />
          {group === 3 ? (
            <Checkbox
              checked={vat}
              onChange={setVat}
              label={t('settings_vat')}
            />
          ) : null}
          <Row>
            <Button onClick={add}>{t('settings_change_add')}</Button>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              {t('action_cancel')}
            </Button>
          </Row>
        </Stack>
      ) : (
        <Button variant="ghost" icon="plus" onClick={() => setAdding(true)}>
          {t('settings_change_group')}
        </Button>
      )}
    </Section>
  )
}
