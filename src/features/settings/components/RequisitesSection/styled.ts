import styled from 'styled-components'

export const Group = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};
`
