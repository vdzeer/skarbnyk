'use client'

import { Field, Link, Stack, Text, TextInput } from '~/components'
import type { Account, Profile, Requisites } from '~/core'
import { useT, type TranslationKey } from '~/services/i18n'

import type { RequisitesErrors, RequisitesField } from '../../services'
import { Section } from '../Section'

import { Group } from './styled'

const ACCOUNTS: { key: 'singleTax' | 'levy' | 'esv'; title: TranslationKey }[] =
  [
    { key: 'singleTax', title: 'requisites_single_tax' },
    { key: 'levy', title: 'requisites_levy' },
    { key: 'esv', title: 'requisites_esv' },
  ]

const ERRORS: Record<'taxId' | 'iban' | 'code', TranslationKey> = {
  taxId: 'requisites_tax_id_error',
  iban: 'requisites_iban_error',
  code: 'requisites_code_error',
}

const DPS_SITE = 'https://tax.gov.ua/'

type Props = {
  profile: Profile
  errors: RequisitesErrors
  onChange: (profile: Profile) => void
}

/** Where each payment goes; filled once, used for the payment details. */
export const RequisitesSection = ({ profile, errors, onChange }: Props) => {
  const t = useT()
  const { requisites } = profile

  const set = (patch: Partial<Requisites>) =>
    onChange({ ...profile, requisites: { ...requisites, ...patch } })

  const setAccount = (
    key: 'singleTax' | 'levy' | 'esv',
    patch: Partial<Account>,
  ) => set({ [key]: { ...requisites[key], ...patch } })

  const errorOf = (field: RequisitesField, kind: keyof typeof ERRORS) =>
    errors[field] ? t(ERRORS[kind]) : undefined

  return (
    <Section
      id="settings-requisites"
      title={t('settings_requisites')}
      text={t('settings_requisites_text')}>
      <Text variant="secondary">
        {t('requisites_where')}{' '}
        <Link href={DPS_SITE}>{t('requisites_where_link')}</Link>
      </Text>
      <Field
        label={t('requisites_tax_id')}
        htmlFor="tax-id"
        error={errorOf('taxId', 'taxId')}>
        <TextInput
          id="tax-id"
          inputMode="numeric"
          autoComplete="off"
          value={requisites.taxId}
          aria-invalid={Boolean(errors.taxId)}
          onChange={event => set({ taxId: event.target.value })}
        />
      </Field>
      {ACCOUNTS.map(({ key, title }) => (
        <Group key={key}>
          <Text as="h3" variant="bodyStrong">
            {t(title)}
          </Text>
          <Stack $gap="sm">
            <Field
              label={t('payment_iban')}
              htmlFor={`${key}-iban`}
              error={errorOf(`${key}.iban`, 'iban')}>
              <TextInput
                id={`${key}-iban`}
                autoComplete="off"
                spellCheck={false}
                value={requisites[key].iban}
                aria-invalid={Boolean(errors[`${key}.iban`])}
                onChange={event =>
                  setAccount(key, { iban: event.target.value })
                }
              />
            </Field>
            <Field label={t('payment_recipient')} htmlFor={`${key}-recipient`}>
              <TextInput
                id={`${key}-recipient`}
                autoComplete="off"
                value={requisites[key].recipient}
                onChange={event =>
                  setAccount(key, { recipient: event.target.value })
                }
              />
            </Field>
            <Field
              label={t('payment_code')}
              htmlFor={`${key}-code`}
              error={errorOf(`${key}.code`, 'code')}>
              <TextInput
                id={`${key}-code`}
                inputMode="numeric"
                autoComplete="off"
                value={requisites[key].code}
                aria-invalid={Boolean(errors[`${key}.code`])}
                onChange={event =>
                  setAccount(key, { code: event.target.value })
                }
              />
            </Field>
          </Stack>
        </Group>
      ))}
    </Section>
  )
}
