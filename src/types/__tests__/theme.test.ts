import { SETTINGS_STORAGE_KEY, THEME_SCRIPT } from '../theme'

/** Runs the head script the way a browser would, with a fake page. */
const run = (stored: string | null, broken = false) => {
  const dataset: Record<string, string> = {}
  const localStorage = {
    getItem: (key: string) => {
      if (broken) throw new Error('storage is blocked')
      return key === SETTINGS_STORAGE_KEY ? stored : null
    },
  }
  const document = { documentElement: { dataset } }

  new Function('localStorage', 'document', THEME_SCRIPT)(localStorage, document)
  return dataset.theme
}

const saved = (theme: unknown) =>
  JSON.stringify({ state: { locale: 'uk', theme }, version: 0 })

describe('the theme script', () => {
  it.each(['light', 'dark'])('puts a saved %s theme on the document', theme => {
    expect(run(saved(theme))).toBe(theme)
  })

  it('sets nothing for "system": the stylesheet follows the device', () => {
    expect(run(saved('system'))).toBeUndefined()
  })

  it('sets nothing on a first visit', () => {
    expect(run(null)).toBeUndefined()
  })

  it('ignores a value it does not know', () => {
    expect(run(saved('neon'))).toBeUndefined()
    expect(run(saved('"><script>'))).toBeUndefined()
  })

  it('survives broken or blocked storage without stopping the page', () => {
    expect(run('{not json')).toBeUndefined()
    expect(run(null, true)).toBeUndefined()
  })
})
