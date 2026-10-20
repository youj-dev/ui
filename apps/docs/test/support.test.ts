// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { BASE_UI, BROWSERS, MOTION, REACT, THEME_COLORS } from '@/lib/support'

/* lib/support.ts states what Youj supports once. The peer ranges are checked
 * against the packages' manifests, and the pages that repeat a fact against
 * the constant, so the FAQ, Installation and Versioning can't drift apart. */

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const manifest = (name: string) => JSON.parse(read(`../../../packages/${name}/package.json`)) as { peerDependencies: Record<string, string> }

const installation = read('../content/docs/installation.mdx')
const versioning = read('../content/docs/versioning.mdx')

describe('supported versions', () => {
  it('match the packages', () => {
    for (const pkg of ['core', 'motion', 'ui']) expect(manifest(pkg).peerDependencies.react).toBe(`^${REACT}`)
    expect(manifest('core').peerDependencies.motion).toBe('^13.4.4 || ^14')
    expect(MOTION).toBe('13.4.4 or later, and 14')
    expect(manifest('ui').peerDependencies['@base-ui/react']).toBe('>=1.8.0 <1.10.0')
    expect(BASE_UI).toBe('1.8 and 1.9')
  })

  it('read the same on Installation and Versioning', () => {
    expect(installation).toContain(`needs React ${REACT}`)
    expect(installation).toContain('Motion 13.4.4 or later and 14')
    expect(installation).toContain(`Base UI ${BASE_UI}`)
    expect(versioning).toContain(`| React | ${REACT} |`)
    expect(versioning).toContain(`| Motion (\`motion\`) | ${MOTION} |`)
    expect(versioning).toContain(`| Base UI (\`@base-ui/react\`) | ${BASE_UI} |`)
    for (const page of [installation, versioning]) {
      expect(page).toContain(BROWSERS)
      expect(page).toContain(THEME_COLORS)
    }
  })
})
