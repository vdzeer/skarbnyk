'use client'

import { useState } from 'react'

import { Card, Checkbox, Icon, Row, Stack, Text } from '~/components'
import type { Group } from '~/core'
import { useT, type TranslationKey } from '~/services/i18n'

import {
  REMINDERS_READY,
  REMINDER_OFFSETS,
  useReminders,
  type ReminderOffset,
} from '../../hooks'

import { Hint } from './styled'

const OFFSET_LABEL: Record<ReminderOffset, TranslationKey> = {
  7: 'reminders_7',
  3: 'reminders_3',
  1: 'reminders_1',
  0: 'reminders_0',
}

/** Email reminders: on or off, and how many days ahead. */
export const RemindersCard = ({ group }: { group: Group }) => {
  const t = useT()
  const { reminders, loading, email, save } = useReminders(group)
  const [failed, setFailed] = useState(false)

  const change = async (next: typeof reminders) => {
    setFailed(false)
    try {
      await save(next)
    } catch (error) {
      console.error(error)
      setFailed(true)
    }
  }

  const toggleOffset = (offset: ReminderOffset, on: boolean) => {
    const offsets = on
      ? [...reminders.offsets, offset]
      : reminders.offsets.filter(value => value !== offset)
    if (offsets.length > 0) change({ ...reminders, offsets })
  }

  return (
    <Card aria-labelledby="reminders-title">
      <Stack $gap="sm">
        <Row $gap="xs">
          <Icon name="mail" />
          <Text as="h2" id="reminders-title" variant="title">
            {t('reminders_title')}
          </Text>
        </Row>
        {REMINDERS_READY ? (
          <>
            <Checkbox
              checked={reminders.enabled}
              disabled={loading || !email}
              onChange={enabled => change({ ...reminders, enabled })}
              label={t('reminders_enable')}
              hint={
                email ? t('reminders_to', { email }) : t('reminders_no_email')
              }
            />
            <Stack $gap="xxs">
              <Text variant="label">{t('reminders_when')}</Text>
              {REMINDER_OFFSETS.map(offset => (
                <Checkbox
                  key={offset}
                  checked={reminders.offsets.includes(offset)}
                  disabled={!reminders.enabled}
                  onChange={on => toggleOffset(offset, on)}
                  label={t(OFFSET_LABEL[offset])}
                />
              ))}
            </Stack>
            {failed ? (
              <Text variant="secondary" tone="danger">
                {t('reminders_failed')}
              </Text>
            ) : null}
          </>
        ) : (
          <Text tone="muted">{t('reminders_soon')}</Text>
        )}
        <Hint>
          <Text variant="caption" tone="muted">
            {t('reminders_privacy')}
          </Text>
        </Hint>
      </Stack>
    </Card>
  )
}
