import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { buildEnv, features, withPolicy } from './csp.mjs'

/**
 * The second half of `npm run build`: every page in `out/` gets its
 * Content-Security-Policy (see csp.mjs). Fails the build when there is
 * nothing to protect, which means the export went somewhere else.
 */

const root = process.cwd()
const out = join(root, 'out')

const pages = readdirSync(out, { recursive: true })
  .filter(path => path.endsWith('.html'))
  .map(path => join(out, path))

if (pages.length === 0) {
  throw new Error(`no pages in ${out}: run next build first`)
}

const env = buildEnv(root)
const { emulators, authDomain, appCheck } = features(env)

pages.forEach(path => {
  writeFileSync(path, withPolicy(readFileSync(path, 'utf8'), env))
})

process.stdout.write(
  `CSP added to ${pages.length} pages (auth domain: ${authDomain || 'none'}, ` +
    `emulators: ${emulators ? 'on' : 'off'}, App Check: ${appCheck ? 'on' : 'off'})\n`,
)
