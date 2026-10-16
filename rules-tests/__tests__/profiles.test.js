const { assertFails, assertSucceeds } = require('@firebase/rules-unit-testing')
const {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} = require('firebase/firestore')

const {
  ALICE,
  BOB,
  base64Of,
  profileData,
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

const seedProfile = (uid, overrides) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(
      doc(context.firestore(), 'profiles', uid),
      profileData(uid, overrides),
    ),
  )

const asAlice = () => testEnv.authenticatedContext(ALICE).firestore()
const asBob = () => testEnv.authenticatedContext(BOB).firestore()
const asGuest = () => testEnv.unauthenticatedContext().firestore()

const createAsAlice = data => setDoc(doc(asAlice(), 'profiles', ALICE), data)

describe('profiles: reads', () => {
  it('lets the owner read their profile', async () => {
    await seedProfile(ALICE)

    await assertSucceeds(getDoc(doc(asAlice(), 'profiles', ALICE)))
  })

  it('lets the owner ask for a profile that does not exist yet', async () => {
    await assertSucceeds(getDoc(doc(asAlice(), 'profiles', ALICE)))
  })

  it('refuses another user, a guest and a list of everyone', async () => {
    await seedProfile(ALICE)

    await assertFails(getDoc(doc(asBob(), 'profiles', ALICE)))
    await assertFails(getDoc(doc(asGuest(), 'profiles', ALICE)))
    await assertFails(getDocs(collection(asAlice(), 'profiles')))
  })
})

describe('profiles: create', () => {
  it.each([
    ['the shape the app writes', {}],
    ['the longest ciphertext allowed', { ct: 'A'.repeat(40000) }],
    ['a one-character ciphertext', { ct: 'A' }],
  ])('accepts %s', async (_label, overrides) => {
    await assertSucceeds(createAsAlice(profileData(ALICE, overrides)))
  })

  it('refuses a document id that is not the uid', async () => {
    await assertFails(
      setDoc(doc(asAlice(), 'profiles', 'settings'), profileData(ALICE)),
    )
  })

  it('refuses writing a profile into another user', async () => {
    await assertFails(setDoc(doc(asAlice(), 'profiles', BOB), profileData(BOB)))
    await assertFails(
      setDoc(doc(asAlice(), 'profiles', BOB), profileData(ALICE)),
    )
    await assertFails(createAsAlice(profileData(BOB)))
  })

  it('refuses a signed-out writer', async () => {
    await assertFails(
      setDoc(doc(asGuest(), 'profiles', ALICE), profileData(ALICE)),
    )
  })

  it.each([
    ['a plaintext field next to the ciphertext', { group: 3 }],
    ['a version from the future', { v: 2 }],
    ['a version as a string', { v: '1' }],
    ['an IV of 9 bytes', { iv: base64Of(9, 1) }],
    ['an IV of 13 bytes', { iv: base64Of(13, 1) }],
    ['an IV that is not a string', { iv: 7 }],
    ['an empty ciphertext', { ct: '' }],
    ['a ciphertext over 40000 characters', { ct: 'A'.repeat(40001) }],
    ['a ciphertext that is not a string', { ct: { group: 3 } }],
  ])('refuses %s', async (_label, overrides) => {
    await assertFails(createAsAlice(profileData(ALICE, overrides)))
  })

  it.each(Object.keys(profileData(ALICE)))(
    'refuses a profile without %s',
    async field => {
      await assertFails(createAsAlice(without(profileData(ALICE), field)))
    },
  )
})

describe('profiles: update and delete', () => {
  it('lets the owner save new settings', async () => {
    await seedProfile(ALICE)

    await assertSucceeds(
      updateDoc(doc(asAlice(), 'profiles', ALICE), {
        iv: base64Of(12, 201),
        ct: base64Of(1200, 202),
      }),
    )
  })

  it('refuses handing the profile to another user', async () => {
    await seedProfile(ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'profiles', ALICE), { owner_uid: BOB }),
    )
  })

  it.each([
    ['an unknown field', { group: 3 }],
    ['an empty ciphertext', { ct: '' }],
    ['a version from the future', { v: 2 }],
  ])('refuses an update that leaves %s', async (_label, changes) => {
    await seedProfile(ALICE)

    await assertFails(updateDoc(doc(asAlice(), 'profiles', ALICE), changes))
  })

  it('refuses another user or a guest changing or deleting it', async () => {
    await seedProfile(ALICE)

    await assertFails(
      updateDoc(doc(asBob(), 'profiles', ALICE), { ct: base64Of(30, 9) }),
    )
    await assertFails(deleteDoc(doc(asBob(), 'profiles', ALICE)))
    await assertFails(deleteDoc(doc(asGuest(), 'profiles', ALICE)))
  })

  it('lets the owner delete', async () => {
    await seedProfile(ALICE)

    await assertSucceeds(deleteDoc(doc(asAlice(), 'profiles', ALICE)))
  })
})
