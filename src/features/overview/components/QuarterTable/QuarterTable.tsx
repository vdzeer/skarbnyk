'use client'

import { Fragment, useState } from 'react'

import { Badge, Button, Card, Icon, Link, Stack, Text } from '~/components'
import {
  dayOf,
  lastDayOfMonth,
  monthPayments,
  quarterEnd,
  quarterStart,
  type DayKey,
  type MonthStatus,
  type Obligation,
  type Quarter,
  type Requisites,
  type YearSummary,
} from '~/core'
import type { ObligationRow } from '~/features/ledger/hooks'
import {
  QUARTER_NAMES,
  monthName,
  quarterMonths,
  quarterOfObligation,
} from '~/features/ledger/services'
import { formatMoney } from '~/services/format'
import { useT } from '~/services/i18n'
import { ROUTES } from '~/types'

import { MonthPayment } from '../MonthPayment'

import { Actions, MonthRow, PanelRow, Scroll, Table, Toggle } from './styled'

type Props = {
  summary: YearSummary
  rows: ObligationRow[]
  today: DayKey
  requisites: Requisites
  onPayMonth: (payments: Obligation[]) => void
  onUndoMonth: (ids: string[]) => void
}

type PeriodState = 'running' | 'paid' | 'due' | 'overdue' | 'empty'

const BADGE = {
  running: { tone: 'neutral', key: 'quarter_running', icon: undefined },
  paid: { tone: 'success', key: 'status_paid', icon: 'check' },
  due: { tone: 'warning', key: 'quarter_due', icon: 'clock' },
  overdue: { tone: 'danger', key: 'status_overdue', icon: 'alert' },
  empty: { tone: 'neutral', key: 'quarter_empty', icon: undefined },
} as const

/**
 * Paid, still due, overdue or still running, from the payments it covers.
 * A period that has not begun yet has no state at all.
 */
const stateOf = (
  payments: ObligationRow[],
  period: { start: DayKey; end: DayKey },
  today: DayKey,
): PeriodState | null => {
  if (payments.some(row => row.status === 'overdue')) return 'overdue'
  if (today < period.start) return null
  if (today <= period.end) return 'running'
  return payments.every(row => row.status === 'done') ? 'paid' : 'due'
}

