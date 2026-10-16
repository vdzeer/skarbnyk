const { assertFails, assertSucceeds } = require('@firebase/rules-unit-testing')
const {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} = require('firebase/firestore')

const {
  ALICE,
  ALICE_TOKEN,
  BOB,
  BOB_TOKEN,
  reminderData,
  setupTestEnv,
  without,
} = require('../helpers')

// The one plaintext collection. The scheduled function emails whatever
// address is stored here, so the rules are what keep that address the
// caller's own, verified one.

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

const seedReminder = (uid, overrides) =>
  testEnv.withSecurityRulesDisabled(context =>
    setDoc(
      doc(context.firestore(), 'reminders', uid),
      reminderData(uid, overrides),
    ),
  )

const asAlice = () =>
  testEnv.authenticatedContext(ALICE, ALICE_TOKEN).firestore()
const asBob = () => testEnv.authenticatedContext(BOB, BOB_TOKEN).firestore()
const asGuest = () => testEnv.unauthenticatedContext().firestore()

// Alice's address, before she has clicked the confirmation link.
const asAliceUnverified = () =>
  testEnv
    .authenticatedContext(ALICE, { ...ALICE_TOKEN, email_verified: false })
    .firestore()

// A token with no email claim at all.
const asAliceWithoutEmail = () =>
  testEnv.authenticatedContext(ALICE).firestore()

const createAsAlice = data => setDoc(doc(asAlice(), 'reminders', ALICE), data)

describe('reminders: reads', () => {
  it('lets the owner read their settings', async () => {
    await seedReminder(ALICE)

    await assertSucceeds(getDoc(doc(asAlice(), 'reminders', ALICE)))
  })

  it('lets the owner ask before switching reminders on', async () => {
    await assertSucceeds(getDoc(doc(asAlice(), 'reminders', ALICE)))
  })

  it('refuses another user, a guest and a list of everyone', async () => {
    await seedReminder(ALICE)

    await assertFails(getDoc(doc(asBob(), 'reminders', ALICE)))
    await assertFails(getDoc(doc(asGuest(), 'reminders', ALICE)))
    await assertFails(getDocs(collection(asAlice(), 'reminders')))
  })
})

describe('reminders: create', () => {
  it.each([
    ['the shape the app writes', {}],
    ['reminders saved switched off', { enabled: false }],
    ['group 1 with one offset', { group: 1, offsets: [14] }],
    ['group 2 on the day itself', { group: 2, offsets: [0] }],
    ['three offsets', { offsets: [0, 3, 14] }],
  ])('accepts %s', async (_label, overrides) => {
    await assertSucceeds(createAsAlice(reminderData(ALICE, overrides)))
  })

  it('refuses a document id that is not the uid', async () => {
    await assertFails(
      setDoc(doc(asAlice(), 'reminders', 'mine'), reminderData(ALICE)),
    )
  })

  it('refuses writing reminders into another user', async () => {
    await assertFails(
      setDoc(doc(asAlice(), 'reminders', BOB), reminderData(BOB)),
    )
    await assertFails(
      setDoc(doc(asAlice(), 'reminders', BOB), reminderData(ALICE)),
    )
    await assertFails(
      createAsAlice(reminderData(BOB, { email: ALICE_TOKEN.email })),
    )
  })

  it('refuses a signed-out writer', async () => {
    await assertFails(
      setDoc(doc(asGuest(), 'reminders', ALICE), reminderData(ALICE)),
    )
  })

  it('refuses an address the caller has not verified', async () => {
    await assertFails(
      setDoc(doc(asAliceUnverified(), 'reminders', ALICE), reminderData(ALICE)),
    )
  })

  it('refuses a caller whose account has no email', async () => {
    await assertFails(
      setDoc(
        doc(asAliceWithoutEmail(), 'reminders', ALICE),
        reminderData(ALICE),
      ),
    )
  })

  it.each([
    ['an unknown field', { amount_kop: 1250000 }],
    ["someone else's address", { email: BOB_TOKEN.email }],
    ['a stranger as a second address', { email: 'alice@example.com, x@y.z' }],
    ['an empty address', { email: '' }],
    ['a non-boolean enabled flag', { enabled: 'yes' }],
    ['group 4', { group: 4 }],
    ['group 0', { group: 0 }],
    ['a group as a string', { group: '3' }],
    ['a group that is not a whole number', { group: 2.5 }],
    ['no offsets', { offsets: [] }],
    ['an offset the app does not offer', { offsets: [2] }],
    ['a negative offset', { offsets: [-1] }],
    ['four offsets', { offsets: [0, 1, 3, 7] }],
    ['an offset as a string', { offsets: ['7'] }],
    ['offsets that are not a list', { offsets: 7 }],
    ['updated_at as a client number', { updated_at: 1760000000000 }],
    ['updated_at as a client date', { updated_at: new Date('2026-10-01') }],
    ['updated_at as a string', { updated_at: '2026-10-14T09:00:00Z' }],
  ])('refuses %s', async (_label, overrides) => {
    await assertFails(createAsAlice(reminderData(ALICE, overrides)))
  })

  it.each(Object.keys(reminderData(ALICE)))(
    'refuses reminders without %s',
    async field => {
      await assertFails(createAsAlice(without(reminderData(ALICE), field)))
    },
  )
})

