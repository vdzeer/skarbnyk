import { create } from 'zustand'

type SyncState = {
  /**
   * Writes are not awaited (they would hang offline), so a refused write is
   * only known later. This flag is how the shell tells the user about it.
   */
  failed: boolean
  markFailed: () => void
  clear: () => void
}

export const useSyncStore = create<SyncState>(set => ({
  failed: false,
  markFailed: () => set({ failed: true }),
  clear: () => set({ failed: false }),
}))
