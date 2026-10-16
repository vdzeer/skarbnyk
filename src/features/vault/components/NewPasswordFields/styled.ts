import styled from 'styled-components'

export const Meter = styled.div<{ $strength: number }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xxs};
`

export const Segment = styled.span<{ $on: boolean }>`
  flex: 1 1 0;
  height: ${({ theme }) => theme.sizes.barSmall};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $on }) =>
    $on ? theme.colors.primary : theme.colors.surfaceSunken};
`
