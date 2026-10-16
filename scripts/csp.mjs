import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnv } from 'node:util'

/**
 * The Content-Security-Policy of the exported pages. A static export has no
 * server to hand out nonces, and Next starts the app with inline scripts, so
 * each page gets a <meta> policy that allows exactly its own inline scripts
 * by their sha256 hashes and nothing inline besides. `frame-ancestors` cannot
 * live in a <meta>; it stays a header in firebase.json.
 *
 * The hosts are the ones the app really talks to. A new outside host (an
 * API, a script) has to be added here, or the browser blocks it.
 */

/** The env files `next build` reads; the first one that has a key wins. */
const ENV_FILES = [
  '.env.production.local',
  '.env.local',
  '.env.production',
  '.env',
]

/**
 * The env the build saw: the process first, then the files in order.
 * @param {string} dir
 * @param {Record<string, string | undefined>} [processEnv]
 * @returns {Record<string, string | undefined>}
 */
export const buildEnv = (dir, processEnv = process.env) =>
  Object.assign(
    {},
    ...ENV_FILES.filter(name => existsSync(join(dir, name)))
      .reverse()
      .map(name => parseEnv(readFileSync(join(dir, name), 'utf8'))),
    processEnv,
  )

/** src/services/firebase.ts: Auth and Firestore on the emulators. */
const EMULATOR_AUTH = 'http://127.0.0.1:9099'
const EMULATOR_FIRESTORE = 'http://127.0.0.1:8080'

/** Google sign-in: the popup's helper script and the Firebase APIs. */
const GOOGLE_SIGN_IN_SCRIPT = 'https://apis.google.com'
const FIREBASE_APIS = [
  'https://identitytoolkit.googleapis.com',
  'https://securetoken.googleapis.com',
  'https://firestore.googleapis.com',
]

/** The NBU rate of the day (src/services/nbu.ts). */
const NBU = 'https://bank.gov.ua'

/**
 * App Check with reCAPTCHA Enterprise: Google's script, its frame, and the
 * script's own requests back to google.com.
 */
const RECAPTCHA_SCRIPTS = [
  'https://www.google.com/recaptcha/',
  'https://www.gstatic.com/recaptcha/',
]
const RECAPTCHA_FRAMES = [
  'https://www.google.com/recaptcha/',
  'https://recaptcha.google.com/recaptcha/',
]
const RECAPTCHA_CONNECT = 'https://www.google.com/recaptcha/'
const APP_CHECK_API = 'https://content-firebaseappcheck.googleapis.com'

const HOST = /^[a-z0-9.-]+(:\d+)?$/i

/** What the app does with this env, in the same terms as firebase.ts. */
export const features = env => {
  const emulators = env.NEXT_PUBLIC_USE_EMULATORS === '1'
  const authDomain = env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? ''
  if (authDomain !== '' && !HOST.test(authDomain)) {
    throw new Error(
      `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is not a host: ${authDomain}`,
    )
  }
  return {
    emulators,
    authDomain,
    appCheck: (env.NEXT_PUBLIC_APPCHECK_SITE_KEY ?? '') !== '' && !emulators,
  }
}

/** `sha256-…` of every inline script of a page, in order, without repeats. */
export const inlineScriptHashes = html => [
  ...new Set(
    [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
      .filter(([, attributes]) => !/\ssrc=/i.test(attributes))
      .map(
        ([, , body]) =>
          `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`,
      ),
  ),
]

/** The policy for one page with these inline-script hashes. */
export const policy = (env, hashes) => {
  const { emulators, authDomain, appCheck } = features(env)
  const when = (condition, sources) => (condition ? sources : [])
  const directives = [
    ['default-src', ["'self'"]],
    [
      'script-src',
      [
        "'self'",
        ...hashes.map(hash => `'${hash}'`),
        GOOGLE_SIGN_IN_SCRIPT,
        ...when(appCheck, RECAPTCHA_SCRIPTS),
      ],
    ],
    // styled-components writes its rules at run time. Injected CSS still
    // cannot send anything out: images, fonts and requests stay limited.
    ['style-src', ["'self'", "'unsafe-inline'"]],
    ['img-src', ["'self'"]],
    ['font-src', ["'self'"]],
    [
      'connect-src',
      [
        "'self'",
        ...FIREBASE_APIS,
        NBU,
        ...when(appCheck, [APP_CHECK_API, RECAPTCHA_CONNECT]),
        ...when(emulators, [EMULATOR_AUTH, EMULATOR_FIRESTORE]),
      ],
    ],
    // The sign-in popup talks to the page through a frame on the auth domain.
    [
      'frame-src',
      [
        ...when(authDomain !== '', [`https://${authDomain}`]),
        ...when(appCheck, RECAPTCHA_FRAMES),
        ...when(emulators, [EMULATOR_AUTH]),
      ],
    ],
    ['object-src', ["'none'"]],
    ['base-uri', ["'self'"]],
    ['form-action', ["'self'"]],
  ]
  return directives
    .map(([name, sources]) =>
      [name, ...(sources.length > 0 ? sources : ["'none'"])].join(' '),
    )
    .join('; ')
}

const CSP_META = /<meta http-equiv="Content-Security-Policy"[^>]*>/gi
const CHARSET_META = /<meta charSet="utf-8"\s*\/?>/i

/**
 * The page with its policy as the first tag after the charset, so it covers
 * every script that follows. Running it again replaces the old policy.
 */
export const withPolicy = (html, env) => {
  const page = html.replace(CSP_META, '')
  if (!CHARSET_META.test(page)) {
    throw new Error('no <meta charset> to put the policy after')
  }
  const content = policy(env, inlineScriptHashes(page))
  return page.replace(
    CHARSET_META,
    tag =>
      `${tag}<meta http-equiv="Content-Security-Policy" content="${content}"/>`,
  )
}
