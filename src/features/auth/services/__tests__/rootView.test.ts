import { rootView } from '../rootView'

describe('rootView', () => {
  it('waits while nobody knows who is signed in', () => {
    expect(rootView('unknown', 'unknown')).toBe('splash')
  })

  it('asks to sign in, whatever the vault says', () => {
    expect(rootView('signed_out', 'unlocked')).toBe('signin')
  })

  it.each([
    ['unknown', 'splash'],
    ['missing', 'setup'],
    ['locked', 'unlock'],
    ['error', 'vaultError'],
    ['unlocked', 'app'],
  ] as const)('signed in with a %s vault shows %s', (vault, view) => {
    expect(rootView('signed_in', vault)).toBe(view)
  })
})
