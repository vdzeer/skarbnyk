import { create } from 'zustand'

import type { KeyRecord } from '~/services/crypto'

/**
 * Where the data key is. `missing`: the account has no key record yet and
 * the user has to create a password. `locked`: there is a record, the key is
 * not in memory. `unlocked`: everything can be read and written.
 */
export type VaultStatus =
  'unknown' | 'missing' | 'locked' | 'unlocked' | 'error'

type VaultState = {
  status: VaultStatus
  record: KeyRecord | null
  /** Lives in memory only. Never persisted by this store. */
  dataKey: CryptoKey | null
  loaded: (record: KeyRecord | null) => void
  unlocked: (dataKey: CryptoKey, record?: KeyRecord) => void
  lock: () => void
  failed: () => void
  reset: () => void
}

export const useVaultStore = create<VaultState>(set => ({
  status: 'unknown',
  record: null,
  dataKey: null,
  loaded: record =>
    set({ record, dataKey: null, status: record ? 'locked' : 'missing' }),
  unlocked: (dataKey, record) =>
    set(state => ({
      dataKey,
      record: record ?? state.record,
      status: 'unlocked',
    })),
  lock: () =>
    set(state => ({
      dataKey: null,
      status: state.record ? 'locked' : 'missing',
    })),
  failed: () => set({ status: 'error' }),
  reset: () => set({ status: 'unknown', record: null, dataKey: null }),
}))

/** The key, but only while the vault is open. */
export const useDataKey = () =>
  useVaultStore(state => (state.status === 'unlocked' ? state.dataKey : null))
