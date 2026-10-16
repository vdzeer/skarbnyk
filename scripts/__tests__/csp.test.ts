import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { buildEnv, inlineScriptHashes, policy, withPolicy } from '../csp.mjs'

const sha = (text: string) =>
  `sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}`

const PROD = {
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'example.firebaseapp.com',
  NEXT_PUBLIC_USE_EMULATORS: '0',
}

const directive = (text: string, name: string) =>
  text
    .split('; ')
    .find(part => part.startsWith(`${name} `))
    ?.split(' ')
    .slice(1)

const PAGE =
  '<!DOCTYPE html><html><head><meta charSet="utf-8"/>' +
  '<script src="/_next/a.js" async=""></script>' +
  '<script>window.a=1</script></head><body>' +
  '<script id="_R_">self.b=[]</script><script>window.a=1</script>' +
  '</body></html>'

describe('inlineScriptHashes', () => {
  it('hashes each inline script once and skips scripts with src', () => {
    expect(inlineScriptHashes(PAGE)).toEqual([
      sha('window.a=1'),
      sha('self.b=[]'),
    ])
  })
})

describe('policy', () => {
  const text = policy(PROD, ['sha256-abc'])

  it('allows inline scripts only by hash', () => {
    const scripts = directive(text, 'script-src')
    expect(scripts).toContain("'sha256-abc'")
    expect(scripts).not.toContain("'unsafe-inline'")
    expect(scripts).not.toContain("'unsafe-eval'")
  })

  it('names every host the app talks to, and no wildcard', () => {
    expect(directive(text, 'connect-src')).toEqual([
      "'self'",
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://firestore.googleapis.com',
      'https://bank.gov.ua',
    ])
    expect(directive(text, 'frame-src')).toEqual([
      'https://example.firebaseapp.com',
    ])
    expect(text).not.toContain('*')
  })

  it('locks down the rest', () => {
    expect(directive(text, 'default-src')).toEqual(["'self'"])
    expect(directive(text, 'object-src')).toEqual(["'none'"])
    expect(directive(text, 'base-uri')).toEqual(["'self'"])
    expect(directive(text, 'form-action')).toEqual(["'self'"])
  })

  it('adds reCAPTCHA and App Check only with a site key', () => {
    expect(text).not.toContain('recaptcha')
    const withKey = policy(
      { ...PROD, NEXT_PUBLIC_APPCHECK_SITE_KEY: 'key' },
      [],
    )
    expect(directive(withKey, 'script-src')).toContain(
      'https://www.google.com/recaptcha/',
    )
    expect(directive(withKey, 'frame-src')).toContain(
      'https://www.google.com/recaptcha/',
    )
    expect(directive(withKey, 'connect-src')).toEqual(
      expect.arrayContaining([
        'https://content-firebaseappcheck.googleapis.com',
        'https://www.google.com/recaptcha/',
      ]),
    )
  })

  it('adds the emulators, without App Check, when they are on', () => {
    const local = policy(
      {
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-skarbnyk.firebaseapp.com',
        NEXT_PUBLIC_USE_EMULATORS: '1',
        NEXT_PUBLIC_APPCHECK_SITE_KEY: 'key',
      },
      [],
    )
    expect(directive(local, 'connect-src')).toEqual(
      expect.arrayContaining([
        'http://127.0.0.1:9099',
        'http://127.0.0.1:8080',
      ]),
    )
    expect(directive(local, 'frame-src')).toContain('http://127.0.0.1:9099')
    expect(local).not.toContain('recaptcha')
  })

  it('frames nothing without an auth domain and refuses a strange one', () => {
    expect(directive(policy({}, []), 'frame-src')).toEqual(["'none'"])
    expect(() =>
      policy({ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'a.com; script-src *' }, []),
    ).toThrow()
  })
})

describe('withPolicy', () => {
  it('puts the policy right after the charset, with the page hashes', () => {
    const page = withPolicy(PAGE, PROD)
    expect(page).toMatch(
      /^<!DOCTYPE html><html><head><meta charSet="utf-8"\/><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src [^"]+"\/><script src=/,
    )
    expect(page).toContain(`'${sha('window.a=1')}'`)
    expect(page).toContain(`'${sha('self.b=[]')}'`)
  })

  it('replaces an earlier policy instead of adding a second one', () => {
    const twice = withPolicy(withPolicy(PAGE, PROD), PROD)
    expect(twice.match(/Content-Security-Policy/g)).toHaveLength(1)
  })

  it('refuses a page without a charset', () => {
    expect(() => withPolicy('<html><head></head></html>', PROD)).toThrow()
  })
})

describe('buildEnv', () => {
  it('reads the env files in the order next build does', () => {
    const dir = mkdtempSync(join(tmpdir(), 'csp-'))
    writeFileSync(join(dir, '.env'), 'A=env\nB=env\nC=env\n')
    writeFileSync(join(dir, '.env.production'), 'A=production\nB=production\n')
    writeFileSync(join(dir, '.env.local'), 'A=local\n')
    const env = buildEnv(dir, { C: 'process' })
    expect(env).toMatchObject({ A: 'local', B: 'production', C: 'process' })
  })
})
