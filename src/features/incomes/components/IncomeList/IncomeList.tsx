import { Button, Card, Row, Stack, Text, VisuallyHidden } from '~/components'
import type { Income, QuarterSummary } from '~/core'
import { QUARTER_NAMES } from '~/features/ledger/services'
import {
  DAY_NUMERIC,
  formatDay,
  formatMoney,
  formatRate,
} from '~/services/format'
import { useT } from '~/services/i18n'

import { Scroll, Table } from './styled'

type Props = {
  quarter: QuarterSummary
  incomes: Income[]
  selectedId: string | null
  onEdit: (income: Income) => void
}

/** One quarter's incomes, newest first, with its sum and taxes on top. */
export const IncomeList = ({ quarter, incomes, selectedId, onEdit }: Props) => {
  const t = useT()
  const titleId = `quarter-${quarter.quarter}`

  return (
    <Card aria-labelledby={titleId}>
      <Stack $gap="sm">
        <Row $justify="space-between" $align="baseline">
          <Text as="h2" id={titleId} variant="title">
            {t('incomes_quarter', { quarter: QUARTER_NAMES[quarter.quarter] })}
          </Text>
          <Text variant="secondary" tone="muted">
            {t('incomes_quarter_sum', {
              income: formatMoney(quarter.income),
              tax: formatMoney(quarter.singleTax + quarter.levy),
            })}
          </Text>
        </Row>
        <Scroll>
          <Table>
            <thead>
              <tr>
                <th scope="col">{t('incomes_day')}</th>
                <th scope="col">{t('incomes_amount')}</th>
                <th scope="col">{t('incomes_rate')}</th>
                <th scope="col">{t('incomes_uah')}</th>
                <th scope="col">{t('incomes_note')}</th>
                <th scope="col">
                  <VisuallyHidden>{t('action_edit')}</VisuallyHidden>
                </th>
              </tr>
            </thead>
            <tbody>
              {incomes.map(income => (
                <tr
                  key={income.id}
                  aria-selected={income.id === selectedId}
                  onClick={() => onEdit(income)}>
                  <td>{formatDay(income.day, DAY_NUMERIC)}</td>
                  <td>
                    {formatMoney(income.amount)} {income.currency}
                  </td>
                  <td>
                    {income.rate === null ? '—' : formatRate(income.rate)}
                  </td>
                  <td>
                    <strong>{formatMoney(income.uah)}</strong>
                  </td>
                  <td>{income.note}</td>
                  <td>
                    <Button
                      variant="ghost"
                      icon="edit"
                      aria-label={t('incomes_edit_label', {
                        day: formatDay(income.day, DAY_NUMERIC),
                      })}
                      onClick={() => onEdit(income)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Scroll>
      </Stack>
    </Card>
  )
}
