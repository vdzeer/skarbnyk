import styled from 'styled-components'

export const MonthTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.onSurfaceMuted};
  font-family: ${({ theme }) => theme.text.overline.family};
  font-size: ${({ theme }) => theme.text.overline.size};
  line-height: ${({ theme }) => theme.text.overline.line};
  font-weight: ${({ theme }) => theme.text.overline.weight};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`

export const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`
