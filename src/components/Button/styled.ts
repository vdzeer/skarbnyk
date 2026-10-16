import Link from 'next/link'
import styled, { css } from 'styled-components'

import type { ButtonSize, ButtonVariant } from './types'

type StyleProps = {
  $variant: ButtonVariant
  $size: ButtonSize
  $stretch: boolean
}

const variants = {
  primary: css`
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
  `,
  secondary: css`
    background: ${({ theme }) => theme.colors.surface};
    border-color: ${({ theme }) => theme.colors.borderStrong};
    color: ${({ theme }) => theme.colors.onSurface};
  `,
  ghost: css`
    background: transparent;
    border-color: transparent;
    color: ${({ theme }) => theme.colors.onSurface};
    padding-inline: ${({ theme }) => theme.spacing.xxs};
  `,
  inverse: css`
    background: ${({ theme }) => theme.colors.onHero};
    border-color: ${({ theme }) => theme.colors.onHero};
    color: ${({ theme }) => theme.colors.hero};
  `,
  inverseOutline: css`
    background: transparent;
    border-color: ${({ theme }) => theme.colors.heroOutline};
    color: ${({ theme }) => theme.colors.onHero};
  `,
  danger: css`
    background: transparent;
    border-color: transparent;
    color: ${({ theme }) => theme.colors.danger};
    padding-inline: ${({ theme }) => theme.spacing.xxs};
  `,
}

const base = css<StyleProps>`
  flex: ${({ $stretch }) => ($stretch ? '1 1 auto' : 'none')};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  min-height: ${({ theme, $size }) =>
    $size === 'lg' ? theme.sizes.controlLarge : theme.sizes.control};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  border: ${({ theme }) => theme.sizes.hairline} solid;
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.text.label.family};
  font-size: ${({ theme }) => theme.text.bodyStrong.size};
  line-height: ${({ theme }) => theme.text.bodyStrong.line};
  font-weight: ${({ theme }) => theme.text.bodyStrong.weight};
  text-decoration: none;
  text-align: center;
  cursor: pointer;
  transition: opacity ${({ theme }) => theme.motion.fast};
  ${({ $variant }) => variants[$variant]}

  &:hover {
    opacity: 0.85;
  }

  &:disabled,
  &[aria-disabled='true'] {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

export const StyledButton = styled.button<StyleProps>`
  ${base}
`

export const StyledLink = styled(Link)<StyleProps>`
  ${base}
`
