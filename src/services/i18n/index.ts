import i18next from 'i18next'
import { useCallback } from 'react'
import { initReactI18next, useTranslation } from 'react-i18next'

import uk from './uk.json'

/** Every visible string. One language for now; keys are typed off this file. */
export type TranslationKey = keyof typeof uk

// Initialised once, synchronously, with the strings bundled: there is no
// loading state and no flash of keys.
if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: { uk: { translation: uk } },
    lng: 'uk',
    fallbackLng: 'uk',
    interpolation: { escapeValue: false },
  })
}

type Values = Record<string, string | number>

/** `t` with keys checked against the strings file. */
export const useT = () => {
  const { t } = useTranslation()

  return useCallback(
    (key: TranslationKey, values?: Values): string => t(key, values ?? {}),
    [t],
  )
}

export type Translate = ReturnType<typeof useT>

export const STRINGS: Record<TranslationKey, string> = uk
