const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')

const { initializeTestEnvironment } = require('@firebase/rules-unit-testing')
const { serverTimestamp } = require('firebase/firestore')

// A `demo-` prefixed id keeps firebase-tools in demo mode: no credentials, and
// nothing can reach the real `skarbnyk` project by accident.
const PROJECT_ID = 'demo-skarbnyk'

const ALICE = 'alice-uid'
const BOB = 'bob-uid'

// The claims a Google sign-in puts on the ID token. Only `reminders` reads
// them: its `email` must be the caller's own, verified address.
const ALICE_TOKEN = { email: 'alice@example.com', email_verified: true }
const BOB_TOKEN = { email: 'bob@example.com', email_verified: true }
const TOKENS = { [ALICE]: ALICE_TOKEN, [BOB]: BOB_TOKEN }

// The `firebase` claim of a Google sign-in, and of the providers the app does
// not offer.
const GOOGLE_SIGN_IN = { sign_in_provider: 'google.com', identities: {} }
const OTHER_SIGN_INS = ['anonymous', 'password', 'custom', 'phone'].map(
  provider => ({ sign_in_provider: provider, identities: {} }),
)

// Resolved from this file rather than `process.cwd()` so the suite reads the
// same `firestore.rules` the emulator and `firebase deploy` use, whichever
// directory jest was started from.
const RULES_PATH = resolve(__dirname, '..', 'firestore.rules')

/**
 * `initializeTestEnvironment` uploads the rules file, so a syntax error in
 * `firestore.rules` fails here rather than silently loading — starting the
 * emulator is not a syntax gate, this is.
 */
const setupTestEnv = async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync(RULES_PATH, 'utf8') },
  })
  // Test users sign in with Google, as in the app; the rules refuse any other
  // provider. A test can still pass its own `firebase` claim to check that.
  const authenticatedContext = testEnv.authenticatedContext.bind(testEnv)
  testEnv.authenticatedContext = (uid, token = {}) =>
    authenticatedContext(uid, { firebase: GOOGLE_SIGN_IN, ...token })
  return testEnv
}

// Base64 of `count` made-up bytes. The rules check exact sizes because every
// field is base64 of a known number of bytes, so the fixtures are real base64
// of those byte counts: 16 bytes are 24 characters, 12 are 16, 48 are 64.
const base64Of = (count, seed) =>
  Buffer.from(
    Array.from({ length: count }, (_, index) => (seed + index * 73) % 256),
  ).toString('base64')

// What `src/services/crypto` writes on first sign-in: a 16-byte PBKDF2 salt,
// 12-byte GCM IVs, and the 32-byte data key plus its 16-byte tag, wrapped
// once by the password and once by the recovery key.
const keyData = (ownerUid, overrides = {}) => ({
  owner_uid: ownerUid,
  v: 1,
  kdf_iterations: 600000,
  kdf_salt: base64Of(16, 11),
  password_iv: base64Of(12, 12),
  password_key: base64Of(48, 13),
  recovery_salt: base64Of(16, 21),
  recovery_iv: base64Of(12, 22),
  recovery_key: base64Of(48, 23),
  ...overrides,
})

// The envelope `profiles`, `incomes` and `marks` share. `ctBytes` is a
// plausible ciphertext length for the collection's model.
const sealedData =
  (ctBytes, seed) =>
  (ownerUid, overrides = {}) => ({
    owner_uid: ownerUid,
    v: 1,
    iv: base64Of(12, seed),
    ct: base64Of(ctBytes, seed + 1),
    ...overrides,
  })

const profileData = sealedData(900, 31)
const incomeData = sealedData(150, 41)
const markData = sealedData(90, 51)

// The one plaintext document. `updated_at` is `serverTimestamp()`, as the app
// writes it: the rules accept nothing else.
const reminderData = (ownerUid, overrides = {}) => ({
  owner_uid: ownerUid,
  email: TOKENS[ownerUid].email,
  enabled: true,
  group: 3,
  offsets: [1, 7],
  updated_at: serverTimestamp(),
  ...overrides,
})

// A copy of `data` with one field left out. Overrides cannot express a
// missing field: the SDK refuses `undefined` before the rules ever see it.
const without = (data, field) =>
  Object.fromEntries(Object.entries(data).filter(([key]) => key !== field))

module.exports = {
  ALICE,
  ALICE_TOKEN,
  BOB,
  BOB_TOKEN,
  OTHER_SIGN_INS,
  PROJECT_ID,
  RULES_PATH,
  base64Of,
  incomeData,
  keyData,
  markData,
  profileData,
  reminderData,
  setupTestEnv,
  without,
}
