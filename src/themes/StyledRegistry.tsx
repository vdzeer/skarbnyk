'use client'

import { useServerInsertedHTML } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import {
  ServerStyleSheet,
  StyleSheetManager,
  ThemeProvider,
} from 'styled-components'

import { GlobalStyle } from './GlobalStyle'
import { theme } from './theme'

/**
 * Collects the CSS styled-components generates while the page is prerendered
 * and inlines it into the HTML, so the first paint is already styled.
 */
export const StyledRegistry = ({ children }: { children: ReactNode }) => {
  const [sheet] = useState(() => new ServerStyleSheet())

  useServerInsertedHTML(() => {
    const styles = sheet.getStyleElement()
    sheet.instance.clearTag()
    return <>{styles}</>
  })

  const content = (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  )

  if (typeof window !== 'undefined') return content

  return <StyleSheetManager sheet={sheet.instance}>{content}</StyleSheetManager>
}
