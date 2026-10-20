// @vitest-environment node
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/* The repository may move, so its URL is spelled out once, in lib/repo.ts.
 * Components and pages import `repo` from there; MDX writes `repo:` links. */

const app = fileURLToPath(new URL('..', import.meta.url))

const SKIP = new Set(['node_modules', '.next', '.source', 'generated', 'out', '.wrangler', '.cloudflare', join('public', 'r'), join('public', 'samples'), join('public', 'previews')])
// lib/repo.ts holds the default; the README documents it.
const ALLOWED = new Set([join('lib', 'repo.ts'), 'README.md', join('content', 'repo-url.test.ts')])

const files = (readdirSync(app, { recursive: true }) as string[]).filter(
  (f) => /\.(m?[jt]sx?|json|mdx?|css|html|txt|ya?ml)$/.test(f) && !f.split(sep).some((_, i, parts) => SKIP.has(parts.slice(0, i + 1).join(sep))) && !ALLOWED.has(f) && statSync(join(app, f)).isFile(),
)

describe('the repository URL', () => {
  it('scans the app’s sources and content', () => {
    expect(files).toContain(join('lib', 'project.ts'))
    expect(files).toContain(join('content', 'docs', 'guides', 'i18n.mdx'))
    expect(files.some((f) => f.startsWith('node_modules'))).toBe(false)
  })

  it('appears nowhere but lib/repo.ts', () => {
    const offenders = files.filter((f) => /github\.com\/youj-dev\/ui\b/i.test(readFileSync(join(app, f), 'utf8')))
    expect(offenders, 'import from lib/repo.ts, or write a repo: link in MDX').toEqual([])
  })
})
