import styled from 'styled-components'

export const Fields = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};

  > * {
    flex: 1 1 ${({ theme }) => theme.sizes.field};
  }
`
