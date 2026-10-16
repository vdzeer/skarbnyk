import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { SETTINGS_STORAGE_KEY, type ThemePreference } from '~/types'

/** Per-device preferences: nothing here is about money, so it is not encrypted. */
type SettingsState = {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      theme: 'system',
      setTheme: theme => set({ theme }),
    }),
    { name: SETTINGS_STORAGE_KEY },
  ),
)
