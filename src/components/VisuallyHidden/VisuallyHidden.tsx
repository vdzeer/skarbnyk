import styled from 'styled-components'

/** Read by a screen reader, not drawn on screen. */
export const VisuallyHidden = styled.span`
  position: absolute;
  width: ${({ theme }) => theme.sizes.hairline};
  height: ${({ theme }) => theme.sizes.hairline};
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`
