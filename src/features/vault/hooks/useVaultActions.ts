import { useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  changePassword,
  createVault,
  forgetDeviceKeys,
  openWithPassword,
  openWithRecovery,
  rememberDeviceKey,
  replaceRecoveryKey,
  type NewVault,
} from '~/services/crypto'
import { LEDGER_QUERY } from '~/features/ledger/services/collections'
import { useUid, useVaultStore } from '~/store'

import { saveKeyRecord } from '../services'

const recordOrThrow = () => {
  const { record } = useVaultStore.getState()
  if (!record) throw new Error('no key record')
  return record
}

/**
 * Every way the data key is created, opened, re-wrapped and put away. The
 * password and the recovery key pass through as arguments and are never kept.
 */
export const useVaultActions = () => {
  const uid = useUid()
  const queryClient = useQueryClient()

  return useMemo(() => {
    const requireUid = () => {
      if (!uid) throw new Error('not signed in')
      return uid
    }

    const openUp = async (
      dataKey: CryptoKey,
      remember: boolean,
      record = recordOrThrow(),
    ) => {
      if (remember) await rememberDeviceKey(requireUid(), dataKey)
      useVaultStore.getState().unlocked(dataKey, record)
    }

    /** Creates and stores the key record; the vault opens after `finishSetup`. */
    const create = async (password: string): Promise<NewVault> => {
      const vault = await createVault(password, requireUid())
      await saveKeyRecord(requireUid(), vault.record)
      return vault
    }

    const finishSetup = (vault: NewVault, remember: boolean) =>
      openUp(vault.dataKey, remember, vault.record)

    /** False when the password is wrong. */
    const unlock = async (password: string, remember: boolean) => {
      const dataKey = await openWithPassword(
        recordOrThrow(),
        password,
        requireUid(),
      )
      if (!dataKey) return false
      await openUp(dataKey, remember)
      return true
    }

    /** The data key behind a recovery key, before a new password is set. */
    const recover = (recoveryText: string) =>
      openWithRecovery(recordOrThrow(), recoveryText, requireUid())

    const setNewPassword = async (
      dataKey: CryptoKey,
      password: string,
      remember: boolean,
    ) => {
      const record = await changePassword(
        recordOrThrow(),
        dataKey,
        password,
        requireUid(),
      )
      await saveKeyRecord(requireUid(), record)
      await openUp(dataKey, remember, record)
    }

    /** False when the current password is wrong. */
    const replacePassword = async (current: string, next: string) => {
      const record = recordOrThrow()
      const dataKey = await openWithPassword(record, current, requireUid())
      if (!dataKey) return false
      const updated = await changePassword(record, dataKey, next, requireUid())
      await saveKeyRecord(requireUid(), updated)
      useVaultStore.getState().unlocked(dataKey, updated)
      return true
    }

    /** The new recovery key's text, or null when the password is wrong. */
    const newRecoveryKey = async (current: string) => {
      const record = recordOrThrow()
      const dataKey = await openWithPassword(record, current, requireUid())
      if (!dataKey) return null
      const next = await replaceRecoveryKey(record, dataKey, requireUid())
      await saveKeyRecord(requireUid(), next.record)
      useVaultStore.getState().unlocked(dataKey, next.record)
      return next.recoveryText
    }

    /** Puts the key away: memory, this device, and every decrypted row. */
    const lock = async () => {
      useVaultStore.getState().lock()
      queryClient.removeQueries({ queryKey: [LEDGER_QUERY] })
      await forgetDeviceKeys()
    }

    return {
      create,
      finishSetup,
      unlock,
      recover,
      setNewPassword,
      replacePassword,
      newRecoveryKey,
      lock,
    }
  }, [uid, queryClient])
}
