// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/* The example registry is hand-written, so hold it to the content: every
 * preview a page asks for must exist, point at the file of the same name,
 * and every example file must be reachable. */

const examplesDir = fileURLToPath(new URL('.', import.meta.url))
const contentDir = join(examplesDir, '../content/docs')

const source = readFileSync(join(examplesDir, 'index.tsx'), 'utf8')
const entries = [...source.matchAll(/'([^']+)': demo\(\(\) => import\('\.\/([^']+)'\)\)/g)].map(([, key, path]) => ({ key: key!, path: path! }))

const files = (readdirSync(examplesDir, { recursive: true }) as string[])
  .filter((f) => f.endsWith('.tsx') && f !== 'index.tsx' && !f.endsWith('.test.tsx'))
  .map((f) => f.replace(/\.tsx$/, ''))

const used = (readdirSync(contentDir, { recursive: true }) as string[])
  .filter((f) => f.endsWith('.mdx'))
  // A preview's `name`, and a card's `demo`.
  .flatMap((f) => [...readFileSync(join(contentDir, f), 'utf8').matchAll(/<(?:ComponentPreview\s+name|Card\b[^>]*?\sdemo)="([^"]+)"/g)].map((m) => ({ page: f, name: m[1]! })))

/** Folder by folder, then file: `avatar/*` before `avatar-stack/*`. */
function byPath(a: string, b: string) {
  const x = a.split('/')
  const y = b.split('/')
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] === undefined) return -1
    if (y[i] === undefined) return 1
    const order = x[i]!.localeCompare(y[i]!, 'en')
    if (order) return order
  }
  return 0
}

describe('examples registry', () => {
  it('lists the examples in path order, a folder before its hyphenated siblings', () => {
    const keys = entries.map((e) => e.key)
    expect(keys).toEqual([...keys].sort(byPath))
  })

  it('registers each example under its own path', () => {
    expect(entries.length).toBeGreaterThan(0)
    for (const { key, path } of entries) expect(path).toBe(key)
  })

  it('registers every example file', () => {
    expect(entries.map((e) => e.key).sort()).toEqual(files.sort())
  })

  it('has an example for every preview used in the docs', () => {
    const keys = new Set(entries.map((e) => e.key))
    const missing = used.filter((u) => !keys.has(u.name))
    expect(missing).toEqual([])
    expect(used.length).toBeGreaterThan(0)
  })

  // The Code tab shows each file as it is, so a reader who copies it has the packages and nothing of the docs app.
  it("imports nothing of the docs app's own (@/…), so a copied example compiles", () => {
    const docsOnly = files.filter((f) => /^\s*(?:import|export)[^'"]*from\s*'@\//m.test(readFileSync(join(examplesDir, `${f}.tsx`), 'utf8')))
    expect(docsOnly).toEqual([])
  })
})
