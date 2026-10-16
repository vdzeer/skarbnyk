import styled from 'styled-components'

export const Figure = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.text.amount.family};
  font-size: ${({ theme }) => theme.text.amount.size};
  line-height: ${({ theme }) => theme.text.amount.line};
  font-weight: ${({ theme }) => theme.text.amount.weight};
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
`

export const Unit = styled.span`
  font-size: ${({ theme }) => theme.text.title.size};
  font-weight: ${({ theme }) => theme.text.label.weight};
`

export const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.xs};
`
