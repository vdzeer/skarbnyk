import { Button, Card, DateTile, Row, Stack, Text } from '~/components'
import type { DayKey } from '~/core'
import type { ObligationRow } from '~/features/ledger/hooks'
import {
  countdownDay,
  dueLabel,
  obligationTitle,
} from '~/features/ledger/services'
import { formatMoney } from '~/services/format'
import { useT } from '~/services/i18n'
import { ROUTES } from '~/types'

import { Item, What } from './styled'

const TONE = {
  overdue: 'danger',
  soon: 'warning',
  upcoming: 'neutral',
  done: 'success',
} as const

type Props = {
  rows: ObligationRow[]
  today: DayKey
}

/** The next few things to pay or file, the overdue ones first. */
export const Upcoming = ({ rows, today }: Props) => {
  const t = useT()

  return (
    <Card aria-labelledby="soon-title">
      <Stack $gap="sm">
        <Row $justify="space-between" $align="baseline">
          <Text as="h2" id="soon-title" variant="title">
            {t('soon_title')}
          </Text>
          <Button href={ROUTES.Deadlines} variant="ghost">
            {t('soon_all')}
          </Button>
        </Row>
        {rows.length === 0 ? (
          <Text tone="muted">{t('soon_empty')}</Text>
        ) : (
          rows.map(row => (
            <Item key={row.id}>
              <DateTile day={row.due} tone={TONE[row.status]} />
              <What>
                <Text variant="bodyStrong">{obligationTitle(t, row)}</Text>
                <Text variant="caption" tone="muted">
                  {row.action === 'filed' ? t('kind_file') : t('kind_pay')}
                  {' · '}
                  {dueLabel(t, countdownDay(row, today), today)}
                </Text>
              </What>
              {row.amount !== null ? (
                <Text nowrap variant="number">
                  {formatMoney(row.amount)}
                </Text>
              ) : null}
            </Item>
          ))
        )}
      </Stack>
    </Card>
  )
}
