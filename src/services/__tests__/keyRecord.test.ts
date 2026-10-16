import type { KeyRecord } from '~/services/crypto'

import { keyRecordFromDoc, keyRecordToDoc } from '../keyRecord'

const RECORD: KeyRecord = {
  v: 1,
  kdfIterations: 600000,
  kdfSalt: 's'.repeat(24),
  passwordIv: 'i'.repeat(16),
  passwordKey: 'k'.repeat(64),
  recoverySalt: 'r'.repeat(24),
  recoveryIv: 'j'.repeat(16),
  recoveryKey: 'q'.repeat(64),
}

describe('the key record document', () => {
  it('round-trips through Firestore field names', () => {
    const data = keyRecordToDoc(RECORD, 'alice')

    expect(data).toEqual({
      owner_uid: 'alice',
      v: 1,
      kdf_iterations: 600000,
      kdf_salt: RECORD.kdfSalt,
      password_iv: RECORD.passwordIv,
      password_key: RECORD.passwordKey,
      recovery_salt: RECORD.recoverySalt,
      recovery_iv: RECORD.recoveryIv,
      recovery_key: RECORD.recoveryKey,
    })
    expect(keyRecordFromDoc(data)).toEqual(RECORD)
  })

  it.each([
    ['no document', undefined],
    ['another version', { ...keyRecordToDoc(RECORD, 'a'), v: 2 }],
    ['a missing field', { ...keyRecordToDoc(RECORD, 'a'), password_key: null }],
    [
      'iterations as text',
      { ...keyRecordToDoc(RECORD, 'a'), kdf_iterations: '600000' },
    ],
  ])('reads %s as no record', (_label, data) => {
    expect(
      keyRecordFromDoc(data as Record<string, unknown> | undefined),
    ).toBeNull()
  })
})
