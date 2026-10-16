/** Bytes that WebCrypto accepts as a buffer source. */
export type Bytes = Uint8Array<ArrayBuffer>

export const randomBytes = (length: number): Bytes =>
  crypto.getRandomValues(new Uint8Array(length))

export const toBase64 = (bytes: Uint8Array) =>
  btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))

/** Null for anything that is not valid base64. */
export const fromBase64 = (text: string): Bytes | null => {
  try {
    const binary = atob(text)
    return Uint8Array.from(binary, char => char.charCodeAt(0))
  } catch {
    return null
  }
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const utf8 = (text: string): Bytes => encoder.encode(text)

export const fromUtf8 = (bytes: ArrayBuffer | Uint8Array) =>
  decoder.decode(bytes)
