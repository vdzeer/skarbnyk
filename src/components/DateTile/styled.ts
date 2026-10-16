import styled, { css } from 'styled-components'

const tones = {
  neutral: css`
    background: ${({ theme }) => theme.colors.surfaceSunken};
    color: ${({ theme }) => theme.colors.onSurface};
  `,
  warning: css`
    background: ${({ theme }) => theme.colors.warningSoft};
    color: ${({ theme }) => theme.colors.warning};
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.dangerSoft};
    color: ${({ theme }) => theme.colors.danger};
  `,
  success: css`
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.onPrimarySoft};
  `,
}

export const Tile = styled.span<{
  $tone: 'neutral' | 'warning' | 'danger' | 'success'
}>`
  flex: 0 0 ${({ theme }) => theme.sizes.dateTile};
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} 0;
  border-radius: ${({ theme }) => theme.radii.lg};
  ${({ $tone }) => tones[$tone]}
`

export const Day = styled.strong`
  font-family: ${({ theme }) => theme.text.amountSmall.family};
  font-size: ${({ theme }) => theme.text.amountSmall.size};
  line-height: ${({ theme }) => theme.text.amountSmall.line};
  font-weight: ${({ theme }) => theme.text.amountSmall.weight};
`

export const Month = styled.span`
  font-size: ${({ theme }) => theme.text.caption.size};
  line-height: ${({ theme }) => theme.text.caption.line};
`
