import { sourceFiles, withoutComments } from './sourceFiles'

// A heuristic, not a parser: it catches the two ways a visible string usually
// slips past the translation files — text typed between tags, and a literal
// in an attribute that is read aloud or shown.

const components = sourceFiles(path => path.endsWith('.tsx'))

/** Text sitting directly between a tag and a closing tag. */
const TEXT_BETWEEN_TAGS = />\s*([^<>{}]*\p{L}{2,}[^<>{}]*?)\s*<\//gu
const SPOKEN_ATTRIBUTE =
  /\b(aria-label|title|placeholder|alt|label)="[^"]*\p{L}[^"]*"/gu

const find = (pattern: RegExp) =>
  Object.fromEntries(
    components
      .map(file => [
        file.path,
        [...withoutComments(file.text).matchAll(pattern)].map(match =>
          match[0].trim(),
        ),
      ])
      .filter(([, found]) => found.length > 0),
  )

describe('visible strings', () => {
  it('finds the components it is meant to check', () => {
    expect(components.length).toBeGreaterThanOrEqual(30)
  })

  it('are not typed between tags', () => {
    expect(find(TEXT_BETWEEN_TAGS)).toEqual({})
  })

  it('are not typed into a spoken or shown attribute', () => {
    expect(find(SPOKEN_ATTRIBUTE)).toEqual({})
  })
})
