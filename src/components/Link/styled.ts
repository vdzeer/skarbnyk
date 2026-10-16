import styled from 'styled-components'

export const Anchor = styled.a`
  color: ${({ theme }) => theme.colors.onPrimarySoft};
  font-weight: ${({ theme }) => theme.text.label.weight};
  text-decoration: underline;
  text-underline-offset: 0.15em;
`
