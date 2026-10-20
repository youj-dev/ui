// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { miniatures } from './index'

/* Every miniature is wired up the same way, so a port is done when this passes:
 * its own entry (component, metadata, figure), exported from package.json for
 * the workspace and the published build, listed in the catalogue, with a story
 * and a test that runs the miniature contract. */
const pkg = join(import.meta.dirname, '..')
const manifest = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')) as {
  exports: Record<string, string>
  publishConfig: { exports: Record<string, unknown> }
  dependencies?: Record<string, string>
  peerDependencies: Record<string, string>
  sideEffects: boolean
}
const items = readdirSync(join(pkg, 'src'))
  .filter((f) => /^[a-z0-9-]+\.tsx$/.test(f))
  .map((f) => f.slice(0, -'.tsx'.length))

describe('the package', () => {
  it('lists every miniature in the catalogue, in id order', () => {
    expect(miniatures.map((m) => m.id)).toEqual([...items].sort())
  })

  it.each(items)('%s is exported, catalogued, storied and tested', (id) => {
    expect(manifest.exports[`./${id}`]).toBe(`./src/${id}.tsx`)
    expect(manifest.publishConfig.exports[`./${id}`]).toEqual({ types: `./dist/${id}.d.ts`, default: `./dist/${id}.js` })
    for (const file of [`meta/${id}.ts`, `figures/${id}.ts`]) expect(existsSync(join(pkg, 'src', file))).toBe(true)
    expect(readFileSync(join(pkg, 'src', `${id}.stories.tsx`), 'utf8')).toMatch(/title: 'Miniatures\//)
    expect(readFileSync(join(pkg, 'src', `${id}.test.tsx`), 'utf8')).toContain('describeMiniature(')
    expect(miniatures.find((m) => m.id === id)?.viewBox).toMatch(/^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/)
  })

  it('exports nothing it doesn’t have', () => {
    const entries = Object.keys(manifest.exports).filter((k) => k !== '.')
    expect(entries.map((k) => k.slice(2)).sort()).toEqual([...items].sort())
  })

  it('depends on nothing but React, as a peer, and has no side effects', () => {
    expect(manifest.dependencies ?? {}).toEqual({})
    expect(Object.keys(manifest.peerDependencies)).toEqual(['react'])
    expect(manifest.sideEffects).toBe(false)
    const imports = new Set<string>()
    const walk = (dir: string): void => {
      for (const f of readdirSync(dir, { withFileTypes: true })) {
        if (f.isDirectory()) {
          if (f.name !== 'test' && f.name !== 'stories') walk(join(dir, f.name))
        } else if (/\.tsx?$/.test(f.name) && !/\.(test|stories)\./.test(f.name))
          for (const [, spec] of readFileSync(join(dir, f.name), 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .matchAll(/from '([^'.][^']*)'/g))
            imports.add(spec!)
      }
    }
    walk(join(pkg, 'src'))
    expect([...imports].sort()).toEqual(['react'])
  })
})
