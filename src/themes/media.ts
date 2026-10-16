import type { ExecutionContext } from 'styled-components'

/**
 * Phones and narrow windows. Used as `${narrow} { … }` inside a styled
 * component; the one breakpoint lives in the tokens.
 */
export const narrow = ({ theme }: ExecutionContext) =>
  `@media (max-width: ${theme.breakpoints.narrow})`
