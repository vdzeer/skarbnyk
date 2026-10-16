import styled from 'styled-components'

export const Periods = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`

export const Period = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: ${({ theme }) => theme.sizes.control};
  border-top: ${({ theme }) => theme.sizes.hairline} solid
    ${({ theme }) => theme.colors.border};

  &:first-child {
    border-top: none;
  }
`
