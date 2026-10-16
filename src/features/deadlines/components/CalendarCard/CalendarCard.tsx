'use client'

import { Button, Card, Stack, Text } from '~/components'
import type { Obligation } from '~/core'
import { APP_NAME } from '~/services/brand'
import { downloadFile } from '~/services/download'
import { useT } from '~/services/i18n'

import { deadlinesCalendar } from '../../services'

type Props = {
  year: number
  obligations: Obligation[]
}

/** The year's deadlines as a file any calendar app opens. */
export const CalendarCard = ({ year, obligations }: Props) => {
  const t = useT()

  const download = () =>
    downloadFile(
      t('calendar_file_name', { app: APP_NAME, year }),
      deadlinesCalendar(t, obligations, new Date()),
      'text/calendar;charset=utf-8',
    )

  return (
    <Card aria-labelledby="calendar-title">
      <Stack $gap="sm">
        <Text as="h2" id="calendar-title" variant="title">
          {t('calendar_title')}
        </Text>
        <Text variant="secondary" tone="muted">
          {t('calendar_text')}
        </Text>
        <Button
          icon="download"
          disabled={obligations.length === 0}
          onClick={download}>
          {t('calendar_download')}
        </Button>
      </Stack>
    </Card>
  )
}
