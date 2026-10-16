import type { ElementType, ReactNode } from 'react'

import type { TextVariant } from '~/themes'

import { StyledText } from './styled'
import type { TextTone } from './types'

type Props = {
  variant?: TextVariant
  /** The variant to use instead on a phone-width screen. */
  narrowVariant?: TextVariant
  tone?: TextTone
  /** For sums: a number is never broken across lines. */
  nowrap?: boolean
  as?: ElementType
  id?: string
  htmlFor?: string
  children: ReactNode
}

/** Text in one of the sizes of the scale; `narrowVariant` swaps it on a phone. */
export const Text = ({
  variant = 'body',
  narrowVariant,
  tone = 'default',
  nowrap = false,
  children,
  ...rest
}: Props) => (
  <StyledText
    $variant={variant}
    $narrowVariant={narrowVariant}
    $tone={tone}
    $nowrap={nowrap}
    {...rest}>
    {children}
  </StyledText>
)
