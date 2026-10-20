// @vitest-environment node
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/* Every page's shell (the providers and the header) costs nothing in sound
 * while it's off: @youj/sound (its provider, player and packs) is reached
 * only through site-sound.tsx's import(), never statically. */

const app = resolve(import.meta.dirname, '../..')
const STATIC = /^\s*(?:import|export)\s+(?!type\b)[^'"]*?from\s+['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]/gm

const file = (base: string) =>
  [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')].find((path) => existsSync(path) && statSync(path).isFile())

/** The packages every docs file reachable by static imports from `entries` imports, by specifier. */
function staticPackages(entries: string[]): Set<string> {
  const seen = new Set<string>()
  const packages = new Set<string>()
  const walk = (path: string) => {
    if (seen.has(path)) return
    seen.add(path)
    for (const [, from, bare] of readFileSync(path, 'utf8').matchAll(STATIC)) {
      const specifier = (from ?? bare)!
      const local = specifier.startsWith('@/') ? join(app, specifier.slice(2)) : specifier.startsWith('.') ? resolve(dirname(path), specifier) : undefined
      if (!local) packages.add(specifier)
      else {
        const target = file(local)
        if (target && /\.tsx?$/.test(target)) walk(target)
      }
    }
  }
  entries.forEach((entry) => walk(join(app, entry)))
  return packages
}

test('the providers and the header never import @youj/sound up front; the sound chunk comes through one import()', () => {
  const packages = [...staticPackages(['app/providers.tsx', 'components/site/site-header.tsx', 'components/site/mobile-menu.tsx'])]
  // The walk reaches the bus and the toggle.
  expect(packages).toContain('@youj/core/lib/youj/sound-cue')
  expect(packages).toContain('@youj/icons/components/youj/icons/volume')
  expect(packages.filter((name) => name === '@youj/sound' || (name.startsWith('@youj/sound/') && name !== '@youj/sound/lab'))).toEqual([])
  expect(readFileSync(join(app, 'components/site/site-sound.tsx'), 'utf8')).toContain("import('@/components/site/site-sound-on')")
  expect(readFileSync(join(app, 'components/site/site-sound-on.tsx'), 'utf8')).toMatch(/from '@youj\/sound'/)
})
