import styled from 'styled-components'

export const Card = styled.section<{ $padding?: 'md' | 'lg' | 'none' }>`
  min-width: 0;
  padding: ${({ theme, $padding = 'lg' }) =>
    $padding === 'none' ? theme.spacing.none : theme.spacing[$padding]};
  border: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
`
