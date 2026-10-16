import { fromBase64 } from '../bytes'
import { open, seal } from '../envelope'
import {
  KDF_ITERATIONS,
  changePassword,
  createVault,
  openWithPassword,
  openWithRecovery,
  replaceRecoveryKey,
  type KeyRecord,
} from '../keys'
import {
  RECOVERY_KEY_BYTES,
  formatRecoveryKey,
  generateRecoveryKey,
  parseRecoveryKey,
} from '../recoveryKey'

// The real WebCrypto that Node ships. Iterations are lowered so the suite
// stays fast; the default the app uses is asserted separately.
const FAST = 1_000
const ALICE = 'alice-uid'
const BOB = 'bob-uid'
const PASSWORD = 'correct horse battery staple'

/** Two keys are the same key when one opens what the other sealed. */
const sameKey = async (one: CryptoKey, other: CryptoKey) => {
  const where = { collection: 'incomes', id: 'x', uid: ALICE }
  return (
    (await open(other, await seal(one, { ok: true }, where), where)) !== null
  )
}

describe('recovery key', () => {
  it('writes 160 bits as eight groups of four', () => {
    const { text } = generateRecoveryKey()
    expect(text).toMatch(/^([0-9A-HJKMNP-TV-Z]{4}-){7}[0-9A-HJKMNP-TV-Z]{4}$/)
  })

  it('reads back what it wrote', () => {
    const { bytes, text } = generateRecoveryKey()
    expect(parseRecoveryKey(text)).toEqual(bytes)
  })

  it('forgives case, spaces, missing dashes and look-alike letters', () => {
    const bytes = new Uint8Array(RECOVERY_KEY_BYTES).fill(0)
    const text = formatRecoveryKey(bytes)
    expect(text).toBe('0000-0000-0000-0000-0000-0000-0000-0000')
    expect(parseRecoveryKey(`OOOO-oooo-${'0'.repeat(24)}`)).toEqual(bytes)
    expect(parseRecoveryKey(`IIII-llll-${'1'.repeat(24)}`)).toEqual(
      parseRecoveryKey('1'.repeat(32)),
    )
    expect(parseRecoveryKey(text.toLowerCase().replace(/-/g, ' '))).toEqual(
      bytes,
    )
  })

  it('refuses something that cannot be a key', () => {
    expect(parseRecoveryKey('')).toBeNull()
    expect(parseRecoveryKey('ABCD-EFGH')).toBeNull()
    expect(parseRecoveryKey('U'.repeat(32))).toBeNull()
  })
})

