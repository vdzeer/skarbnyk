import { KEY_RECORD_VERSION, type KeyRecord } from '~/services/crypto'

/**
 * `keys/{uid}` in Firestore (snake_case, untrusted) and the key record the
 * crypto service reads. A document of the wrong shape is no record at all.
 */

type Doc = Record<string, unknown>

const STRING_FIELDS = {
  kdfSalt: 'kdf_salt',
  passwordIv: 'password_iv',
  passwordKey: 'password_key',
  recoverySalt: 'recovery_salt',
  recoveryIv: 'recovery_iv',
  recoveryKey: 'recovery_key',
} as const

type StringField = keyof typeof STRING_FIELDS

const FIELDS = Object.keys(STRING_FIELDS) as StringField[]

export const keyRecordFromDoc = (data: Doc | undefined): KeyRecord | null => {
  if (!data || data.v !== KEY_RECORD_VERSION) return null
  if (!Number.isInteger(data.kdf_iterations)) return null
  if (FIELDS.some(field => typeof data[STRING_FIELDS[field]] !== 'string')) {
    return null
  }

  return {
    v: KEY_RECORD_VERSION,
    kdfIterations: data.kdf_iterations as number,
    ...(Object.fromEntries(
      FIELDS.map(field => [field, data[STRING_FIELDS[field]]]),
    ) as Record<StringField, string>),
  }
}

export const keyRecordToDoc = (record: KeyRecord, uid: string): Doc => ({
  owner_uid: uid,
  v: record.v,
  kdf_iterations: record.kdfIterations,
  ...Object.fromEntries(
    FIELDS.map(field => [STRING_FIELDS[field], record[field]]),
  ),
})
