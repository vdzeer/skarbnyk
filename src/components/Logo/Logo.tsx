import { Coin, Mark } from './styled'

/** The app mark: a stack of coins on a rounded tile. Decoration only. */
export const Logo = () => (
  <Mark viewBox="0 0 32 32" aria-hidden>
    <rect width="32" height="32" rx="9" />
    <Coin
      as="path"
      d="M9 10.5c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM9 10.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M9 15.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"
    />
  </Mark>
)
