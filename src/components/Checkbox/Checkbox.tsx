import type { ReactNode } from 'react'

import { Text } from '../Text'

import { Box, Label } from './styled'

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  /** A second, quieter line under the label. */
  hint?: string
  type?: 'checkbox' | 'radio'
  name?: string
  disabled?: boolean
  children?: ReactNode
}

/** A native checkbox or radio with its whole label clickable. */
export const Checkbox = ({
  checked,
  onChange,
  label,
  hint,
  type = 'checkbox',
  name,
  disabled,
  children,
}: Props) => (
  <Label $disabled={Boolean(disabled)}>
    <Box
      type={type}
      name={name}
      checked={checked}
      disabled={disabled}
      onChange={event => onChange(event.target.checked)}
    />
    <span>
      <Text>{label}</Text>
      {hint ? (
        <Text as="span" variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
      {children}
    </span>
  </Label>
)
