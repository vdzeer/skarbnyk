const { assertFails, assertSucceeds } = require('@firebase/rules-unit-testing')
const {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} = require('firebase/firestore')

const {
  ALICE,
  BOB,
  base64Of,
  keyData,
  setupTestEnv,
  without,
} = require('../helpers')

let testEnv

beforeAll(async () => {
  testEnv = await setupTestEnv()
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

const seedKey = (uid, overrides) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(doc(context.firestore(), 'keys', uid), keyData(uid, overrides)),
  )

const asAlice = () => testEnv.authenticatedContext(ALICE).firestore()
const asBob = () => testEnv.authenticatedContext(BOB).firestore()
const asGuest = () => testEnv.unauthenticatedContext().firestore()

const createAsAlice = data => setDoc(doc(asAlice(), 'keys', ALICE), data)

describe('keys: reads', () => {
  it('lets the owner read their wrapped key', async () => {
    await seedKey(ALICE)

    await assertSucceeds(getDoc(doc(asAlice(), 'keys', ALICE)))
  })

  it('lets the owner ask for a key that does not exist yet', async () => {
    // First sign-in: the app checks whether a key is there before offering
    // to create one.
    await assertSucceeds(getDoc(doc(asAlice(), 'keys', ALICE)))
  })

  it('refuses another user and a signed-out reader', async () => {
    await seedKey(ALICE)

    await assertFails(getDoc(doc(asBob(), 'keys', ALICE)))
    await assertFails(getDoc(doc(asGuest(), 'keys', ALICE)))
  })

  it('refuses listing the collection, even scoped to the caller', async () => {
    await seedKey(ALICE)

    await assertFails(getDocs(collection(asAlice(), 'keys')))
    await assertFails(
      getDocs(
        query(collection(asAlice(), 'keys'), where('owner_uid', '==', ALICE)),
      ),
    )
  })
})

describe('keys: create', () => {
  it.each([
    ['the shape the app writes', {}],
    ['the fewest iterations allowed', { kdf_iterations: 100000 }],
    ['the most iterations allowed', { kdf_iterations: 10000000 }],
  ])('accepts %s', async (_label, overrides) => {
    await assertSucceeds(createAsAlice(keyData(ALICE, overrides)))
  })

  it('refuses a document id that is not the uid', async () => {
    await assertFails(setDoc(doc(asAlice(), 'keys', 'my-key'), keyData(ALICE)))
  })

  it('refuses writing a key into another user', async () => {
    await assertFails(setDoc(doc(asAlice(), 'keys', BOB), keyData(BOB)))
    await assertFails(setDoc(doc(asAlice(), 'keys', BOB), keyData(ALICE)))
    await assertFails(createAsAlice(keyData(BOB)))
  })

  it('refuses a signed-out writer', async () => {
    await assertFails(setDoc(doc(asGuest(), 'keys', ALICE), keyData(ALICE)))
  })

  it.each([
    ['an unknown field', { password: 'hunter2' }],
    ['a version from the future', { v: 2 }],
    ['a version as a string', { v: '1' }],
    ['too few iterations', { kdf_iterations: 99999 }],
    ['too many iterations', { kdf_iterations: 10000001 }],
    ['iterations that are not a whole number', { kdf_iterations: 600000.5 }],
    ['iterations as a string', { kdf_iterations: '600000' }],
    // Base64 pads to whole groups of 4, so a byte or two either way can keep
    // the same length; these cases change the length itself.
    ['a salt one character short', { kdf_salt: base64Of(16, 11).slice(1) }],
    ['a salt one character long', { kdf_salt: `${base64Of(16, 11)}A` }],
    ['a salt that is not a string', { kdf_salt: 12345 }],
    ['a password IV of 9 bytes', { password_iv: base64Of(9, 12) }],
    ['a password IV of 13 bytes', { password_iv: base64Of(13, 12) }],
    ['an unwrapped 32-byte key', { password_key: base64Of(32, 13) }],
    [
      'a password key one character long',
      { password_key: `${base64Of(48, 13)}A` },
    ],
    ['a recovery salt of 15 bytes', { recovery_salt: base64Of(15, 21) }],
    ['a recovery IV of 16 bytes', { recovery_iv: base64Of(16, 22) }],
    [
      'a recovery key one character short',
      { recovery_key: base64Of(48, 23).slice(1) },
    ],
    ['an empty recovery key', { recovery_key: '' }],
  ])('refuses %s', async (_label, overrides) => {
    await assertFails(createAsAlice(keyData(ALICE, overrides)))
  })

  it.each(Object.keys(keyData(ALICE)))(
    'refuses a key without %s',
    async field => {
      await assertFails(createAsAlice(without(keyData(ALICE), field)))
    },
  )
})

describe('keys: update and delete', () => {
  it('lets the owner rewrap the key after a password change', async () => {
    await seedKey(ALICE)

    await assertSucceeds(
      updateDoc(doc(asAlice(), 'keys', ALICE), {
        kdf_iterations: 900000,
        kdf_salt: base64Of(16, 101),
        password_iv: base64Of(12, 102),
        password_key: base64Of(48, 103),
      }),
    )
  })

  it('lets the owner replace the recovery key', async () => {
    await seedKey(ALICE)

    await assertSucceeds(
      updateDoc(doc(asAlice(), 'keys', ALICE), {
        recovery_salt: base64Of(16, 111),
        recovery_iv: base64Of(12, 112),
        recovery_key: base64Of(48, 113),
      }),
    )
  })

  it('refuses handing the key to another user', async () => {
    await seedKey(ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'keys', ALICE), { owner_uid: BOB }),
    )
  })

  it.each([
    ['an unknown field', { note: 'old password was hunter2' }],
    ['too few iterations', { kdf_iterations: 1000 }],
    ['an unwrapped 32-byte key', { password_key: base64Of(32, 7) }],
  ])('refuses an update that leaves %s', async (_label, changes) => {
    await seedKey(ALICE)

    await assertFails(updateDoc(doc(asAlice(), 'keys', ALICE), changes))
  })

  it('refuses another user or a guest overwriting or deleting it', async () => {
    await seedKey(ALICE)

    await assertFails(
      updateDoc(doc(asBob(), 'keys', ALICE), { password_key: base64Of(48, 9) }),
    )
    await assertFails(setDoc(doc(asBob(), 'keys', ALICE), keyData(ALICE)))
    await assertFails(deleteDoc(doc(asBob(), 'keys', ALICE)))
    await assertFails(deleteDoc(doc(asGuest(), 'keys', ALICE)))
  })

  it('lets the owner delete', async () => {
    await seedKey(ALICE)

    await assertSucceeds(deleteDoc(doc(asAlice(), 'keys', ALICE)))
  })
})
