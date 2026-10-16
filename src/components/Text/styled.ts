import styled, { css } from 'styled-components'

import { narrow, type ColorToken, type TextVariant } from '~/themes'

import type { TextTone } from './types'

const TONE_COLOR: Record<Exclude<TextTone, 'inherit'>, ColorToken> = {
  default: 'onSurface',
  muted: 'onSurfaceMuted',
  onPrimary: 'onPrimary',
  danger: 'danger',
}

const scale = (variant: TextVariant) => css`
  font-family: ${({ theme }) => theme.text[variant].family};
  font-size: ${({ theme }) => theme.text[variant].size};
  line-height: ${({ theme }) => theme.text[variant].line};
  font-weight: ${({ theme }) => theme.text[variant].weight};
`

export const StyledText = styled.span<{
  $variant: TextVariant
  $narrowVariant: TextVariant | undefined
  $tone: TextTone
  $nowrap: boolean
}>`
  margin: 0;
  ${({ $variant }) => scale($variant)}
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $tone }) =>
    $tone === 'inherit' ? 'inherit' : theme.colors[TONE_COLOR[$tone]]};
  /* Text sits in rows next to buttons and numbers; a long word may break,
     but only when it cannot fit whole. */
  overflow-wrap: break-word;
  white-space: ${({ $nowrap }) => ($nowrap ? 'nowrap' : 'normal')};

  ${({ $narrowVariant }) =>
    $narrowVariant
      ? css`
          ${narrow} {
            ${scale($narrowVariant)}
          }
        `
      : null}
`
