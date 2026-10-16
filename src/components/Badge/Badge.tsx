import type { ReactNode } from 'react'

import { Icon, type IconName } from '../Icon'

import { Pill } from './styled'
import type { BadgeTone } from './types'

type Props = {
  tone?: BadgeTone
  icon?: IconName
  children: ReactNode
}

/** A short status: paid, due soon, a report. Colour is never the only signal. */
export const Badge = ({ tone = 'neutral', icon, children }: Props) => (
  <Pill $tone={tone}>
    {icon ? <Icon name={icon} size="sm" /> : null}
    {children}
  </Pill>
)
