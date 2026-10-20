// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { docsUrl } from '@/lib/showcase'

/* A link to `/docs/page#section` or `#section` must land on a heading (or an
 * explicit id) that exists, or the jump silently stays at the top. */

const content = join(fileURLToPath(new URL('..', import.meta.url)), 'content/docs')

// GitHub's slug rules, which the docs headings follow.
const slug = (text: string) =>
  text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-')

const sources = new Map<string, string>()
const anchors = new Map<string, Set<string>>()
for (const f of (readdirSync(content, { recursive: true }) as string[]).filter((f) => f.endsWith('.mdx'))) {
  const src = readFileSync(join(content, f), 'utf8')
  const seen = new Map<string, number>()
  const ids = new Set<string>()
  let fenced = false
  for (const line of src.split('\n')) {
    if (/^\s*```/.test(line)) fenced = !fenced
    const heading = !fenced && /^#{1,6}\s+(.*)$/.exec(line)
    if (!heading) continue
    const base = slug(heading[1]!)
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    ids.add(n ? `${base}-${n}` : base)
  }
  for (const m of src.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]!)
  sources.set(docsUrl(f), src)
  anchors.set(docsUrl(f), ids)
}

describe('anchor links', () => {
  it('lands every #section on a heading of its page', () => {
    const dead: string[] = []
    let checked = 0
    for (const [url, src] of sources)
      for (const m of src.matchAll(/\]\((\/docs[a-z0-9/-]*)?#([a-z0-9_-]+)\)/g)) {
        const target = m[1] ?? url
        const ids = anchors.get(target)
        if (!ids) continue
        checked++
        if (!ids.has(m[2]!)) dead.push(`${url} -> ${target}#${m[2]}`)
      }
    expect(checked).toBeGreaterThan(20)
    expect(dead).toEqual([])
  })
})
