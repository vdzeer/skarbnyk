const { assertFails } = require('@firebase/rules-unit-testing')
const { doc, getDoc, setDoc } = require('firebase/firestore')

const {
  ALICE,
  ALICE_TOKEN,
  incomeData,
  keyData,
  profileData,
  setupTestEnv,
} = require('../helpers')

// The catch-all `match /{document=**}` at the bottom of the rules file. A
// collection nobody wrote a rule for is closed, so adding one to the app is a
// deliberate act rather than an accident.

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

const asAlice = () =>
  testEnv.authenticatedContext(ALICE, ALICE_TOKEN).firestore()

describe('collections with no rule of their own', () => {
  it.each([['users'], ['settings'], ['deadlines'], ['mail']])(
    'refuses reads and writes on %s',
    async collectionId => {
      await assertFails(getDoc(doc(asAlice(), collectionId, ALICE)))
      await assertFails(
        setDoc(doc(asAlice(), collectionId, ALICE), { owner_uid: ALICE }),
      )
    },
  )
})

describe('subcollections under documents the user owns', () => {
  it.each([
    ['keys', ALICE, keyData],
    ['profiles', ALICE, profileData],
    ['incomes', 'alice-income', incomeData],
  ])('refuses reads and writes under %s', async (parent, parentId, build) => {
    await testEnv.withSecurityRulesDisabled(context =>
      setDoc(doc(context.firestore(), parent, parentId), build(ALICE)),
    )

    const child = doc(asAlice(), parent, parentId, 'history', 'entry-1')

    await assertFails(getDoc(child))
    await assertFails(setDoc(child, build(ALICE)))
  })
})
