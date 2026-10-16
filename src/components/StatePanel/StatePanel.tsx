import type { ReactNode } from 'react'

import { Text } from '../Text'

import { Actions, Panel } from './styled'

type Props = {
  title: string
  text?: string
  /** An empty state always offers the next thing to do. */
  actions?: ReactNode
  role?: 'status' | 'alert'
}

/** Loading, error and empty states all look like this, so none is a blank page. */
export const StatePanel = ({ title, text, actions, role }: Props) => (
  <Panel role={role}>
    <Text as="h2" variant="title">
      {title}
    </Text>
    {text ? <Text tone="muted">{text}</Text> : null}
    {actions ? <Actions>{actions}</Actions> : null}
  </Panel>
)