describe('reminders: update and delete', () => {
  it('lets the owner switch reminders off', async () => {
    await seedReminder(ALICE)

    await assertSucceeds(
      updateDoc(doc(asAlice(), 'reminders', ALICE), {
        enabled: false,
        updated_at: serverTimestamp(),
      }),
    )
  })

  it('lets the owner change the group and the offsets', async () => {
    await seedReminder(ALICE)

    await assertSucceeds(
      updateDoc(doc(asAlice(), 'reminders', ALICE), {
        group: 2,
        offsets: [0, 3, 7],
        updated_at: serverTimestamp(),
      }),
    )
  })

  it('refuses an update that does not stamp updated_at again', async () => {
    await seedReminder(ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'reminders', ALICE), { enabled: false }),
    )
  })

  it('refuses handing the reminders to another user', async () => {
    await seedReminder(ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'reminders', ALICE), {
        owner_uid: BOB,
        updated_at: serverTimestamp(),
      }),
    )
  })

  it('refuses pointing the reminders at another address', async () => {
    await seedReminder(ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'reminders', ALICE), {
        email: 'stranger@example.com',
        updated_at: serverTimestamp(),
      }),
    )
  })

  it('refuses an update from an unverified token', async () => {
    await seedReminder(ALICE)

    await assertFails(
      updateDoc(doc(asAliceUnverified(), 'reminders', ALICE), {
        enabled: false,
        updated_at: serverTimestamp(),
      }),
    )
  })

  it.each([
    ['an unknown field', { note: 'hello' }],
    ['group 4', { group: 4 }],
    ['four offsets', { offsets: [0, 1, 3, 7] }],
  ])('refuses an update that leaves %s', async (_label, changes) => {
    await seedReminder(ALICE)

    await assertFails(
      updateDoc(doc(asAlice(), 'reminders', ALICE), {
        ...changes,
        updated_at: serverTimestamp(),
      }),
    )
  })

  it('refuses another user or a guest changing or deleting them', async () => {
    await seedReminder(ALICE)

    await assertFails(
      updateDoc(doc(asBob(), 'reminders', ALICE), {
        email: BOB_TOKEN.email,
        updated_at: serverTimestamp(),
      }),
    )
    await assertFails(
      setDoc(doc(asBob(), 'reminders', ALICE), reminderData(BOB)),
    )
    await assertFails(deleteDoc(doc(asBob(), 'reminders', ALICE)))
    await assertFails(deleteDoc(doc(asGuest(), 'reminders', ALICE)))
  })

  it('lets the owner delete', async () => {
    await seedReminder(ALICE)

    await assertSucceeds(deleteDoc(doc(asAlice(), 'reminders', ALICE)))
  })
})
