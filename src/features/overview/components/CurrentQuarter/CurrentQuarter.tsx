import { Icon, Link, Text } from '~/components'
import {
  monthlyPlanDue,
  monthOf,
  quarterOf,
  quarterPaymentDue,
  yearOf,
  type DayKey,
  type Group,
  type PaySchedule,
} from '~/core'
import { QUARTER_NAMES, quarterMonths } from '~/features/ledger/services'
import { formatDue } from '~/services/format'
import { useT } from '~/services/i18n'
import { ROUTES } from '~/types'

import { Line } from './styled'

type Props = {
  today: DayKey
  group: Group
  schedule: PaySchedule
}

/** Which quarter today is in, and when tax on money coming in now is due. */
export const CurrentQuarter = ({ today, group, schedule }: Props) => {
  const t = useT()
  const quarter = quarterOf(today)
  const legal = formatDue(quarterPaymentDue(yearOf(today), quarter), today)
  const planned = formatDue(
    monthlyPlanDue(yearOf(today), monthOf(today)),
    today,
  )

  const when = () => {
    if (group !== 3) return t('now_fixed')
    if (schedule === 'monthly') return t('now_monthly', { planned, legal })
    return t('now_quarterly', { legal })
  }

  return (
    <Line>
      <Icon name="deadlines" size="sm" />
      <Text variant="secondary">
        {t('now_quarter', {
          quarter: QUARTER_NAMES[quarter],
          months: quarterMonths(t, quarter),
        })}{' '}
        {when()} <Link href={ROUTES.Deadlines}>{t('now_link')}</Link>
      </Text>
    </Line>
  )
}
