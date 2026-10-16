import { sourceFiles, withoutComments } from './sourceFiles'

// Colours and sizes live in `themes/tokens.ts` and reach a component through
// the theme. A literal anywhere else is a value the next redesign will miss.

const TOKENS = 'themes/tokens.ts'

const styledFiles = sourceFiles(path => path.endsWith('styled.ts'))
const codeFiles = sourceFiles(
  path => /\.tsx?$/.test(path) && path !== TOKENS && !path.endsWith('.d.ts'),
)

const offenders = (
  files: typeof codeFiles,
  pattern: RegExp,
): Record<string, string[]> =>
  Object.fromEntries(
    files
      .map(file => [file.path, withoutComments(file.text).match(pattern) ?? []])
      .filter(([, found]) => found.length > 0),
  )

describe('raw values', () => {
  it('finds the files it is meant to check', () => {
    expect(styledFiles.length).toBeGreaterThanOrEqual(15)
    expect(codeFiles.length).toBeGreaterThanOrEqual(60)
  })

  it('has no hex colour outside the tokens', () => {
    expect(offenders(codeFiles, /#[0-9a-fA-F]{3,8}\b/g)).toEqual({})
  })

  it('has no rgb() or hsl() colour outside the tokens', () => {
    expect(offenders(codeFiles, /\b(rgba?|hsla?)\(/g)).toEqual({})
  })

  it('has no px value in a styled file', () => {
    expect(offenders(styledFiles, /\b\d*\.?\d+px\b/g)).toEqual({})
  })

  it('takes every font size from the text scale', () => {
    // Any `font-size` whose value does not read `theme.text`.
    expect(
      offenders(styledFiles, /font-size\s*:(?![^;]*theme\.text)[^;]*;/g),
    ).toEqual({})
  })

  it('has no inline style: styles belong in styled.ts', () => {
    expect(offenders(codeFiles, /style=\{\{/g)).toEqual({})
  })
})
