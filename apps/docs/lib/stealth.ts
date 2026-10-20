/**
 * Stealth launch: while STEALTH_PASSWORD is set, the whole site sits behind a
 * password (a signed session cookie) or a bearer token (for CLIs), and asks
 * not to be indexed. Unset it to launch. The decisions live here, pure, so
 * `proxy.ts` (Vercel) and `worker/index.ts` (Cloudflare) only turn them into responses. Nothing here logs a secret.
 */

export const STEALTH_COOKIE = 'youj_stealth'
/** A session lasts 30 days, in seconds. */
export const SESSION_TTL = 30 * 24 * 60 * 60
export const NOINDEX = 'noindex, nofollow'
export const ROBOTS_DISALLOW = 'User-agent: *\nDisallow: /\n'

export interface StealthConfig {
  password: string
  token?: string
  /** Signs the session cookie: STEALTH_SECRET, else (outside production only) derived from the password, so a new password signs everyone out. */
  secret: string
}

/**
 * The switch: null (the site is public) unless STEALTH_PASSWORD is set. In production (`VERCEL_ENV`, or `production`
 * passed by a host that knows its own mode) a gate without STEALTH_SECRET throws, so the cookie is never signed
 * with a key derived from the password.
 */
export function stealthConfig(
  env: Record<string, string | undefined> = process.env,
  production = env.VERCEL_ENV === 'production',
): StealthConfig | null {
  const password = env.STEALTH_PASSWORD
  if (!password) return null
  if (production && !env.STEALTH_SECRET) throw new Error('STEALTH_SECRET is required in production')
  return { password, token: env.STEALTH_TOKEN || undefined, secret: env.STEALTH_SECRET || `youj-stealth:${password}` }
}

const encoder = new TextEncoder()

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(data)))
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Compares two strings in constant time: both are hashed first, so neither their length nor their first difference shows in the timing. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([a, b].map(async (value) => new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))))
  let diff = 0
  for (let i = 0; i < x!.length; i++) diff |= x![i]! ^ y![i]!
  return diff === 0
}

/** A session cookie's value: its expiry (unix seconds) and the HMAC of it. */
export async function signSession(secret: string, now = Date.now()): Promise<string> {
  const expires = Math.floor(now / 1000) + SESSION_TTL
  return `${expires}.${await hmac(secret, `v1:${expires}`)}`
}

export async function verifySession(value: string | undefined, secret: string, now = Date.now()): Promise<boolean> {
  const match = /^(\d{1,12})\.([0-9a-f]{64})$/.exec(value ?? '')
  if (!match) return false
  const expires = Number(match[1])
  if (expires * 1000 <= now) return false
  return safeEqual(match[2]!, await hmac(secret, `v1:${expires}`))
}

/** File types that carry no page content: images, video and fonts (with the build's JS and CSS, what goes ungated). */
export const MEDIA_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg', 'ico', 'woff', 'woff2', 'mp4', 'webm'] as const
const STATIC_FILE = new RegExp(`\\.(?:js|css|${MEDIA_EXTENSIONS.join('|')})$`)

/** The tab icons, each mode's (lib/site-brand, written by scripts/favicons.ts) and the default state's static ones. */
export const TAB_ICONS = [
  '/icons/basalt-dark.svg',
  '/icons/site-light.svg',
  '/icons/basalt-dark-32.png',
  '/icons/site-light-32.png',
  '/apple-icon.png',
  '/favicon.ico',
]

/**
 * What the sign-in page needs: itself, the app's JS, CSS and fonts, and the tab icons. Not /_next/image, which
 * would serve any public image, nor any other file under /_next/ (a static export could keep page data there).
 */
export function isExempt(pathname: string): boolean {
  if (pathname === '/stealth' || pathname.startsWith('/stealth/')) return true
  if (pathname.startsWith('/_next/')) return pathname.startsWith('/_next/static/') && STATIC_FILE.test(pathname)
  return TAB_ICONS.includes(pathname)
}

/** Endpoints read by tools rather than people: the registry, the API, and the JSON, Markdown, text and XML files. They get a 401, not a sign-in page. */
export function isMachine(pathname: string): boolean {
  return pathname === '/r' || pathname.startsWith('/r/') || pathname.startsWith('/api/') || /\.(json|md|txt|xml)$/.test(pathname)
}

/** Only a same-site path, so the sign-in can't be turned into an open redirect. */
export function safeNext(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : '/'
}

export type Decision = { action: 'pass' } | { action: 'robots' } | { action: 'deny' } | { action: 'redirect'; location: string }

export interface GateRequest {
  pathname: string
  search: string
  cookie?: string
  authorization?: string | null
}

export async function decide(request: GateRequest, config: StealthConfig | null, now = Date.now()): Promise<Decision> {
  if (!config) return { action: 'pass' }
  const { pathname, search, cookie, authorization } = request
  if (pathname === '/robots.txt') return { action: 'robots' }
  if (isExempt(pathname)) return { action: 'pass' }
  const bearer = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (config.token && bearer && (await safeEqual(bearer.trim(), config.token))) return { action: 'pass' }
  if (await verifySession(cookie, config.secret, now)) return { action: 'pass' }
  if (isMachine(pathname)) return { action: 'deny' }
  const next = pathname + search
  return { action: 'redirect', location: next === '/' ? '/stealth' : `/stealth?next=${encodeURIComponent(next)}` }
}

export type RateLimiter = ReturnType<typeof createRateLimiter>

/**
 * The sign-in form's post (`password`, `next`), for both hosts' login handlers: where to send the browser (303),
 * and the session cookie's value when the password was right. Wrong or rate-limited tries go back to the form.
 */
export async function signIn(
  form: FormData,
  ip: string,
  config: StealthConfig,
  limiter: RateLimiter,
  now = Date.now(),
): Promise<{ location: string; session?: string }> {
  const next = safeNext(form.get('next'))
  // Relative redirects, so they stay on the host the form was posted to.
  const back = (error: string) => ({ location: `/stealth?error=${error}${next === '/' ? '' : `&next=${encodeURIComponent(next)}`}` })
  if (!limiter.attempt(ip, now)) return back('rate')
  if (!(await safeEqual(String(form.get('password') ?? ''), config.password))) return back('wrong')
  limiter.clear(ip)
  return { location: next, session: await signSession(config.secret, now) }
}

/** A naive per-key limiter (one per server instance): `limit` attempts per window. */
export function createRateLimiter(limit = 10, windowMs = 15 * 60 * 1000) {
  const hits = new Map<string, { count: number; reset: number }>()
  return {
    attempt(key: string, now = Date.now()): boolean {
      if (hits.size > 1000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k)
      const entry = hits.get(key)
      if (!entry || entry.reset <= now) {
        hits.set(key, { count: 1, reset: now + windowMs })
        return true
      }
      entry.count++
      return entry.count <= limit
    },
    clear(key: string) {
      hits.delete(key)
    },
  }
}
