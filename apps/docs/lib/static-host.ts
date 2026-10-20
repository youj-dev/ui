/* The Cloudflare build's routing rules, from the same lists next.config.mjs serves on
 * Vercel: which paths the Worker fronts (and so the stealth gate covers), the headers
 * and redirects as _headers and _redirects, and the same rules applied by the Worker
 * (Cloudflare applies neither file to a response the Worker produced). */
import { headers } from './headers.mjs'
import { siteRedirects } from './redirects.mjs'
import { MEDIA_EXTENSIONS } from './stealth.ts'

type HeaderRule = { source: string; headers: { key: string; value: string }[] }

/**
 * `assets.run_worker_first`: the Worker runs first on everything but the build's JS and CSS and the media and
 * font files, what Vercel's proxy matcher skips. Unlike
 * that matcher, it goes by file type only, not by folder: /promo/manifest.json is gated here. So every page,
 * its RSC payload (`.txt`), `/r`, `/api`, the Markdown, the feeds and any other file under `/_next/` go
 * through the gate. lib/static-host.test.ts scans the export for anything else these let through.
 */
export const RUN_WORKER_FIRST = [
  '/*',
  '!/_next/static/*.js',
  '!/_next/static/*.css',
  ...MEDIA_EXTENSIONS.map((extension) => `!/*.${extension}`),
]

/** A run_worker_first glob, as Cloudflare's asset router reads it: `*` matches anything, `/` included, over the whole path. */
export function globToRegExp(glob: string): RegExp {
  return new RegExp(`^${glob.split('*').map((part) => part.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('.*')}$`)
}

/** Whether a request for this path reaches the Worker (and the gate) before the assets. Negations win. */
export function runsWorkerFirst(pathname: string): boolean {
  const negated = RUN_WORKER_FIRST.filter((rule) => rule.startsWith('!')).map((rule) => globToRegExp(rule.slice(1)))
  const positive = RUN_WORKER_FIRST.filter((rule) => !rule.startsWith('!')).map(globToRegExp)
  return positive.some((re) => re.test(pathname)) && !negated.some((re) => re.test(pathname))
}

/**
 * What the route handlers say about their bodies that a file's extension doesn't: Vercel serves these
 * headers from the handler, a static file only gets the type Wrangler guesses from its name (none at all
 * for `/api/search`, `application/xml` for the feed, and no `charset` on JSON).
 */
export const FILE_HEADERS: HeaderRule[] = [
  { source: '/api/search', headers: [{ key: 'Content-Type', value: 'application/json' }] },
  { source: '/changelog.xml', headers: [{ key: 'Content-Type', value: 'application/rss+xml; charset=utf-8' }] },
  {
    source: '/downloads/youj-figma-plugin.zip',
    headers: [
      { key: 'Content-Type', value: 'application/zip' },
      { key: 'Content-Disposition', value: 'attachment; filename="youj-figma-plugin.zip"' },
    ],
  },
  { source: '/r/:path*', headers: [{ key: 'Content-Type', value: 'application/json; charset=utf-8' }] },
]

/**
 * The build's JS, CSS and media carry a content hash in their names, so a browser may keep them for good. Vercel
 * sends this for /_next/static on its own; Workers' assets default to `max-age=0, must-revalidate`, which costs a
 * revalidation round trip per chunk (some 80 on a docs page) on every visit after the first.
 */
export const BUILD_ASSET_HEADERS: HeaderRule[] = [{ source: '/_next/static/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }]

/**
 * Next.config's two rewrites, turned around. On Vercel /docs.md and /docs/<slug>.md are served by
 * app/llms.md; the export writes them as files at those URLs (scripts/build-static.ts), and the
 * handler's own URLs, /llms.md and /llms.md/<slug>, are served from them. In _redirects syntax.
 */
export const REWRITES = [
  { source: '/llms.md', destination: '/docs.md' },
  { source: '/llms.md/*', destination: '/docs/:splat.md' },
]

export function rewriteFor(pathname: string): string | undefined {
  if (pathname === '/llms.md') return '/docs.md'
  if (pathname.startsWith('/llms.md/') && pathname.length > '/llms.md/'.length) return `/docs/${pathname.slice('/llms.md/'.length)}.md`
  return undefined
}

/** Every header rule the Cloudflare build serves: next.config's list, the build's assets', then the files'. */
export function headerRules(): HeaderRule[] {
  return [...headers(), ...BUILD_ASSET_HEADERS, ...FILE_HEADERS]
}

/** A Next `source` (a literal path, or one ending in `/:path*`) as a _headers / _redirects path. */
function toCloudflarePath(source: string): string {
  if (source.endsWith('/:path*')) return `${source.slice(0, -':path*'.length)}*`
  if (source.includes(':') || source.includes('*') || source.includes('(')) throw new Error(`lib/static-host.ts: can't translate ${source}; add its pattern here`)
  return source
}

/** A Next redirect `destination` as a _redirects one: `:path*` is Cloudflare's `:splat`. */
function toCloudflareDestination(destination: string): string {
  return destination.replace(/:path\*$/, ':splat')
}

function matches(source: string, pathname: string): boolean {
  if (!source.endsWith('/:path*')) return source === pathname
  const prefix = source.slice(0, -'/:path*'.length)
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

/** The headers a path gets, later rules overriding earlier ones for the same key (as in Next). */
export function headersFor(pathname: string): [string, string][] {
  const out = new Map<string, [string, string]>()
  for (const rule of headerRules()) if (matches(rule.source, pathname)) for (const { key, value } of rule.headers) out.set(key.toLowerCase(), [key, value])
  return [...out.values()]
}

/** A redirect for this path, as Next sends it: 308 when permanent, else 307. */
export function redirectFor(pathname: string): { destination: string; status: 307 | 308 } | undefined {
  const rule = siteRedirects().find((r) => matches(r.source, pathname))
  if (!rule) return undefined
  const rest = rule.source.endsWith('/:path*') ? pathname.slice(rule.source.length - '/:path*'.length + 1) : ''
  const destination = rule.destination.endsWith(':path*') ? rule.destination.slice(0, -':path*'.length) + rest : rule.destination
  return { destination: destination.endsWith('/') && rest === '' ? destination.slice(0, -1) : destination, status: rule.permanent ? 308 : 307 }
}

/** The _headers file: every rule, in order. */
export function headersFile(): string {
  return headerRules()
    .map((rule) => [toCloudflarePath(rule.source), ...rule.headers.map(({ key, value }) => `  ${key}: ${value}`)].join('\n'))
    .join('\n\n')
    .concat('\n')
}

/** The _redirects file: one line per redirect (Cloudflare allows 2,000 static ones), then the rewrites as 200s. */
export function redirectsFile(): string {
  return [
    ...siteRedirects().map((r) => `${toCloudflarePath(r.source)} ${toCloudflareDestination(r.destination)} ${r.permanent ? 308 : 307}`),
    ...REWRITES.map((r) => `${r.source} ${r.destination} 200`),
  ]
    .join('\n')
    .concat('\n')
}
