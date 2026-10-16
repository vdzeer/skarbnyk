const { assertFails, assertSucceeds } = require('@firebase/rules-unit-testing')
const {
  addDoc,
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
  markData,
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

const seedMark = (id, ownerUid, overrides) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(
      doc(context.firestore(), 'marks', id),
      markData(ownerUid, overrides),
    ),
  )

const asAlice = () => testEnv.authenticatedContext(ALICE).firestore()
const asBob = () => testEnv.authenticatedContext(BOB).firestore()
const asGuest = () => testEnv.unauthenticatedContext().firestore()

const createAsAlice = data => setDoc(doc(asAlice(), 'marks', 'new-mark'), data)

describe('marks: reads', () => {
  it('lets the owner read one and list their own', async () => {
    await seedMark('alice-mark', ALICE)
    await seedMark('bob-mark', BOB)

    await assertSucceeds(getDoc(doc(asAlice(), 'marks', 'alice-mark')))
    await assertSucceeds(
      getDocs(
        query(collection(asAlice(), 'marks'), where('owner_uid', '==', ALICE)),
      ),
    )
  })

  it('refuses another user and a signed-out reader', async () => {
    await seedMark('alice-mark', ALICE)

    await assertFails(getDoc(doc(asBob(), 'marks', 'alice-mark')))
    await assertFails(getDoc(doc(asGuest(), 'marks', 'alice-mark')))
  })

  it('refuses a list query that is not scoped to the caller', async () => {
    await seedMark('alice-mark', ALICE)

    await assertFails(getDocs(collection(asAlice(), 'marks')))
    await assertFails(
      getDocs(
        query(collection(asBob(), 'marks'), where('owner_uid', '==', ALICE)),
      ),
    )
    await assertFails(
      getDocs(
        query(collection(asGuest(), 'marks'), where('owner_uid', '==', ALICE)),
      ),
    )
  })
})

describe('marks: create', () => {
  it.each([
    ['the shape the app writes', {}],
    ['the longest ciphertext allowed', { ct: 'A'.repeat(2000) }],
  ])('accepts %s', async (_label, overrides) => {
    await assertSucceeds(createAsAlice(markData(ALICE, overrides)))
  })

  it('accepts a random document id', async () => {
    await assertSucceeds(
      addDoc(collection(asAlice(), 'marks'), markData(ALICE)),
    )
  })

  it('refuses a mark owned by someone else', async () => {
    await assertFails(createAsAlice(markData(BOB)))
  })

  it('refuses a signed-out writer', async () => {
    await assertFails(
      setDoc(doc(asGuest(), 'marks', 'new-mark'), markData(ALICE)),
    )
  })

  it.each([
    ['a plaintext status next to the ciphertext', { status: 'paid' }],
    ['a version from the future', { v: 2 }],
    ['an IV one character short', { iv: base64Of(12, 1).slice(1) }],
    ['an IV of 13 bytes', { iv: base64Of(13, 1) }],
    ['an empty ciphertext', { ct: '' }],
    ['a ciphertext over 2000 characters', { ct: 'A'.repeat(2001) }],
    ['a ciphertext that is not a string', { ct: true }],
  ])('refuses %s', async (_label, overrides) => {
    await assertFails(createAsAlice(markData(ALICE, overrides)))
  })

  it.each(Object.keys(markData(ALICE)))(
    'refuses a mark without %s',
    async field => {
      await assertFails(createAsAlice(without(markData(ALICE), field)))
    },
  )
})

describe('marks: update and delete', () => {
  it('lets the owner save an edited mark', async () => {
    await seedMark('alice-mark', ALICE)

    await assertSucceeds(
      updateDoc(doc(asAlice(), 'marks', 'alice-mark'), {
        iv: base64Of(12, 401),
        ct: base64Of(96, 302),
      }),
    )
  })

  it('refuses handing the mark to another user', async () => {
    await seedMark('alice-mark', ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'marks', 'alice-mark'), { owner_uid: BOB }),
    )
  })

  it.each([
    ['an unknown field', { status: 'filed' }],
    ['a ciphertext over 2000 characters', { ct: 'A'.repeat(2001) }],
  ])('refuses an update that leaves %s', async (_label, changes) => {
    await seedMark('alice-mark', ALICE)

    await assertFails(updateDoc(doc(asAlice(), 'marks', 'alice-mark'), changes))
  })

  it('refuses another user changing, taking or deleting it', async () => {
    await seedMark('alice-mark', ALICE)

    await assertFails(
      updateDoc(doc(asBob(), 'marks', 'alice-mark'), {
        ct: base64Of(30, 9),
      }),
    )
    await assertFails(
      setDoc(doc(asBob(), 'marks', 'alice-mark'), markData(BOB)),
    )
    await assertFails(deleteDoc(doc(asBob(), 'marks', 'alice-mark')))
    await assertFails(deleteDoc(doc(asGuest(), 'marks', 'alice-mark')))
  })

  it('lets the owner delete', async () => {
    await seedMark('alice-mark', ALICE)

    await assertSucceeds(deleteDoc(doc(asAlice(), 'marks', 'alice-mark')))
  })
})
