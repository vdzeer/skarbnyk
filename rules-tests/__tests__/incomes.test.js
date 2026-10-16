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
  incomeData,
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

const seedIncome = (id, ownerUid, overrides) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(
      doc(context.firestore(), 'incomes', id),
      incomeData(ownerUid, overrides),
    ),
  )

const asAlice = () => testEnv.authenticatedContext(ALICE).firestore()
const asBob = () => testEnv.authenticatedContext(BOB).firestore()
const asGuest = () => testEnv.unauthenticatedContext().firestore()

const createAsAlice = data =>
  setDoc(doc(asAlice(), 'incomes', 'new-income'), data)

describe('incomes: reads', () => {
  it('lets the owner read one and list their own', async () => {
    await seedIncome('alice-income', ALICE)
    await seedIncome('bob-income', BOB)

    await assertSucceeds(getDoc(doc(asAlice(), 'incomes', 'alice-income')))
    await assertSucceeds(
      getDocs(
        query(
          collection(asAlice(), 'incomes'),
          where('owner_uid', '==', ALICE),
        ),
      ),
    )
  })

  it('refuses another user and a signed-out reader', async () => {
    await seedIncome('alice-income', ALICE)

    await assertFails(getDoc(doc(asBob(), 'incomes', 'alice-income')))
    await assertFails(getDoc(doc(asGuest(), 'incomes', 'alice-income')))
  })

  it('refuses a list query that is not scoped to the caller', async () => {
    await seedIncome('alice-income', ALICE)

    await assertFails(getDocs(collection(asAlice(), 'incomes')))
    await assertFails(
      getDocs(
        query(collection(asBob(), 'incomes'), where('owner_uid', '==', ALICE)),
      ),
    )
    await assertFails(
      getDocs(
        query(
          collection(asGuest(), 'incomes'),
          where('owner_uid', '==', ALICE),
        ),
      ),
    )
  })
})

describe('incomes: create', () => {
  it.each([
    ['the shape the app writes', {}],
    ['the longest ciphertext allowed', { ct: 'A'.repeat(4000) }],
  ])('accepts %s', async (_label, overrides) => {
    await assertSucceeds(createAsAlice(incomeData(ALICE, overrides)))
  })

  it('accepts a random document id', async () => {
    await assertSucceeds(
      addDoc(collection(asAlice(), 'incomes'), incomeData(ALICE)),
    )
  })

  it('refuses an income owned by someone else', async () => {
    await assertFails(createAsAlice(incomeData(BOB)))
  })

  it('refuses a signed-out writer', async () => {
    await assertFails(
      setDoc(doc(asGuest(), 'incomes', 'new-income'), incomeData(ALICE)),
    )
  })

  it.each([
    ['a plaintext amount next to the ciphertext', { amount_kop: 1250000 }],
    ['a version from the future', { v: 2 }],
    ['an IV one character short', { iv: base64Of(12, 1).slice(1) }],
    ['an IV of 13 bytes', { iv: base64Of(13, 1) }],
    ['an empty ciphertext', { ct: '' }],
    ['a ciphertext over 4000 characters', { ct: 'A'.repeat(4001) }],
    ['a ciphertext that is not a string', { ct: 1250000 }],
  ])('refuses %s', async (_label, overrides) => {
    await assertFails(createAsAlice(incomeData(ALICE, overrides)))
  })

  it.each(Object.keys(incomeData(ALICE)))(
    'refuses an income without %s',
    async field => {
      await assertFails(createAsAlice(without(incomeData(ALICE), field)))
    },
  )
})

describe('incomes: update and delete', () => {
  it('lets the owner save an edited income', async () => {
    await seedIncome('alice-income', ALICE)

    await assertSucceeds(
      updateDoc(doc(asAlice(), 'incomes', 'alice-income'), {
        iv: base64Of(12, 301),
        ct: base64Of(160, 302),
      }),
    )
  })

  it('refuses handing the income to another user', async () => {
    await seedIncome('alice-income', ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'incomes', 'alice-income'), { owner_uid: BOB }),
    )
  })

  it.each([
    ['an unknown field', { amount_kop: 1250000 }],
    ['a ciphertext over 4000 characters', { ct: 'A'.repeat(4001) }],
  ])('refuses an update that leaves %s', async (_label, changes) => {
    await seedIncome('alice-income', ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'incomes', 'alice-income'), changes),
    )
  })

  it('refuses another user changing, taking or deleting it', async () => {
    await seedIncome('alice-income', ALICE)

    await assertFails(
      updateDoc(doc(asBob(), 'incomes', 'alice-income'), {
        ct: base64Of(30, 9),
      }),
    )
    await assertFails(
      setDoc(doc(asBob(), 'incomes', 'alice-income'), incomeData(BOB)),
    )
    await assertFails(deleteDoc(doc(asBob(), 'incomes', 'alice-income')))
    await assertFails(deleteDoc(doc(asGuest(), 'incomes', 'alice-income')))
  })

  it('lets the owner delete', async () => {
    await seedIncome('alice-income', ALICE)

    await assertSucceeds(deleteDoc(doc(asAlice(), 'incomes', 'alice-income')))
  })
})
