import { useCallback, useEffect, useState } from 'react'

import { loadDeviceKey } from '~/services/crypto'
import { useUid, useVaultStore } from '~/store'

import { fetchKeyRecord } from '../services'

/**
 * Reads the key record once the user is known, and opens the vault straight
 * away when this device remembers the key. Mounted once, by the gate.
 */
export const useVaultLoader = () => {
  const uid = useUid()
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const store = useVaultStore.getState()
    if (!uid) {
      store.reset()
      return undefined
    }

    let cancelled = false
    const load = async () => {
      try {
        const record = await fetchKeyRecord(uid)
        if (cancelled) return
        if (!record) {
          store.loaded(null)
          return
        }
        const deviceKey = await loadDeviceKey(uid)
        if (cancelled) return
        store.loaded(record)
        if (deviceKey) store.unlocked(deviceKey)
      } catch (error) {
        console.error(error)
        if (!cancelled) store.failed()
      }
    }
    load()

    return () => {
      cancelled = true
    }
  }, [uid, attempt])

  return useCallback(() => {
    useVaultStore.getState().reset()
    setAttempt(value => value + 1)
  }, [])
}
