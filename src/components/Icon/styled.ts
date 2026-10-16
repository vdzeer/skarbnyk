import styled from 'styled-components'

import type { IconSize } from './types'

const SIZE = {
  sm: 'iconSmall',
  md: 'icon',
  lg: 'iconLarge',
} as const

export const Svg = styled.svg<{ $size: IconSize }>`
  flex: none;
  display: block;
  width: ${({ theme, $size }) => theme.sizes[SIZE[$size]]};
  height: ${({ theme, $size }) => theme.sizes[SIZE[$size]]};
`
