import styled from 'styled-components'

export const Mark = styled.svg`
  flex: none;
  width: ${({ theme }) => theme.sizes.logo};
  height: ${({ theme }) => theme.sizes.logo};

  rect {
    fill: ${({ theme }) => theme.colors.primary};
  }
`

export const Coin = styled.path`
  fill: none;
  stroke: ${({ theme }) => theme.colors.onPrimary};
  stroke-width: 2;
`
