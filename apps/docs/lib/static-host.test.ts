// @vitest-environment node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import nextConfig from '../next.config.mjs'
import { BUILD_ASSET_HEADERS, FILE_HEADERS, headersFile, headersFor, redirectsFile, REWRITES, rewriteFor, RUN_WORKER_FIRST, runsWorkerFirst } from './static-host'
import { MEDIA_EXTENSIONS } from './stealth'

const OUT = fileURLToPath(new URL('../out', import.meta.url))

/** _headers back into rules: a path line, then its indented `Key: value` lines. */
function parseHeaders(text: string) {
  const rules: { path: string; headers: Record<string, string> }[] = []
  for (const line of text.split('\n').filter(Boolean)) {
    if (!line.startsWith(' ')) rules.push({ path: line, headers: {} })
    else {
      const [key, ...value] = line.trim().split(': ')
      rules.at(-1)!.headers[key!] = value.join(': ')
    }
  }
  return rules
}

const cloudflarePath = (source: string) => source.replace(/\/:path\*$/, '/*')

describe('_headers and _redirects', () => {
  it('carry every header next.config.mjs sends on Vercel, the hashed build assets’ caching Vercel adds itself, then the route handlers’ types', async () => {
    const vercel = await nextConfig.headers!()
    const rules = parseHeaders(headersFile())
    expect(rules).toEqual(
      [...vercel, ...BUILD_ASSET_HEADERS, ...FILE_HEADERS].map((rule) => ({ path: cloudflarePath(rule.source), headers: Object.fromEntries(rule.headers.map((h) => [h.key, h.value])) })),
    )
  })

  it('let a browser keep the build’s hashed JS and CSS for good', () => {
    expect(new Map(headersFor('/_next/static/chunks/0abc.js')).get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    expect(new Map(headersFor('/docs/button')).get('Cache-Control')).toBeUndefined()
  })

  it('send the baseline security headers on every path, with the CSP report-only and framing limited to the site itself', () => {
    const [all] = parseHeaders(headersFile())
    expect(all!.path).toBe('/*')
    expect(all!.headers['X-Content-Type-Options']).toBe('nosniff')
    expect(all!.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(all!.headers['Permissions-Policy']).toContain('camera=()')
    expect(all!.headers['Strict-Transport-Security']).toMatch(/^max-age=\d+$/)
    // Enforced: only framing. The rest of the policy is report-only until its reports have been read.
    expect(all!.headers['Content-Security-Policy']).toBe("frame-ancestors 'self'")
    const report = all!.headers['Content-Security-Policy-Report-Only']!
    expect(report).toContain("default-src 'self'")
    expect(report).toContain("object-src 'none'")
    expect(report).toContain("frame-src 'self'")
    expect(report).not.toContain('frame-ancestors')
    // headersFor is what the Worker applies to what it serves itself.
    expect(Object.fromEntries(headersFor('/view/button'))['X-Content-Type-Options']).toBe('nosniff')
    // Cloudflare's _headers: at most 100 rules, a line at most 2,000 characters.
    const lines = headersFile().split('\n')
    expect(lines.filter((l) => l && !l.startsWith(' ')).length).toBeLessThanOrEqual(100)
    expect(Math.max(...lines.map((l) => l.length))).toBeLessThanOrEqual(2000)
  })

  it('carry every redirect next.config.mjs sends on Vercel, with its status, then the rewrites', async () => {
    const vercel = await nextConfig.redirects!()
    expect(vercel.length).toBeGreaterThan(0)
    const lines = redirectsFile().trimEnd().split('\n')
    expect(lines).toEqual([
      ...vercel.map((r) => `${cloudflarePath(r.source)} ${r.destination.replace(/:path\*$/, ':splat')} ${'permanent' in r && r.permanent ? 308 : 307}`),
      ...REWRITES.map((r) => `${r.source} ${r.destination} 200`),
    ])
    // Cloudflare's limit for static redirects.
    expect(lines.length).toBeLessThanOrEqual(2000)
  })

  it('covers both of next.config.mjs’s rewrites, as a rewrite or as files the export writes', async () => {
    const rewrites = await nextConfig.rewrites!()
    expect(rewrites).toEqual([
      { source: '/docs.md', destination: '/llms.md' },
      { source: '/docs/:path*.md', destination: '/llms.md/:path*' },
    ])
    expect(REWRITES).toEqual([
      { source: '/llms.md', destination: '/docs.md' },
      { source: '/llms.md/*', destination: '/docs/:splat.md' },
    ])
    expect(rewriteFor('/llms.md')).toBe('/docs.md')
    expect(rewriteFor('/llms.md/components/button')).toBe('/docs/components/button.md')
    expect(rewriteFor('/docs/components/button.md')).toBeUndefined()
  })

  it.skipIf(!existsSync(join(OUT, '_headers')))('are what the last `build:static` wrote', () => {
    expect(readFileSync(join(OUT, '_headers'), 'utf8')).toBe(headersFile())
    expect(readFileSync(join(OUT, '_redirects'), 'utf8')).toBe(redirectsFile())
  })
})

/** What may skip the gate: the build's scripts and styles, and media and fonts. */
const UNGATED_FILE = new RegExp(`\\.(?:js|css|${MEDIA_EXTENSIONS.join('|')})$`)

describe('run_worker_first', () => {
  it('fits Cloudflare’s 100 rules', () => expect(RUN_WORKER_FIRST.length).toBeLessThanOrEqual(100))

  it('leaves the build’s JS and CSS, media to the assets', () => {
    for (const path of ['/_next/static/chunks/a.js', '/_next/static/css/a.css', '/_next/static/media/a.woff2', '/a.webp', '/a.mp4', '/fonts/geist.woff2', '/icons/basalt-dark.svg', '/icons/site-light-32.png', '/apple-icon.png', '/favicon.ico'])
      expect(runsWorkerFirst(path), path).toBe(false)
  })

  it('sends every page, its RSC payload, the registry, the API and every data file through the Worker', () => {
    for (const path of ['/', '/docs/button', '/docs/button.html', '/docs/button.txt', '/docs/button/__next._tree.txt', '/stealth', '/stealth/login', '/r/button.json', '/api/search', '/llms.txt', '/llms.md', '/docs/button.md', '/changelog.xml', '/sitemap.xml', '/showcase-index.json', '/downloads/youj-figma-plugin.zip', '/_next/static/a.json', '/_next/static/a.txt', '/samples/a.riv', '/promo/manifest.json', '/robots.txt', '/404.html', '/a.PNG'])
      expect(runsWorkerFirst(path), path).toBe(true)
  })

  // The proof for the export itself: every file its patterns let past the Worker is a script, a style, an image, a video or a font.
  it.skipIf(!existsSync(OUT))('lets nothing that carries page content past the gate in out/', () => {
    const files = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]))
    const all = files(OUT).map((file) => `/${relative(OUT, file)}`)
    expect(all.length).toBeGreaterThan(1000)
    const ungated = all.filter((path) => [path, path.replace(/(\/index)?\.html$/, '') || '/'].some((url) => !runsWorkerFirst(url)))
    expect(ungated.filter((path) => !UNGATED_FILE.test(path))).toEqual([])
    // And the content is there to be gated: pages, their payloads and the twins.
    for (const kind of ['.html', '.txt', '.md', '.json']) expect(all.some((p) => p.endsWith(kind) && runsWorkerFirst(p)), kind).toBe(true)
  })
})
