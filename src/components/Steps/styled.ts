import styled, { css } from 'styled-components'

type StepState = 'done' | 'now' | 'ahead'

const states = {
  done: css`
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.onPrimarySoft};
  `,
  now: css`
    background: ${({ theme }) => theme.colors.onSurface};
    color: ${({ theme }) => theme.colors.surface};
  `,
  ahead: css`
    background: ${({ theme }) => theme.colors.surfaceSunken};
    color: ${({ theme }) => theme.colors.onSurfaceMuted};
  `,
}

export const List = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`

export const Step = styled.li<{ $state: StepState }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xxs};
  padding: ${({ theme }) => theme.spacing.xxs}
    ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: ${({ theme }) => theme.text.secondary.size};
  line-height: ${({ theme }) => theme.text.secondary.line};
  font-weight: ${({ theme }) => theme.text.overline.weight};
  ${({ $state }) => states[$state]}
`
