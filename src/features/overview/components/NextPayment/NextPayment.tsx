'use client'

import { useState } from 'react'

import { Button, Icon, Text } from '~/components'
import type { DayKey, Requisites } from '~/core'
import type { ObligationRow } from '~/features/ledger/hooks'
import { PaymentDetails } from '~/features/ledger/components'
import {
  QUARTER_NAMES,
  countdownDay,
  dueLabel,
  monthName,
  obligationTitle,
  quarterMonths,
} from '~/features/ledger/services'
import { formatDue, formatMoney } from '~/services/format'
import { useT } from '~/services/i18n'

import {
  Actions,
  Amount,
  Badge,
  Breakdown,
  BreakdownRow,
  Lead,
  Panel,
  Total,
  Unit,
} from './styled'

type Props = {
  next: ObligationRow | null
  /** Every payment of the same month or quarter, done or not. */
  samePeriod: ObligationRow[]
  today: DayKey
  requisites: Requisites
  onPaid: (row: ObligationRow) => void
}

/** The first thing on the overview: what to pay next, by when, and how. */
export const NextPayment = ({
  next,
  samePeriod,
  today,
  requisites,
  onPaid,
}: Props) => {
  const t = useT()
  const [details, setDetails] = useState(false)

  if (!next) {
    return (
      <Panel aria-labelledby="next-title">
        <Lead>
          <Text as="h2" id="next-title" variant="secondary" tone="inherit">
            {t('next_title')}
          </Text>
          <Text variant="pageTitle" tone="inherit">
            {t('next_none_title')}
          </Text>
          <Text tone="inherit">{t('next_none_text')}</Text>
        </Lead>
      </Panel>
    )
  }

  const total = samePeriod.reduce((sum, row) => sum + (row.amount ?? 0), 0)
  const { period } = next
  const periodTitle = () => {
    if (period.unit === 'month') {
      return t('next_month_total', { month: monthName(t, period.index) })
    }
    if (period.unit === 'quarter') {
      return t('next_quarter_total', {
        quarter: QUARTER_NAMES[period.index],
        months: quarterMonths(t, period.index),
      })
    }
    return ''
  }

  return (
    <Panel aria-labelledby="next-title">
      <Lead>
        <Text as="h2" id="next-title" variant="secondary" tone="inherit">
          {t('next_title')}
        </Text>
        <Amount>
          {formatMoney(next.amount ?? 0)} <Unit>{t('unit_uah')}</Unit>
        </Amount>
        <Text variant="lead" tone="inherit">
          {t('next_line', {
            what: obligationTitle(t, next),
            date: formatDue(next.due, today),
          })}
        </Text>
        {next.legalDue !== next.due ? (
          <Text variant="secondary" tone="inherit">
            {t('legal_due', { date: formatDue(next.legalDue, today) })}
          </Text>
        ) : null}
        <Badge $overdue={next.status === 'overdue'}>
          <Icon
            name={next.status === 'overdue' ? 'alert' : 'clock'}
            size="sm"
          />
          {dueLabel(t, countdownDay(next, today), today)}
        </Badge>
        <Actions>
          <Button variant="inverse" onClick={() => onPaid(next)}>
            {t('mark_paid')}
          </Button>
          <Button
            variant="inverseOutline"
            aria-pressed={details}
            onClick={() => setDetails(open => !open)}>
            {t('next_details')}
          </Button>
        </Actions>
        {details ? (
          <PaymentDetails obligation={next} requisites={requisites} />
        ) : null}
      </Lead>
      {period.unit !== 'year' && samePeriod.length > 1 ? (
        <Breakdown aria-labelledby="breakdown-title">
          <Text as="h3" id="breakdown-title" variant="secondary" tone="inherit">
            {periodTitle()}
          </Text>
          {samePeriod.map(row => (
            <BreakdownRow key={row.id} $done={row.status === 'done'}>
              <span>
                <Text tone="inherit">{obligationTitle(t, row)}</Text>
                <Text variant="caption" tone="inherit">
                  {row.status === 'done'
                    ? t('status_paid')
                    : t('next_due', { date: formatDue(row.due, today) })}
                </Text>
              </span>
              <Text nowrap variant="bodyStrong" tone="inherit">
                {formatMoney(row.amount ?? 0)}
              </Text>
            </BreakdownRow>
          ))}
          <Total>
            <Text variant="bodyStrong" tone="inherit">
              {t('total')}
            </Text>
            <Text nowrap variant="amountSmall" tone="inherit">
              {t('money_uah', { amount: formatMoney(total) })}
            </Text>
          </Total>
        </Breakdown>
      ) : null}
    </Panel>
  )
}
