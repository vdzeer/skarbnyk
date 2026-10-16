import styled from 'styled-components'

export const Line = styled.p`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.xs};
  margin: 0;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};

  svg {
    margin-top: ${({ theme }) => theme.spacing.xxs};
    color: ${({ theme }) => theme.colors.onPrimarySoft};
  }
`
