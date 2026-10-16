import styled from 'styled-components'

export const Key = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.md};
  border: ${({ theme }) => theme.sizes.hairline} dashed
    ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surfaceSubtle};
  font-family: ${({ theme }) => theme.text.code.family};
  font-size: ${({ theme }) => theme.text.code.size};
  line-height: ${({ theme }) => theme.text.code.line};
  font-weight: ${({ theme }) => theme.text.code.weight};
  letter-spacing: 0.06em;
  text-align: center;
  white-space: pre-line;
  overflow-wrap: anywhere;
  user-select: all;
`
