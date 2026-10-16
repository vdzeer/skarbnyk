import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'

export const SRC_DIR = join(__dirname, '..')

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : walk(path)
    }
    return [path]
  })

export type SourceFile = { path: string; text: string }

/** Every non-test source file under `src`, with paths relative to it. */
export const sourceFiles = (matches: (path: string) => boolean): SourceFile[] =>
  walk(SRC_DIR)
    .map(path => relative(SRC_DIR, path))
    .filter(matches)
    .map(path => ({ path, text: readFileSync(join(SRC_DIR, path), 'utf8') }))

/** Comments explain; they are not what the rule is about. */
export const withoutComments = (text: string) =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
