'use client'

import { useState } from 'react'

import {
  Button,
  Card,
  ColumnNarrow,
  ColumnWide,
  Columns,
  PageHeader,
  Stack,
  StatePanel,
  Text,
  YearSelect,
} from '~/components'
import { monthOf, yearOf } from '~/core'
import {
  useLedger,
  useMarkActions,
  useTaxes,
  type ObligationRow,
} from '~/features/ledger/hooks'
import { useYear } from '~/hooks'
import { MONTH_YEAR, formatDay } from '~/services/format'
import { useT, type TranslationKey } from '~/services/i18n'

import {
  CalendarCard,
  ObligationItem,
  QuarterGuide,
  RemindersCard,
} from '../components'

import { List, MonthTitle } from './styled'

const RHYTHM: Record<1 | 2 | 3, TranslationKey> = {
  1: 'deadlines_rhythm_fixed',
  2: 'deadlines_rhythm_fixed',
  3: 'deadlines_rhythm_3',
}

/** Rows grouped by the month they fall due in, in date order. */
const byMonth = (rows: ObligationRow[]) =>
  rows.reduce<{ key: string; rows: ObligationRow[] }[]>((groups, row) => {
    const key = `${yearOf(row.due)}-${monthOf(row.due)}`
    const last = groups[groups.length - 1]
    if (last?.key === key) {
      last.rows.push(row)
      return groups
    }
    return [...groups, { key, rows: [row] }]
  }, [])

export const DeadlinesScreen = () => {
  const t = useT()
  const { today, year, setYear } = useYear()
  const { profile, marks } = useLedger()
  const taxes = useTaxes(today)
  const { markDone, undo } = useMarkActions()
  const [showDone, setShowDone] = useState(false)

  const summary = taxes.summaryOf(year)
  if (!profile || !summary) {
    return <StatePanel title={t('state_loading')} role="status" />
  }

  const rows = taxes.obligationsOf(year)
  const doneCount = rows.filter(row => row.status === 'done').length
  const shown = showDone ? rows : rows.filter(row => row.status !== 'done')
  const group = profile.periods[profile.periods.length - 1].group

  return (
    <Stack $gap="lg">
      <PageHeader>
        <Stack $gap="xxs">
          <Text variant="secondary" tone="muted">
            {t(RHYTHM[group], { group })}
          </Text>
          <Text as="h1" variant="pageTitle">
            {t('deadlines_title')}
          </Text>
        </Stack>
        <YearSelect years={taxes.years} value={year} onChange={setYear} />
      </PageHeader>

      <QuarterGuide
        year={year}
        group={group}
        schedule={profile.paySchedule}
        today={today}
      />

      <Columns>
        <ColumnWide>
          {shown.length === 0 ? (
            <StatePanel
              title={t('deadlines_empty_title')}
              text={t('deadlines_empty_text', { year })}
            />
          ) : (
            byMonth(shown).map(month => (
              <Card key={month.key} $padding="md" aria-label={month.key}>
                <MonthTitle>
                  {formatDay(month.rows[0].due, MONTH_YEAR).replace(
                    / р\.$/,
                    '',
                  )}
                </MonthTitle>
                <List>
                  {month.rows.map(row => (
                    <ObligationItem
                      key={row.id}
                      row={row}
                      marks={marks}
                      summary={summary}
                      requisites={profile.requisites}
                      today={today}
                      onDone={() => markDone(row, today)}
                      onUndo={() => undo(row)}
                    />
                  ))}
                </List>
              </Card>
            ))
          )}
          {doneCount > 0 ? (
            <Button
              variant="ghost"
              icon={showDone ? 'chevronDown' : 'chevron'}
              aria-expanded={showDone}
              onClick={() => setShowDone(value => !value)}>
              {showDone
                ? t('deadlines_hide_done')
                : t('deadlines_show_done', { count: doneCount })}
            </Button>
          ) : null}
        </ColumnWide>
        <ColumnNarrow>
          <RemindersCard group={group} />
          <CalendarCard
            year={year}
            obligations={rows.filter(row => row.status !== 'done')}
          />
        </ColumnNarrow>
      </Columns>
    </Stack>
  )
}
