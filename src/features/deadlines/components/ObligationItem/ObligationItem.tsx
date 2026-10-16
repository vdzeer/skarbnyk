'use client'

import { useState } from 'react'

import { Badge, Button, DateTile, Row, Text } from '~/components'
import {
  markFor,
  type DayKey,
  type Mark,
  type Requisites,
  type YearSummary,
} from '~/core'
import { PaymentDetails } from '~/features/ledger/components'
import type { ObligationRow } from '~/features/ledger/hooks'
import {
  countdownDay,
  dueLabel,
  obligationTitle,
  quarterMonths,
} from '~/features/ledger/services'
import {
  DAY_MONTH,
  WEEKDAY_SHORT,
  formatDay,
  formatDue,
  formatMoney,
} from '~/services/format'
import { useT } from '~/services/i18n'

import { declarationNumbers } from '../../services'

import { Body, Details, Item, Numbers, Side } from './styled'

const TONE = {
  overdue: 'danger',
  soon: 'warning',
  upcoming: 'neutral',
  done: 'success',
} as const

type Props = {
  row: ObligationRow
  marks: Mark[]
  summary: YearSummary
  requisites: Requisites
  today: DayKey
  onDone: () => void
  onUndo: () => void
}

/** One deadline: what, by when, how much, and the button that closes it. */
export const ObligationItem = ({
  row,
  marks,
  summary,
  requisites,
  today,
  onDone,
  onUndo,
}: Props) => {
  const t = useT()
  const [open, setOpen] = useState(false)
  const done = row.status === 'done'
  const mark = markFor(row, marks)
  const filing = row.action === 'filed'
  const numbers = filing ? declarationNumbers(row, summary) : null

  return (
    <Item>
      <DateTile day={row.due} tone={TONE[row.status]} />
      <Body>
        <Text variant="bodyStrong">{obligationTitle(t, row)}</Text>
        <Row $gap="xs">
          <Badge tone={filing ? 'info' : 'neutral'}>
            {filing ? t('kind_file') : t('kind_pay')}
          </Badge>
          {done && mark ? (
            <Badge tone="success" icon="check">
              {t(filing ? 'done_filed_on' : 'done_paid_on', {
                date: formatDay(mark.day, DAY_MONTH),
              })}
            </Badge>
          ) : (
            <Badge
              tone={TONE[row.status]}
              icon={row.status === 'overdue' ? 'alert' : 'clock'}>
              {`${formatDay(row.due, WEEKDAY_SHORT)}, ${dueLabel(t, countdownDay(row, today), today)}`}
            </Badge>
          )}
          {row.period.unit === 'quarter' && row.months === null ? (
            <Text variant="caption" tone="muted">
              {quarterMonths(t, row.period.index)}
            </Text>
          ) : null}
          {row.legalDue !== row.due ? (
            <Text variant="caption" tone="muted">
              {t('legal_due', { date: formatDue(row.legalDue, today) })}
            </Text>
          ) : null}
          {row.paid > 0 && !done ? (
            <Text variant="caption" tone="muted">
              {t('paid_before', { amount: formatMoney(row.paid) })}
            </Text>
          ) : null}
          {row.esvAnnex ? (
            <Text variant="caption" tone="muted">
              {t('deadline_esv_annex')}
            </Text>
          ) : null}
        </Row>
        <Button
          variant="ghost"
          icon={open ? 'chevronDown' : 'chevron'}
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}>
          {filing ? t('deadline_numbers') : t('next_details')}
        </Button>
        {open ? (
          <Details>
            {numbers ? (
              <Numbers>
                <dt>{t('declaration_income')}</dt>
                <dd>{formatMoney(numbers.income)}</dd>
                <dt>{t('declaration_single_tax')}</dt>
                <dd>{formatMoney(numbers.singleTax)}</dd>
                <dt>{t('declaration_levy')}</dt>
                <dd>{formatMoney(numbers.levy)}</dd>
                {numbers.esv !== null ? (
                  <>
                    <dt>{t('declaration_esv')}</dt>
                    <dd>{formatMoney(numbers.esv)}</dd>
                  </>
                ) : null}
              </Numbers>
            ) : (
              <PaymentDetails obligation={row} requisites={requisites} />
            )}
            {numbers ? (
              <Text variant="caption" tone="muted">
                {t('declaration_hint')}
              </Text>
            ) : null}
          </Details>
        ) : null}
      </Body>
      <Side>
        {row.amount !== null ? (
          <Text nowrap variant="number">
            {formatMoney(row.amount)}
          </Text>
        ) : null}
        {done ? (
          <Button variant="ghost" onClick={onUndo}>
            {t('mark_undo')}
          </Button>
        ) : (
          <Button icon="check" onClick={onDone}>
            {filing ? t('mark_filed') : t('mark_paid')}
          </Button>
        )}
      </Side>
    </Item>
  )
}
