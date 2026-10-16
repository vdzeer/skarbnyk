import styled from 'styled-components'

export const Track = styled.div<{ $large: boolean }>`
  align-self: stretch;
  display: flex;
  height: ${({ theme, $large }) =>
    $large ? theme.sizes.barLarge : theme.sizes.bar};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.surfaceSunken};
  overflow: hidden;
`

export const Fill = styled.div<{ $ratio: number; $color: string }>`
  width: ${({ $ratio }) => `${Math.round($ratio * 100)}%`};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $color }) => $color};
  transition: width ${({ theme }) => theme.motion.base};
`
