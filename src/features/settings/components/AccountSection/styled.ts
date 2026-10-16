import styled from 'styled-components'

export const Line = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};

  &:first-of-type {
    padding-top: 0;
    border-top: none;
  }
`
