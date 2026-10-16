import styled from 'styled-components'

/** Shown while the auth state is unknown: the page colour and nothing else. */
export const Splash = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: ${({ theme }) => theme.colors.background};
`
