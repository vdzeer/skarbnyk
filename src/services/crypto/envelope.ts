import { fromBase64, fromUtf8, randomBytes, toBase64, utf8 } from './bytes'

/**
 * One encrypted document: the model as JSON under AES-GCM, with a fresh IV
 * on every write. The additional data names the collection, the document and
 * the account, so a ciphertext moved to another place fails to open instead
 * of passing for the data that belongs there.
 */

export const ENVELOPE_VERSION = 1

const IV_BYTES = 12

export type Envelope = {
  v: typeof ENVELOPE_VERSION
  iv: string
  ct: string
}

export type EnvelopeContext = {
  collection: string
  id: string
  uid: string
}

const contextBytes = ({ collection, id, uid }: EnvelopeContext) =>
  utf8(`skarbnyk:v1:${collection}:${id}:${uid}`)

export const seal = async (
  dataKey: CryptoKey,
  payload: unknown,
  context: EnvelopeContext,
): Promise<Envelope> => {
  const iv = randomBytes(IV_BYTES)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: contextBytes(context) },
    dataKey,
    utf8(JSON.stringify(payload)),
  )
  return {
    v: ENVELOPE_VERSION,
    iv: toBase64(iv),
    ct: toBase64(new Uint8Array(ciphertext)),
  }
}

/**
 * The payload, or null when the envelope does not open: a wrong key, a
 * document moved from elsewhere, damaged bytes. The caller drops it.
 */
export const open = async (
  dataKey: CryptoKey,
  envelope: Record<string, unknown>,
  context: EnvelopeContext,
): Promise<unknown> => {
  if (typeof envelope.iv !== 'string' || typeof envelope.ct !== 'string') {
    return null
  }
  const iv = fromBase64(envelope.iv)
  const ciphertext = fromBase64(envelope.ct)
  if (!iv || !ciphertext) return null

  try {
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: contextBytes(context) },
      dataKey,
      ciphertext,
    )
    return JSON.parse(fromUtf8(plain))
  } catch {
    return null
  }
}
