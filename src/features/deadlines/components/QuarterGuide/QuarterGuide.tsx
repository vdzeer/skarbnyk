import { Badge, Card, Stack, Text } from '~/components'
import {
  QUARTERS,
  esvDue,
  quarterOf,
  quarterPaymentDue,
  quarterReturnDue,
  yearOf,
  type DayKey,
  type Group,
  type PaySchedule,
} from '~/core'
import { QUARTER_NAMES, quarterMonths } from '~/features/ledger/services'
import { formatDue } from '~/services/format'
import { useT } from '~/services/i18n'

import { Scroll, Table } from './styled'

type Props = {
  year: number
  group: Group
  schedule: PaySchedule
  today: DayKey
}

/**
 * Which months make a quarter and when each quarter is filed and paid: the
 * part of the calendar people find least obvious, laid out for the year.
 */
export const QuarterGuide = ({ year, group, schedule, today }: Props) => {
  const t = useT()
  const fixed = group !== 3
  const current = yearOf(today) === year ? quarterOf(today) : null

  return (
    <Card aria-labelledby="guide-title">
      <Stack $gap="sm">
        <Text as="h2" id="guide-title" variant="title">
          {t('guide_title')}
        </Text>
        <Text variant="secondary">
          {fixed ? t('guide_fixed') : t('guide_group3')}
        </Text>
        {schedule === 'monthly' ? (
          <Text variant="secondary" tone="muted">
            {t('guide_monthly')}
          </Text>
        ) : null}
        <Scroll>
          <Table>
            <thead>
              <tr>
                <th scope="col">{t('guide_quarter')}</th>
                {fixed ? null : <th scope="col">{t('guide_return')}</th>}
                {fixed ? null : <th scope="col">{t('guide_payment')}</th>}
                <th scope="col">{t('guide_esv')}</th>
              </tr>
            </thead>
            <tbody>
              {QUARTERS.map(quarter => (
                <tr
                  key={quarter}
                  aria-current={quarter === current ? 'true' : undefined}>
                  <th scope="row">
                    <Text variant="bodyStrong">
                      {t('incomes_quarter', {
                        quarter: QUARTER_NAMES[quarter],
                      })}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {quarterMonths(t, quarter)}
                    </Text>
                    {quarter === current ? (
                      <Badge tone="success">{t('guide_now')}</Badge>
                    ) : null}
                  </th>
                  {fixed ? null : (
                    <td>{formatDue(quarterReturnDue(year, quarter), today)}</td>
                  )}
                  {fixed ? null : (
                    <td>
                      {formatDue(quarterPaymentDue(year, quarter), today)}
                    </td>
                  )}
                  <td>{formatDue(esvDue(year, quarter), today)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Scroll>
      </Stack>
    </Card>
  )
}
