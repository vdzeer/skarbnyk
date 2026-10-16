const { assertFails, assertSucceeds } = require('@firebase/rules-unit-testing')
const {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} = require('firebase/firestore')

const {
  ALICE,
  ALICE_TOKEN,
  OTHER_SIGN_INS,
  incomeData,
  keyData,
  markData,
  profileData,
  reminderData,
  setupTestEnv,
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

const seed = (path, data) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(doc(context.firestore(), path), data),
  )

// Alice, signed in with Google as in the other suites, or some other way with
// the rest of her token unchanged.
const asAlice = () =>
  testEnv.authenticatedContext(ALICE, ALICE_TOKEN).firestore()
const asAliceVia = signIn =>
  testEnv
    .authenticatedContext(ALICE, { ...ALICE_TOKEN, firebase: signIn })
    .firestore()

describe('sign-in providers', () => {
  it('lets a Google sign-in in', async () => {
    await assertSucceeds(
      setDoc(doc(asAlice(), 'incomes', 'new'), incomeData(ALICE)),
    )
  })

  describe.each(
    OTHER_SIGN_INS.map(signIn => [signIn.sign_in_provider, signIn]),
  )('%s', (_provider, signIn) => {
    it('cannot read even its own documents', async () => {
      await seed(`keys/${ALICE}`, keyData(ALICE))
      await seed(`profiles/${ALICE}`, profileData(ALICE))
      await seed('incomes/alice-income', incomeData(ALICE))

      const db = asAliceVia(signIn)
      await assertFails(getDoc(doc(db, 'keys', ALICE)))
      await assertFails(getDoc(doc(db, 'profiles', ALICE)))
      await assertFails(
        getDocs(
          query(collection(db, 'incomes'), where('owner_uid', '==', ALICE)),
        ),
      )
    })

    it('cannot write anything', async () => {
      const db = asAliceVia(signIn)
      await assertFails(setDoc(doc(db, 'keys', ALICE), keyData(ALICE)))
      await assertFails(setDoc(doc(db, 'incomes', 'new'), incomeData(ALICE)))
      await assertFails(setDoc(doc(db, 'marks', 'new'), markData(ALICE)))
      await assertFails(
        setDoc(doc(db, 'reminders', ALICE), reminderData(ALICE)),
      )
    })
  })
})
