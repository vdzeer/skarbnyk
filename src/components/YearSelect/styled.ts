import styled from 'styled-components'

export const Label = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.onSurfaceMuted};
  font-size: ${({ theme }) => theme.text.secondary.size};
  line-height: ${({ theme }) => theme.text.secondary.line};

  select {
    width: auto;
  }
`
