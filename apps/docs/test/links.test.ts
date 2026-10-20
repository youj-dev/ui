// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { docsUrl } from '@/lib/showcase'

/* Every internal /docs link, in content and in the site's own components,
 * must point at a page that exists: unknown slugs are a static 404, and a
 * page that moved is a redirect hop (`node scripts/relink.ts` fixes both). */

const app = fileURLToPath(new URL('..', import.meta.url))
const content = join(app, 'content/docs')

const pages = new Set(
  (readdirSync(content, { recursive: true }) as string[]).filter((f) => f.endsWith('.mdx')).map(docsUrl),
)

const sources = ['content', 'components', 'app'].flatMap((dir) =>
  (readdirSync(join(app, dir), { recursive: true }) as string[])
    .filter((f) => /\.(mdx|tsx?)$/.test(f) && !f.includes('.test.'))
    .map((f) => join(app, dir, f)),
)

// `href="/docs/…"`, `href: '/docs/…'` and markdown `](/docs/…)`.
const links = sources.flatMap((file) =>
  [...readFileSync(file, 'utf8').matchAll(/(?:href[=:]\s*["']|\]\()(\/docs(?:\/[a-z0-9-]+)*)(?:#[a-z0-9-]*)?["')]/g)].map((m) => ({
    file: relative(app, file),
    href: m[1]!,
  })),
)

describe('internal links', () => {
  it('finds the pages and the links', () => {
    expect(pages.has('/docs')).toBe(true)
    expect(pages.has('/docs/motion/reveal')).toBe(true)
    expect(pages.has('/docs/components/button')).toBe(true)
    expect(pages.has('/docs/components/date-picker')).toBe(true)
    expect(links.length).toBeGreaterThan(20)
  })

  it('points every /docs link at an existing page', () => {
    expect(links.filter((l) => !pages.has(l.href))).toEqual([])
  })
})
