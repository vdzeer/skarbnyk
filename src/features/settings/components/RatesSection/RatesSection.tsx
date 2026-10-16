'use client'

import { useState } from 'react'

import { Button, Row, Text, YearSelect } from '~/components'
import {
  ratesFor,
  summarizeYear,
  type Profile,
  type RateOverrides,
} from '~/core'
import { useT } from '~/services/i18n'

import { OverrideField } from '../OverrideField'
import { Section } from '../Section'

import { Fields } from './styled'

type Props = {
  profile: Profile
  years: number[]
  initialYear: number
  onChange: (profile: Profile) => void
}

/** The law's numbers for a year, each replaceable by the user's own. */
export const RatesSection = ({
  profile,
  years,
  initialYear,
  onChange,
}: Props) => {
  const t = useT()
  const [year, setYear] = useState(initialYear)
  const overrides = profile.overrides[String(year)] ?? {}
  const law = ratesFor(year)
  const group = summarizeYear(profile, [], year).limitGroup ?? 3
  const vat = profile.periods[profile.periods.length - 1].vat

  const set = (key: keyof RateOverrides, value: number | undefined) => {
    const next: RateOverrides = { ...overrides, [key]: value }
    if (value === undefined) delete next[key]
    const all = { ...profile.overrides, [String(year)]: next }
    if (Object.keys(next).length === 0) delete all[String(year)]
    onChange({ ...profile, overrides: all })
  }

  const field = (
    key: keyof RateOverrides,
    label: string,
    kind: 'percent' | 'money',
    lawValue: number,
  ) => (
    <OverrideField
      key={`${year}-${key}`}
      id={`rate-${key}`}
      label={label}
      kind={kind}
      law={lawValue}
      value={overrides[key]}
      onChange={value => set(key, value)}
    />
  )

  const fixed = group !== 3

  return (
    <Section
      id="settings-rates"
      title={t('settings_rates', { year })}
      text={t('settings_rates_text')}>
      <Row $justify="space-between">
        <YearSelect years={years} value={year} onChange={setYear} />
        <Button
          variant="ghost"
          disabled={Object.keys(overrides).length === 0}
          onClick={() => {
            const all = { ...profile.overrides }
            delete all[String(year)]
            onChange({ ...profile, overrides: all })
          }}>
          {t('settings_rates_reset')}
        </Button>
      </Row>
      {law.estimated ? (
        <Text variant="secondary" tone="danger">
          {t('rates_estimated', { year, lawYear: law.lawYear })}
        </Text>
      ) : null}
      <Fields>
        {fixed
          ? field(
              'singleTaxMonthly',
              t('settings_single_tax_monthly', { group }),
              'money',
              law.singleTaxMonthly[group],
            )
          : field(
              'singleTaxPercent',
              t('settings_single_tax_percent'),
              'percent',
              vat ? law.singleTaxPercent.vat : law.singleTaxPercent.base,
            )}
        {fixed
          ? field(
              'levyMonthly',
              t('settings_levy_monthly'),
              'money',
              law.levyMonthly,
            )
          : field(
              'levyPercent',
              t('settings_levy_percent'),
              'percent',
              law.levyPercent,
            )}
        {field('minWage', t('settings_min_wage'), 'money', law.minWageJan)}
        {field(
          'limit',
          t('settings_limit', { group }),
          'money',
          law.limit[group],
        )}
      </Fields>
      {fixed ? (
        <Text variant="caption" tone="muted">
          {t('settings_council_hint')}
        </Text>
      ) : null}
    </Section>
  )
}
