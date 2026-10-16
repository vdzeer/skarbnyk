import { fromBase64, randomBytes, toBase64, utf8, type Bytes } from './bytes'
import { generateRecoveryKey, parseRecoveryKey } from './recoveryKey'

/**
 * The data key and the two ways to open it.
 *
 * One random AES-GCM key encrypts every document. It is never stored as is:
 * the key record holds it wrapped twice, once by a key derived from the
 * password (PBKDF2, slow on purpose) and once by a key derived from the
 * recovery key (HKDF: that one is already 160 random bits). Changing the
 * password re-wraps the data key and leaves every document untouched.
 *
 * The wrapping is bound to the account through AES-GCM's additional data, so
 * a key record copied into another account does not open there.
 */

/** OWASP's 2023 figure for PBKDF2-HMAC-SHA256. */
export const KDF_ITERATIONS = 600_000

export const KEY_RECORD_VERSION = 1

const SALT_BYTES = 16
const IV_BYTES = 12
const RECOVERY_INFO = utf8('skarbnyk recovery v1')

/** What `keys/{uid}` stores: salts, IVs and the two wrapped copies, base64. */
export type KeyRecord = {
  v: typeof KEY_RECORD_VERSION
  kdfIterations: number
  kdfSalt: string
  passwordIv: string
  passwordKey: string
  recoverySalt: string
  recoveryIv: string
  recoveryKey: string
}

type Opener = 'password' | 'recovery'

const wrapContext = (uid: string, opener: Opener) =>
  utf8(`skarbnyk:v1:key:${uid}:${opener}`)

const AES = { name: 'AES-GCM', length: 256 } as const

const passwordKek = async (
  password: string,
  salt: Bytes,
  iterations: number,
) => {
  const base = await crypto.subtle.importKey(
    'raw',
    utf8(password.normalize('NFC')),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    AES,
    false,
    ['wrapKey', 'unwrapKey'],
  )
}

const recoveryKek = async (secret: Bytes, salt: Bytes) => {
  const base = await crypto.subtle.importKey('raw', secret, 'HKDF', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: RECOVERY_INFO },
    base,
    AES,
    false,
    ['wrapKey', 'unwrapKey'],
  )
}

const wrap = async (
  dataKey: CryptoKey,
  kek: CryptoKey,
  context: Bytes,
): Promise<{ iv: string; wrapped: string }> => {
  const iv = randomBytes(IV_BYTES)
  const wrapped = await crypto.subtle.wrapKey('raw', dataKey, kek, {
    name: 'AES-GCM',
    iv,
    additionalData: context,
  })
  return { iv: toBase64(iv), wrapped: toBase64(new Uint8Array(wrapped)) }
}

/**
 * The data key comes back extractable: changing the password has to wrap it
 * again. What is kept on the device is a non-extractable copy (`deviceKey`).
 */
const unwrap = async (
  kek: CryptoKey,
  ivText: string,
  wrappedText: string,
  context: Bytes,
): Promise<CryptoKey | null> => {
  const iv = fromBase64(ivText)
  const wrapped = fromBase64(wrappedText)
  if (!iv || !wrapped) return null

  try {
    return await crypto.subtle.unwrapKey(
      'raw',
      wrapped,
      kek,
      { name: 'AES-GCM', iv, additionalData: context },
      AES,
      true,
      ['encrypt', 'decrypt'],
    )
  } catch {
    // A wrong password and a damaged record look the same: the tag fails.
    return null
  }
}

const passwordPart = async (
  dataKey: CryptoKey,
  password: string,
  uid: string,
  iterations: number,
) => {
  const salt = randomBytes(SALT_BYTES)
  const kek = await passwordKek(password, salt, iterations)
  const { iv, wrapped } = await wrap(dataKey, kek, wrapContext(uid, 'password'))
  return {
    kdfIterations: iterations,
    kdfSalt: toBase64(salt),
    passwordIv: iv,
    passwordKey: wrapped,
  }
}

const recoveryPart = async (dataKey: CryptoKey, uid: string) => {
  const recovery = generateRecoveryKey()
  const salt = randomBytes(SALT_BYTES)
  const kek = await recoveryKek(recovery.bytes, salt)
  const { iv, wrapped } = await wrap(dataKey, kek, wrapContext(uid, 'recovery'))
  return {
    text: recovery.text,
    fields: {
      recoverySalt: toBase64(salt),
      recoveryIv: iv,
      recoveryKey: wrapped,
    },
  }
}

export type NewVault = {
  dataKey: CryptoKey
  record: KeyRecord
  /** Shown to the user once and never stored. */
  recoveryText: string
}

/** A fresh data key, wrapped by the password and by a new recovery key. */
export const createVault = async (
  password: string,
  uid: string,
  iterations = KDF_ITERATIONS,
): Promise<NewVault> => {
  const dataKey = await crypto.subtle.generateKey(AES, true, [
    'encrypt',
    'decrypt',
  ])
  const byPassword = await passwordPart(dataKey, password, uid, iterations)
  const byRecovery = await recoveryPart(dataKey, uid)

  return {
    dataKey,
    recoveryText: byRecovery.text,
    record: { v: KEY_RECORD_VERSION, ...byPassword, ...byRecovery.fields },
  }
}

/** The data key, or null when the password is wrong. */
export const openWithPassword = async (
  record: KeyRecord,
  password: string,
  uid: string,
) => {
  const salt = fromBase64(record.kdfSalt)
  if (!salt) return null
  const kek = await passwordKek(password, salt, record.kdfIterations)
  return unwrap(
    kek,
    record.passwordIv,
    record.passwordKey,
    wrapContext(uid, 'password'),
  )
}

/** The data key, or null when the recovery key is wrong or malformed. */
export const openWithRecovery = async (
  record: KeyRecord,
  recoveryText: string,
  uid: string,
) => {
  const secret = parseRecoveryKey(recoveryText)
  const salt = fromBase64(record.recoverySalt)
  if (!secret || !salt) return null
  const kek = await recoveryKek(secret, salt)
  return unwrap(
    kek,
    record.recoveryIv,
    record.recoveryKey,
    wrapContext(uid, 'recovery'),
  )
}

/** The same data key under a new password; the recovery key keeps working. */
export const changePassword = async (
  record: KeyRecord,
  dataKey: CryptoKey,
  newPassword: string,
  uid: string,
  iterations = KDF_ITERATIONS,
): Promise<KeyRecord> => ({
  ...record,
  ...(await passwordPart(dataKey, newPassword, uid, iterations)),
})

/** A new recovery key; the old one stops working, the password does not. */
export const replaceRecoveryKey = async (
  record: KeyRecord,
  dataKey: CryptoKey,
  uid: string,
): Promise<{ record: KeyRecord; recoveryText: string }> => {
  const byRecovery = await recoveryPart(dataKey, uid)
  return {
    record: { ...record, ...byRecovery.fields },
    recoveryText: byRecovery.text,
  }
}
