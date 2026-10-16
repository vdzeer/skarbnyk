import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// `src/core` is the part that later moves into a Cloud Function and the
// mobile app. It can only do that while it depends on nothing but itself.

const CORE_DIR = join(__dirname, '..')

const sourceFiles = readdirSync(CORE_DIR).filter(name => name.endsWith('.ts'))

const importsOf = (file: string) =>
  [
    ...readFileSync(join(CORE_DIR, file), 'utf8').matchAll(/from '([^']+)'/g),
  ].map(match => match[1])

describe('src/core', () => {
  it('has source files to check', () => {
    expect(sourceFiles.length).toBeGreaterThanOrEqual(8)
  })

  it.each(sourceFiles)('%s imports only from src/core', file => {
    const outside = importsOf(file).filter(source => !source.startsWith('./'))

    expect(outside).toEqual([])
  })

  it('reads the clock nowhere: time always comes in as an argument', () => {
    const offenders = sourceFiles.filter(file =>
      /Date\.now\(|new Date\(\)/.test(
        readFileSync(join(CORE_DIR, file), 'utf8'),
      ),
    )

    expect(offenders).toEqual([])
  })
})
