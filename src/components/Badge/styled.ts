import styled, { css } from 'styled-components'

import type { BadgeTone } from './types'

const tones = {
  neutral: css`
    background: ${({ theme }) => theme.colors.surfaceSunken};
    color: ${({ theme }) => theme.colors.onSurfaceMuted};
  `,
  success: css`
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.onPrimarySoft};
  `,
  warning: css`
    background: ${({ theme }) => theme.colors.warningSoft};
    color: ${({ theme }) => theme.colors.warning};
  `,
  info: css`
    background: ${({ theme }) => theme.colors.infoSoft};
    color: ${({ theme }) => theme.colors.info};
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.dangerSoft};
    color: ${({ theme }) => theme.colors.danger};
  `,
}

export const Pill = styled.span<{ $tone: BadgeTone }>`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: ${({ theme }) => theme.spacing.xxs};
  padding: ${({ theme }) => theme.spacing.none}
    ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-family: ${({ theme }) => theme.text.overline.family};
  font-size: ${({ theme }) => theme.text.caption.size};
  line-height: ${({ theme }) => theme.text.secondary.line};
  font-weight: ${({ theme }) => theme.text.overline.weight};
  white-space: nowrap;
  ${({ $tone }) => tones[$tone]}
`