/** The year by quarter, each one opening into its three months. */
export const QuarterTable = ({
  summary,
  rows,
  today,
  requisites,
  onPayMonth,
  onUndoMonth,
}: Props) => {
  const t = useT()
  const [open, setOpen] = useState<Quarter[]>([])
  const [paying, setPaying] = useState<number | null>(null)
  const payments = rows.filter(row => row.action === 'paid')

  const toggle = (quarter: Quarter) =>
    setOpen(current =>
      current.includes(quarter)
        ? current.filter(value => value !== quarter)
        : [...current, quarter],
    )

  const quarterState = (
    quarter: Quarter,
    group: unknown,
  ): PeriodState | null =>
    group === null
      ? 'empty'
      : stateOf(
          payments.filter(row => quarterOfObligation(row) === quarter),
          {
            start: quarterStart(summary.year, quarter),
            end: quarterEnd(summary.year, quarter),
          },
          today,
        )

  /**
   * A month has a state of its own only when something is paid by month
   * (groups 1–2, or the monthly schedule); otherwise only the running one.
   */
  const monthState = (month: MonthStatus): PeriodState | null => {
    if (month.group === null) return 'empty'
    const period = {
      start: dayOf(summary.year, month.month, 1),
      end: lastDayOfMonth(summary.year, month.month),
    }
    const own = payments.filter(
      row => row.period.unit === 'month' && row.period.index === month.month,
    )
    if (own.length > 0) return stateOf(own, period, today)
    return today >= period.start && today <= period.end ? 'running' : null
  }

  /**
   * What paying a month on its own involves: the month's payments still owed
   * (its share split out of the quarter, or a top-up), or nothing when the
   * month has not begun or its quarter is already settled.
   */
  const monthPlan = (quarter: Quarter, month: MonthStatus) => {
    const own = payments.filter(
      row => row.period.unit === 'month' && row.period.index === month.month,
    )
    const ofQuarter = payments.filter(
      row => quarterOfObligation(row) === quarter,
    )
    const quarterDone =
      ofQuarter.length > 0 && ofQuarter.every(row => row.status === 'done')
    const started = today >= dayOf(summary.year, month.month, 1)
    const toPay: Obligation[] = [
      ...own.filter(row => row.status !== 'done'),
      ...monthPayments(summary, month.month).filter(
        payment => !own.some(row => row.id === payment.id),
      ),
    ]
    // Anything paid on its own can be taken back, a pending top-up or not.
    const paidAlone = own.some(row => row.paid > 0)
    return {
      toPay: started && !quarterDone ? toPay : [],
      topUp: own.some(row => row.paid > 0 && row.status !== 'done'),
      undoIds: paidAlone ? own.map(row => row.id) : [],
    }
  }

  const badge = (state: PeriodState | null) => {
    if (!state) return null
    const shown = BADGE[state]
    return (
      <Badge tone={shown.tone} icon={shown.icon}>
        {t(shown.key)}
      </Badge>
    )
  }

  return (
    <Card aria-labelledby="quarters-title">
      <Stack $gap="md">
        <Stack $gap="xxs">
          <Text as="h2" id="quarters-title" variant="title">
            {t('quarters_title')}
          </Text>
          <Text variant="caption" tone="muted">
            {t('quarters_hint')}
          </Text>
        </Stack>
        <Scroll>
          <Table>
            <thead>
              <tr>
                <th scope="col">{t('quarters_quarter')}</th>
                <th scope="col">{t('quarters_income')}</th>
                <th scope="col">{t('quarters_single_tax')}</th>
                <th scope="col">{t('quarters_levy')}</th>
                <th scope="col">{t('quarters_esv')}</th>
                <th scope="col">{t('total')}</th>
                <th scope="col">{t('quarters_state')}</th>
              </tr>
            </thead>
            <tbody>
              {summary.quarters.map(quarter => {
                const expanded = open.includes(quarter.quarter)
                return (
                  <Fragment key={quarter.quarter}>
                    <tr>
                      <th scope="row">
                        <Toggle
                          type="button"
                          aria-expanded={expanded}
                          aria-label={t(
                            expanded ? 'quarters_hide' : 'quarters_show',
                            {
                              quarter: QUARTER_NAMES[quarter.quarter],
                              months: quarterMonths(t, quarter.quarter),
                            },
                          )}
                          onClick={() => toggle(quarter.quarter)}>
                          <Icon
                            name={expanded ? 'chevronDown' : 'chevron'}
                            size="sm"
                          />
                          {QUARTER_NAMES[quarter.quarter]}
                        </Toggle>
                      </th>
                      <td>{formatMoney(quarter.income)}</td>
                      <td>{formatMoney(quarter.singleTax)}</td>
                      <td>{formatMoney(quarter.levy)}</td>
                      <td>{formatMoney(quarter.esv)}</td>
                      <td>
                        <strong>{formatMoney(quarter.total)}</strong>
                      </td>
                      <td>
                        {badge(quarterState(quarter.quarter, quarter.group))}
                      </td>
                    </tr>
                    {expanded
                      ? quarter.months.map(month => {
                          const singleTax = month.singleTax + month.shareTax
                          const levy = month.levy + month.shareLevy
                          const plan = monthPlan(quarter.quarter, month)
                          const name = monthName(t, month.month)
                          return (
                            <Fragment key={month.month}>
                              <MonthRow>
                                <th scope="row">{name}</th>
                                <td>{formatMoney(month.income)}</td>
                                <td>{formatMoney(singleTax)}</td>
                                <td>{formatMoney(levy)}</td>
                                <td>{formatMoney(month.esv)}</td>
                                <td>
                                  {formatMoney(singleTax + levy + month.esv)}
                                </td>
                                <td>
                                  <Actions>
                                    {badge(monthState(month))}
                                    {plan.toPay.length > 0 ? (
                                      <Button
                                        variant="ghost"
                                        aria-expanded={paying === month.month}
                                        aria-label={t('month_pay_label', {
                                          month: name,
                                        })}
                                        onClick={() =>
                                          setPaying(current =>
                                            current === month.month
                                              ? null
                                              : month.month,
                                          )
                                        }>
                                        {t('month_pay')}
                                      </Button>
                                    ) : null}
                                    {plan.undoIds.length > 0 ? (
                                      <Button
                                        variant="ghost"
                                        aria-label={t('month_undo_label', {
                                          month: name,
                                        })}
                                        onClick={() =>
                                          onUndoMonth(plan.undoIds)
                                        }>
                                        {t('mark_undo_short')}
                                      </Button>
                                    ) : null}
                                  </Actions>
                                </td>
                              </MonthRow>
                              {paying === month.month &&
                              plan.toPay.length > 0 ? (
                                <PanelRow>
                                  <td colSpan={7}>
                                    <MonthPayment
                                      title={t('month_pay_title', {
                                        month: name,
                                        year: summary.year,
                                      })}
                                      payments={plan.toPay}
                                      requisites={requisites}
                                      running={
                                        today <=
                                        lastDayOfMonth(
                                          summary.year,
                                          month.month,
                                        )
                                      }
                                      topUp={plan.topUp}
                                      onPaid={() => {
                                        onPayMonth(plan.toPay)
                                        setPaying(null)
                                      }}
                                      onClose={() => setPaying(null)}
                                    />
                                  </td>
                                </PanelRow>
                              ) : null}
                            </Fragment>
                          )
                        })
                      : null}
                  </Fragment>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{t('quarters_year')}</th>
                <td>{formatMoney(summary.income)}</td>
                <td>{formatMoney(summary.singleTax)}</td>
                <td>{formatMoney(summary.levy)}</td>
                <td>{formatMoney(summary.esv)}</td>
                <td>{formatMoney(summary.total)}</td>
                <td />
              </tr>
            </tfoot>
          </Table>
        </Scroll>
        <Text variant="caption" tone="muted">
          {t('quarters_note')}{' '}
          <Link href={ROUTES.Settings}>{t('quarters_note_link')}</Link>
        </Text>
      </Stack>
    </Card>
  )
}
