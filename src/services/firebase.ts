import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  ReCaptchaEnterpriseProvider,
  initializeAppCheck,
} from 'firebase/app-check'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import {
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  terminate,
  waitForPendingWrites,
  type Firestore,
} from 'firebase/firestore'

// The one file that creates Firebase clients. Everything else asks for them
// here, so emulator wiring and cache settings cannot drift between callers.
// The hosts these clients talk to are allowed in the page's
// Content-Security-Policy, which `scripts/csp.mjs` writes from the same env.

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export const USE_EMULATORS = process.env.NEXT_PUBLIC_USE_EMULATORS === '1'

/**
 * App Check with reCAPTCHA Enterprise, off unless a site key is set. Never on
 * the emulators, which do not check tokens. Enforcing it is a switch in the
 * Firebase console; the README says when.
 */
const APP_CHECK_SITE_KEY = process.env.NEXT_PUBLIC_APPCHECK_SITE_KEY ?? ''
const USE_APP_CHECK = APP_CHECK_SITE_KEY !== '' && !USE_EMULATORS

const EMULATOR_HOST = '127.0.0.1'
const AUTH_EMULATOR_PORT = 9099
const FIRESTORE_EMULATOR_PORT = 8080

type Clients = { auth: Auth; db: Firestore }

let clients: Clients | null = null

const createFirestore = (app: ReturnType<typeof getApp>) => {
  try {
    // The persistent cache is what lets a log written offline survive a
    // reload and reach the server later.
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    })
  } catch {
    // Already initialised (a hot reload re-evaluated this module).
    return getFirestore(app)
  }
}

/** Browser only: call from effects, event handlers and query functions. */
export const getFirebase = (): Clients => {
  if (clients) return clients

  const firstRun = getApps().length === 0
  const app = firstRun ? initializeApp(config) : getApp()
  // Before Auth and Firestore, so their first requests carry a token.
  if (USE_APP_CHECK && firstRun) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    })
  }
  const auth = getAuth(app)
  const db = createFirestore(app)

  if (USE_EMULATORS && firstRun) {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`, {
      disableWarnings: true,
    })
    connectFirestoreEmulator(db, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT)
  }

  clients = { auth, db }
  return clients
}

/**
 * Waits for writes still on their way to the server, but no longer than
 * `ms`: offline they would not arrive at all.
 */
export const settleWrites = async (ms: number) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      waitForPendingWrites(getFirebase().db),
      new Promise<void>(resolve => {
        timer = setTimeout(resolve, ms)
      }),
    ])
  } catch (error) {
    console.warn(error)
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Stops Firestore and deletes its offline cache in IndexedDB, which holds the
 * encrypted documents and the wrapped key record: enough to guess the
 * password offline. Firestore in other tabs stops too, since the database is
 * deleted under it. The clients cannot be used afterwards, so the caller
 * reloads the page.
 */
export const clearFirestoreCache = async () => {
  const { db } = getFirebase()
  await terminate(db)
  await clearIndexedDbPersistence(db)
}
