import type { DayKey } from '~/core'
import { MONTH_SHORT, formatDay } from '~/services/format'

import { Day, Month, Tile } from './styled'

type Props = {
  day: DayKey
  tone?: 'neutral' | 'warning' | 'danger' | 'success'
}

/** The day and month in front of a deadline; read as one date. */
export const DateTile = ({ day, tone = 'neutral' }: Props) => (
  <Tile $tone={tone} aria-hidden>
    <Day>{Number(day.slice(8, 10))}</Day>
    <Month>{formatDay(day, MONTH_SHORT).replace(/\.$/, '')}</Month>
  </Tile>
)
