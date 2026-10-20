/// <reference types="vite/client" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import type { ComponentType } from 'react'
import { LOADER_CATEGORIES, LOADER_TECHNIQUES, type LoaderMeta } from './categories'
import type { LoaderProps } from './kit'
import type { Scene } from './field'
import { describeLoader } from './testing'

/* The set as a whole: every loader file found the way the gallery finds them,
 * held to the rules in LOADERS.md, and the package's entries held to the files.
 * Each loader passes describeLoader (testing.tsx) here; one with its own
 * `<category>/<id>.test.tsx` runs describeLoader there, beside its extra tests. */

const modules = import.meta.glob<Record<string, unknown>>(['./*/*.tsx', '!./*/*.stories.tsx', '!./*/*.test.tsx'], { eager: true })
const ownTests = new Set(Object.keys(import.meta.glob('./*/*.test.tsx')))
const pascal = (id: string) => id.replace(/(^|-)([a-z0-9])/g, (_, __, c: string) => c.toUpperCase())
const pieces = Object.entries(modules).map(([path, mod]) => ({ path, mod, meta: mod.meta as LoaderMeta }))

/** The loaders drawn wider than tall: their `aspect`, as the scenes' view needs it. */
const ASPECTS: Record<string, number> = {
  compose: 2,
  inscribe: 2,
  kern: 2,
  cue: 2,
  delta: 1.6,
  harmonics: 2,
  'least-squares': 1.3,
  phosphor: 1.4,
  tail: 2,
  vitals: 2,
  wick: 1.6,
}

for (const { path, mod, meta } of pieces) {
  if (ownTests.has(path.replace(/\.tsx$/, '.test.tsx'))) continue
  describeLoader(mod[`Loader${pascal(meta.id)}`] as ComponentType<LoaderProps>, meta, mod.scene as Scene, ASPECTS[meta.id])
}

const manifest = JSON.parse(readFileSync(join(import.meta.dirname, '../../../../package.json'), 'utf8')) as {
  exports: Record<string, string>
  publishConfig: { exports: Record<string, string | { types: string; default: string }> }
}

describe('the loaders', () => {
  it('live in their category’s folder, under their own id', () => {
    for (const { path, meta } of pieces) {
      expect(path).toBe(`./${meta.category}/${meta.id}.tsx`)
      expect(LOADER_CATEGORIES.map((c) => c.id)).toContain(meta.category)
      expect(LOADER_TECHNIQUES).toContain(meta.technique)
    }
  })

  it('each export their scene and component', () => {
    for (const { mod, meta } of pieces) {
      expect(typeof mod[`Loader${pascal(meta.id)}`]).toBe('function')
      expect(typeof (mod.scene as { draw?: unknown }).draw).toBe('function')
    }
  })

  it('each have their own entry, `@youj/loaders/<id>`, source and published', () => {
    for (const { path, meta } of pieces) {
      expect(manifest.exports[`./${meta.id}`], meta.id).toBe(`./src/components/youj/loaders${path.slice(1)}`)
      expect(manifest.publishConfig.exports[`./${meta.id}`], meta.id).toEqual({
        types: `./dist/components/youj/loaders/${meta.category}/${meta.id}.d.ts`,
        default: `./dist/components/youj/loaders/${meta.category}/${meta.id}.js`,
      })
    }
  })

  it('have no entry without a file', () => {
    const ids = new Set(pieces.map((p) => p.meta.id))
    for (const key of Object.keys(manifest.exports)) if (key !== '.') expect(ids.has(key.slice(2)), key).toBe(true)
  })

  it('have names of their own, each used once', () => {
    const ids = pieces.map((p) => p.meta.id)
    const titles = pieces.map((p) => p.meta.title.toLowerCase())
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('name every extra tone they draw with, and only those, for the gallery’s color pickers', () => {
    for (const { mod, meta } of pieces) {
      const Loader = mod[`Loader${pascal(meta.id)}`] as () => ReactElement
      const { container, unmount } = render(<Loader />)
      const root = container.querySelector<HTMLElement>('[data-yj-loader]')!
      const drawn = ['c1', 'c2', 'c3', 'c4'].filter((tone) => root.style.getPropertyValue(`--yj-anim-${tone}`))
      expect(drawn, meta.id).toEqual(['c1', 'c2', 'c3', 'c4'].slice(0, meta.colors?.length ?? 0))
      unmount()
    }
  })

  it('keep particles to about a quarter of the set', () => {
    // Particles are one tool among many: once the set is large enough to judge, at most 30% are mainly particles.
    if (pieces.length < 16) return
    const particles = pieces.filter((p) => p.meta.technique === 'particles').length
    expect(particles / pieces.length).toBeLessThanOrEqual(0.3)
  })
})
