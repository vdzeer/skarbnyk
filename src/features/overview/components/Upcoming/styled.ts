import styled from 'styled-components'

export const Item = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  border-top: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};
`

export const What = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
`
