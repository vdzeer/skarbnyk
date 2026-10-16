import styled from 'styled-components'

export const Label = styled.label<{ $disabled: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  min-height: ${({ theme }) => theme.sizes.control};
  padding-block: ${({ theme }) => theme.spacing.xs};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

  > span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
`

export const Box = styled.input`
  flex: none;
  width: ${({ theme }) => theme.sizes.checkbox};
  height: ${({ theme }) => theme.sizes.checkbox};
  margin: ${({ theme }) => theme.spacing.xxs} 0 0;
  accent-color: ${({ theme }) => theme.colors.primary};
`
