import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { ROUTES, TAB_ROUTES, activeTab } from '../routes'

const APP_DIR = join(__dirname, '..', '..', 'app')

describe('ROUTES', () => {
  it.each(Object.values(ROUTES))('%s has a page', route => {
    expect(existsSync(join(APP_DIR, route, 'page.tsx'))).toBe(true)
  })

  it('has four tabs, each a real route: a phone has room for no more', () => {
    expect(TAB_ROUTES).toHaveLength(4)
    expect(Object.values(ROUTES)).toEqual(
      expect.arrayContaining([...TAB_ROUTES]),
    )
  })
})

describe('activeTab', () => {
  it.each(TAB_ROUTES.map(route => [route]))('%s lights its own tab', route => {
    expect(activeTab(route)).toBe(route)
  })

  it('keeps the tab lit under a trailing slash', () => {
    expect(activeTab('/incomes/')).toBe(ROUTES.Incomes)
  })

  it('does not mistake a longer name for a section', () => {
    expect(activeTab('/incomesxyz')).toBe(ROUTES.Overview)
  })

  it('falls back to the overview for a path it does not know', () => {
    expect(activeTab('/nowhere')).toBe(ROUTES.Overview)
  })
})
