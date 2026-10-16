import type { ReactNode } from 'react'

import { Text } from '../Text'

import { Wrap } from './styled'

type Props = {
  label: string
  /** The id of the control inside; omit for a group that labels itself. */
  htmlFor?: string
  error?: string
  children: ReactNode
}

export const Field = ({ label, htmlFor, error, children }: Props) => (
  <Wrap>
    <Text as={htmlFor ? 'label' : 'span'} htmlFor={htmlFor} variant="label">
      {label}
    </Text>
    {children}
    {error ? (
      <Text variant="caption" tone="danger">
        {error}
      </Text>
    ) : null}
  </Wrap>
)
