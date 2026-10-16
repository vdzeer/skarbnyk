import { randomBytes, type Bytes } from './bytes'

/**
 * The recovery key: 160 random bits written in Crockford's base32, eight
 * groups of four (`ZB4K-7QFM-…`). That alphabet has no I, L, O or U, so a key
 * copied by hand off paper survives the usual misreadings.
 */

export const RECOVERY_KEY_BYTES = 20

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const GROUP = 4

/** Letters people write for the digits they look like. */
const LOOKALIKES: Record<string, string> = { O: '0', I: '1', L: '1' }

export const formatRecoveryKey = (bytes: Uint8Array) => {
  const bits = Array.from(bytes, byte => byte.toString(2).padStart(8, '0'))
    .join('')
    .match(/.{1,5}/g) as string[]
  const chars = bits.map(chunk => ALPHABET[parseInt(chunk.padEnd(5, '0'), 2)])

  return chars
    .join('')
    .match(new RegExp(`.{1,${GROUP}}`, 'g'))
    ?.join('-') as string
}

/**
 * The bytes back from what the user typed: any case, with or without dashes
 * and spaces. Null when it cannot be a recovery key at all.
 */
export const parseRecoveryKey = (text: string): Bytes | null => {
  const chars = text
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[OIL]/g, char => LOOKALIKES[char])

  if (chars.length !== (RECOVERY_KEY_BYTES * 8) / 5) return null
  if ([...chars].some(char => !ALPHABET.includes(char))) return null

  const bits = [...chars]
    .map(char => ALPHABET.indexOf(char).toString(2).padStart(5, '0'))
    .join('')

  return Uint8Array.from({ length: RECOVERY_KEY_BYTES }, (_, index) =>
    parseInt(bits.slice(index * 8, index * 8 + 8), 2),
  )
}

export const generateRecoveryKey = () => {
  const bytes = randomBytes(RECOVERY_KEY_BYTES)
  return { bytes, text: formatRecoveryKey(bytes) }
}
