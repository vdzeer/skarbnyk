import 'styled-components'

import type { AppTheme } from './theme'

declare module 'styled-components' {
  // The theme object is the single source of the type.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
