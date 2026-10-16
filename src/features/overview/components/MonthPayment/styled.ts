import styled from 'styled-components'

export const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin: ${({ theme }) => theme.spacing.xs} 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  text-align: left;
`

export const Line = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.sm};
`

export const Total = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.xs};
  border-top: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};
`
