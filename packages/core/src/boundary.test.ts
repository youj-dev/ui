import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import ts from 'typescript'

/* Core is the bottom of the graph: motion, react, icons, illustrations and
 * sound build on it, so it imports none of them, by name or by a relative path
 * out of the package (check:imports covers the names; this covers both). */

const pkg = resolve(import.meta.dirname, '..')
const files = (readdirSync(import.meta.dirname, { recursive: true }) as string[]).filter((f) => /\.(tsx?|mdx)$/.test(f))

test('core imports no other Youj package', () => {
  const found: string[] = []
  for (const file of files) {
    // preProcessFile reads imports, re-exports and import() calls, not comments (the locales' usage notes name @youj/react).
    for (const { fileName: spec } of ts.preProcessFile(readFileSync(join(import.meta.dirname, file), 'utf8'), true, true).importedFiles) {
      if (spec.startsWith('@youj/')) found.push(`${file}: ${spec}`)
      else if (spec.startsWith('.') && relative(pkg, resolve(import.meta.dirname, file, '..', spec)).startsWith('..')) found.push(`${file}: ${spec}`)
    }
  }
  expect(found).toEqual([])
})
