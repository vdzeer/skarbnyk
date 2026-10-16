import { useTheme } from 'styled-components'

import { Card, ProgressBar, Stack, Text } from '~/components'
import type { YearSummary } from '~/core'
import { formatMoney, formatPercent, formatWhole } from '~/services/format'
import { useT } from '~/services/i18n'

import { Figure, Legend, Unit } from './styled'

/** The year's income against the limit of the group the FOP is on. */
export const YearIncome = ({ summary }: { summary: YearSummary }) => {
  const t = useT()
  const { colors } = useTheme()
  const share = summary.limit > 0 ? summary.income / summary.limit : 0
  const left = Math.max(summary.limit - summary.income, 0)

  return (
    <Card aria-labelledby="income-title">
      <Stack $gap="md">
        <Text as="h2" id="income-title" variant="title">
          {t('income_title', { year: summary.year })}
        </Text>
        <Figure>
          {formatMoney(summary.income)} <Unit>{t('unit_uah')}</Unit>
        </Figure>
        {summary.limitGroup ? (
          <Stack $gap="xs">
            <ProgressBar
              large
              ratio={share}
              color={share >= 1 ? colors.danger : colors.primary}
              label={t('income_limit_label', {
                percent: formatPercent(share * 100),
              })}
            />
            <Legend>
              <Text variant="secondary" tone="muted">
                {t('income_limit_share', {
                  percent: formatPercent(share * 100),
                  group: summary.limitGroup,
                })}
              </Text>
              <Text variant="secondary" tone="muted">
                {t('income_limit', { limit: formatWhole(summary.limit) })}
              </Text>
            </Legend>
            {summary.excess > 0 ? (
              <Text variant="secondary" tone="danger">
                {t('income_over', { amount: formatMoney(summary.excess) })}
              </Text>
            ) : (
              <Text variant="secondary" tone="muted">
                {t('income_left', { amount: formatMoney(left) })}
              </Text>
            )}
          </Stack>
        ) : null}
      </Stack>
    </Card>
  )
}
