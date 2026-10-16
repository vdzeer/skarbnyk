'use client'

import {
  Button,
  ColumnNarrow,
  ColumnWide,
  Columns,
  Icon,
  PageHeader,
  Row,
  Stack,
  StatePanel,
  Text,
  YearSelect,
} from '~/components'
import { useLedger, useMarkActions, useTaxes } from '~/features/ledger/hooks'
import { useNavigation, useYear } from '~/hooks'
import { DAY_LONG, formatDay } from '~/services/format'
import { useT } from '~/services/i18n'
import { useViewStore } from '~/store'
import { ROUTES } from '~/types'

import {
  CurrentQuarter,
  NextPayment,
  QuarterTable,
  Upcoming,
  YearIncome,
} from '../components'

import { Note, Privacy } from './styled'

const UPCOMING_COUNT = 4

export const OverviewScreen = () => {
  const t = useT()
  const { today, year, setYear } = useYear()
  const { profile } = useLedger()
  const taxes = useTaxes(today)
  const { markDone, markMonth, undoMonth } = useMarkActions()
  const { go } = useNavigation()
  const requestDraft = useViewStore(state => state.requestDraft)

  const summary = taxes.summaryOf(year)
  if (!profile || !summary) {
    return <StatePanel title={t('state_loading')} role="status" />
  }

  const next = taxes.open.find(row => row.action === 'paid') ?? null
  const samePeriod = next
    ? taxes
        .obligationsOf(next.year)
        .filter(
          row =>
            row.action === 'paid' &&
            row.period.unit === next.period.unit &&
            row.period.index === next.period.index,
        )
    : []
  const group = profile.periods[profile.periods.length - 1].group

  const addIncome = () => {
    requestDraft(true)
    go(ROUTES.Incomes)
  }

  return (
    <Stack $gap="lg">
      <PageHeader>
        <Stack $gap="xxs">
          <Text variant="secondary" tone="muted">
            {formatDay(today, DAY_LONG)}
          </Text>
          <Text as="h1" variant="pageTitle">
            {t('nav_overview')}
          </Text>
        </Stack>
        <Row>
          <YearSelect years={taxes.years} value={year} onChange={setYear} />
          <Button variant="primary" icon="plus" onClick={addIncome}>
            {t('income_add')}
          </Button>
        </Row>
      </PageHeader>

      {summary.rates.estimated ? (
        <Note role="note">
          <Icon name="alert" />
          <Text variant="secondary">
            {t('rates_estimated', { year, lawYear: summary.rates.lawYear })}
          </Text>
        </Note>
      ) : null}

      <NextPayment
        next={next}
        samePeriod={samePeriod}
        today={today}
        requisites={profile.requisites}
        onPaid={row => markDone(row, today)}
      />

      <CurrentQuarter
        today={today}
        group={group}
        schedule={profile.paySchedule}
      />

      <Columns>
        <ColumnNarrow>
          <YearIncome summary={summary} />
        </ColumnNarrow>
        <ColumnWide>
          <Upcoming rows={taxes.open.slice(0, UPCOMING_COUNT)} today={today} />
        </ColumnWide>
      </Columns>

      <QuarterTable
        summary={summary}
        rows={taxes.obligationsOf(year)}
        today={today}
        requisites={profile.requisites}
        onPayMonth={payments => markMonth(payments, today)}
        onUndoMonth={undoMonth}
      />

      <Privacy>
        <Icon name="lock" size="sm" />
        <Text variant="caption" tone="muted">
          {t('privacy_note')}
        </Text>
      </Privacy>
    </Stack>
  )
}