describe('the key record', () => {
  let record: KeyRecord
  let dataKey: CryptoKey
  let recoveryText: string

  beforeAll(async () => {
    const vault = await createVault(PASSWORD, ALICE, FAST)
    ;({ record, dataKey, recoveryText } = vault)
  })

  it('has the sizes the security rules expect', () => {
    expect(record.v).toBe(1)
    expect(record.kdfSalt).toHaveLength(24)
    expect(record.recoverySalt).toHaveLength(24)
    expect(record.passwordIv).toHaveLength(16)
    expect(record.recoveryIv).toHaveLength(16)
    expect(record.passwordKey).toHaveLength(64)
    expect(record.recoveryKey).toHaveLength(64)
  })

  it('never stores the data key in the clear', async () => {
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', dataKey))
    const stored = Object.values(record)
      .filter((value): value is string => typeof value === 'string')
      .map(value => fromBase64(value))

    stored.forEach(bytes => {
      expect(Buffer.from(bytes ?? []).includes(Buffer.from(raw))).toBe(false)
    })
  })

  it('opens with the password', async () => {
    const opened = await openWithPassword(record, PASSWORD, ALICE)
    expect(opened).not.toBeNull()
    expect(await sameKey(dataKey, opened as CryptoKey)).toBe(true)
  })

  it('opens with the recovery key, typed sloppily', async () => {
    const typed = recoveryText.toLowerCase().replace(/-/g, ' ')
    const opened = await openWithRecovery(record, typed, ALICE)
    expect(opened).not.toBeNull()
  })

  it('stays shut for a wrong password or recovery key', async () => {
    expect(await openWithPassword(record, 'wrong password', ALICE)).toBeNull()
    expect(
      await openWithRecovery(record, generateRecoveryKey().text, ALICE),
    ).toBeNull()
    expect(await openWithRecovery(record, 'nonsense', ALICE)).toBeNull()
  })

  it('stays shut when copied into another account', async () => {
    expect(await openWithPassword(record, PASSWORD, BOB)).toBeNull()
    expect(await openWithRecovery(record, recoveryText, BOB)).toBeNull()
  })

  it('stays shut when a wrapped key is damaged', async () => {
    const damaged = {
      ...record,
      passwordKey: `B${record.passwordKey.slice(1)}`,
    }
    expect(await openWithPassword(damaged, PASSWORD, ALICE)).toBeNull()
  })

  it('changes the password without touching the recovery key', async () => {
    const next = await changePassword(
      record,
      dataKey,
      'a new password',
      ALICE,
      FAST,
    )

    expect(await openWithPassword(next, PASSWORD, ALICE)).toBeNull()
    expect(await openWithPassword(next, 'a new password', ALICE)).not.toBeNull()
    expect(await openWithRecovery(next, recoveryText, ALICE)).not.toBeNull()
    expect(next.kdfSalt).not.toBe(record.kdfSalt)
  })

  it('replaces the recovery key without touching the password', async () => {
    const next = await replaceRecoveryKey(record, dataKey, ALICE)

    expect(next.recoveryText).not.toBe(recoveryText)
    expect(await openWithRecovery(next.record, recoveryText, ALICE)).toBeNull()
    expect(
      await openWithRecovery(next.record, next.recoveryText, ALICE),
    ).not.toBeNull()
    expect(await openWithPassword(next.record, PASSWORD, ALICE)).not.toBeNull()
  })

  it('uses a slow key derivation by default', () => {
    expect(KDF_ITERATIONS).toBeGreaterThanOrEqual(600_000)
  })
})

describe('an encrypted document', () => {
  const where = { collection: 'incomes', id: 'income-1', uid: ALICE }
  const income = { day: '2026-10-02', amount: 350000, currency: 'USD' }
  let dataKey: CryptoKey

  beforeAll(async () => {
    dataKey = (await createVault(PASSWORD, ALICE, FAST)).dataKey
  })

  it('opens back to the same model', async () => {
    const sealed = await seal(dataKey, income, where)
    expect(await open(dataKey, sealed, where)).toEqual(income)
  })

  it('keeps nothing readable: no number, no date, no currency', async () => {
    const sealed = await seal(dataKey, income, where)
    const text = JSON.stringify(sealed)
    ;['350000', '2026-10-02', 'USD'].forEach(fragment => {
      expect(text).not.toContain(fragment)
    })
  })

  it('uses a fresh IV for every write', async () => {
    const one = await seal(dataKey, income, where)
    const two = await seal(dataKey, income, where)
    expect(one.iv).not.toBe(two.iv)
    expect(one.ct).not.toBe(two.ct)
  })

  it.each([
    ['another document', { ...where, id: 'income-2' }],
    ['another collection', { ...where, collection: 'marks' }],
    ['another account', { ...where, uid: BOB }],
  ])('does not open when moved to %s', async (_label, elsewhere) => {
    const sealed = await seal(dataKey, income, where)
    expect(await open(dataKey, sealed, elsewhere)).toBeNull()
  })

  it('does not open with another key, or when damaged', async () => {
    const sealed = await seal(dataKey, income, where)
    const otherKey = (await createVault(PASSWORD, ALICE, FAST)).dataKey

    expect(await open(otherKey, sealed, where)).toBeNull()
    expect(
      await open(dataKey, { ...sealed, ct: `A${sealed.ct.slice(1)}` }, where),
    ).toBeNull()
    expect(await open(dataKey, { iv: 42, ct: null }, where)).toBeNull()
  })
})
