import { useEffect } from 'react'

import { useSettingsStore } from '~/store'
import { palettes } from '~/themes'

/**
 * Keeps the document on the chosen theme. The colours themselves are CSS
 * variables, so this only moves one attribute: nothing re-renders.
 */
export const useThemeSync = () => {
  const theme = useSettingsStore(state => state.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      delete root.dataset.theme
    } else {
      root.dataset.theme = theme
    }

    // The browser's own bar follows too. Each tag is written for one device
    // theme; a forced theme gives them all the same colour.
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach(meta => {
        const device = meta.media.includes('dark') ? 'dark' : 'light'
        const shown = theme === 'system' ? device : theme
        meta.content = palettes[shown].colors.background
      })
  }, [theme])
}
