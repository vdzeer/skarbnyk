'use client'

import {
  Checkbox,
  DateInput,
  Field,
  Row,
  SelectInput,
  Stack,
  Text,
} from '~/components'
import {
  ESV_EXEMPTIONS,
  ratesFor,
  yearOf,
  type DayKey,
  type EsvExemption,
  type Profile,
} from '~/core'
import { formatMoney } from '~/services/format'
import { useT, type TranslationKey } from '~/services/i18n'

import { OverrideField } from '../OverrideField'
import { Section } from '../Section'

const EXEMPTION_KEYS: Record<EsvExemption, TranslationKey> = {
  pensioner: 'esv_exemption_pensioner',
  disability: 'esv_exemption_disability',
  employed: 'esv_exemption_employed',
}

type Props = {
  profile: Profile
  today: DayKey
  onChange: (profile: Profile) => void
}

/** How much ЄСВ, whether at all, and military service, which frees everything. */
export const EsvSection = ({ profile, today, onChange }: Props) => {
  const t = useT()
  const { esv, service } = profile
  const least = ratesFor(yearOf(today)).esvMin[Number(today.slice(5, 7)) - 1]
  const setEsv = (patch: Partial<Profile['esv']>) =>
    onChange({ ...profile, esv: { ...esv, ...patch } })

  return (
    <Section id="settings-esv" title={t('settings_esv')}>
      <Stack $gap="xxs" role="radiogroup" aria-label={t('settings_esv')}>
        <Checkbox
          type="radio"
          name="esv"
          checked={esv.mode === 'minimum'}
          onChange={() => setEsv({ mode: 'minimum' })}
          label={t('esv_minimum', { amount: formatMoney(least) })}
        />
        <Checkbox
          type="radio"
          name="esv"
          checked={esv.mode === 'custom'}
          onChange={() =>
            setEsv({ mode: 'custom', monthly: esv.monthly || least })
          }
          label={t('esv_custom')}
        />
        <Checkbox
          type="radio"
          name="esv"
          checked={esv.mode === 'exempt'}
          onChange={() =>
            setEsv({
              mode: 'exempt',
              exemption: esv.exemption ?? 'pensioner',
              since: esv.since ?? `${today.slice(0, 7)}-01`,
            })
          }
          label={t('esv_exempt')}
        />
      </Stack>

      {esv.mode === 'custom' ? (
        <OverrideField
          id="esv-monthly"
          label={t('esv_monthly')}
          kind="money"
          law={least}
          value={esv.monthly === least ? undefined : esv.monthly}
          onChange={value => setEsv({ monthly: value ?? least })}
        />
      ) : null}

      {esv.mode === 'exempt' ? (
        <Row $align="flex-start">
          <Field label={t('esv_exemption')} htmlFor="esv-exemption">
            <SelectInput
              id="esv-exemption"
              value={esv.exemption ?? 'pensioner'}
              onChange={event =>
                setEsv({ exemption: event.target.value as EsvExemption })
              }>
              {ESV_EXEMPTIONS.map(reason => (
                <option key={reason} value={reason}>
                  {t(EXEMPTION_KEYS[reason])}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={t('esv_since')} htmlFor="esv-since">
            <DateInput
              id="esv-since"
              value={esv.since ?? ''}
              onChange={event =>
                event.target.value && setEsv({ since: event.target.value })
              }
            />
          </Field>
        </Row>
      ) : null}
      {esv.mode === 'exempt' ? (
        <Text variant="caption" tone="muted">
          {t('esv_exempt_hint')}
        </Text>
      ) : null}

      <Checkbox
        checked={service !== null}
        onChange={on =>
          onChange({
            ...profile,
            service: on ? { from: `${today.slice(0, 7)}-01`, to: null } : null,
          })
        }
        label={t('service_label')}
        hint={t('service_hint')}
      />
      {service ? (
        <Row $align="flex-start">
          <Field label={t('service_from')} htmlFor="service-from">
            <DateInput
              id="service-from"
              value={service.from}
              onChange={event =>
                event.target.value &&
                onChange({
                  ...profile,
                  service: { ...service, from: event.target.value },
                })
              }
            />
          </Field>
          <Field label={t('service_to')} htmlFor="service-to">
            <DateInput
              id="service-to"
              value={service.to ?? ''}
              min={service.from}
              onChange={event =>
                onChange({
                  ...profile,
                  service: { ...service, to: event.target.value || null },
                })
              }
            />
          </Field>
        </Row>
      ) : null}
    </Section>
  )
}
