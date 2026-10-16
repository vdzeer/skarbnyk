'use client'

import { useState, type FormEvent } from 'react'

import {
  Button,
  Card,
  Checkbox,
  DateInput,
  Field,
  Row,
  Segmented,
  Stack,
  Steps,
  Text,
  Welcome,
} from '~/components'
import { EARLIEST_DAY, GROUPS, isDayKey, type Group } from '~/core'
import { useLedgerActions } from '~/features/ledger/hooks'
import { useToday } from '~/hooks'
import { useT } from '~/services/i18n'

import { newProfile } from '../services'

/** The third and last setup step: which group, since when. */
export const ProfileSetupScreen = () => {
  const t = useT()
  const today = useToday()
  const { saveProfile } = useLedgerActions()
  const [group, setGroup] = useState<Group>(3)
  const [vat, setVat] = useState(false)
  const [registeredOn, setRegisteredOn] = useState('')
  const [groupFrom, setGroupFrom] = useState('')
  const [tried, setTried] = useState(false)
  const [pending, setPending] = useState(false)

  const registeredValid =
    isDayKey(registeredOn) &&
    registeredOn >= EARLIEST_DAY &&
    registeredOn <= today
  const groupFromValue = groupFrom || registeredOn
  const groupFromValid =
    isDayKey(groupFromValue) && groupFromValue >= registeredOn

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setTried(true)
    if (!registeredValid || !groupFromValid) return
    setPending(true)
    try {
      await saveProfile(
        newProfile({
          today,
          registeredOn,
          groupFrom: groupFromValue,
          group,
          vat,
        }),
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Welcome>
      <Steps
        current={3}
        labels={[t('step_google'), t('step_password'), t('step_profile')]}
      />
      <Card as="form" onSubmit={submit} noValidate>
        <Stack $gap="md">
          <Text as="h2" variant="title">
            {t('profile_setup_title')}
          </Text>
          <Text tone="muted">{t('profile_setup_text')}</Text>
          <Field label={t('settings_group')}>
            <Segmented
              label={t('settings_group')}
              options={GROUPS.map(value => ({
                value,
                label: t('group_name', { group: value }),
              }))}
              selected={[group]}
              onSelect={setGroup}
            />
          </Field>
          {group === 3 ? (
            <Checkbox
              checked={vat}
              onChange={setVat}
              label={t('settings_vat')}
              hint={t('settings_vat_hint')}
            />
          ) : null}
          <Row $align="flex-start">
            <Field
              label={t('settings_registered')}
              htmlFor="registered"
              error={
                tried && !registeredValid
                  ? t('profile_setup_registered_error')
                  : undefined
              }>
              <DateInput
                id="registered"
                value={registeredOn}
                max={today}
                aria-invalid={tried && !registeredValid}
                onChange={event => setRegisteredOn(event.target.value)}
              />
            </Field>
            <Field
              label={t('settings_group_from')}
              htmlFor="group-from"
              error={
                tried && registeredValid && !groupFromValid
                  ? t('profile_setup_group_from_error')
                  : undefined
              }>
              <DateInput
                id="group-from"
                value={groupFromValue}
                min={registeredOn || undefined}
                onChange={event => setGroupFrom(event.target.value)}
              />
            </Field>
          </Row>
          <Button type="submit" variant="primary" size="lg" disabled={pending}>
            {t('profile_setup_submit')}
          </Button>
        </Stack>
      </Card>
    </Welcome>
  )
}
