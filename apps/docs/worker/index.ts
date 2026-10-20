/* The Cloudflare Worker in front of the static export (`pnpm build:static` → out/).
 * It only runs on the paths lib/static-host.ts's RUN_WORKER_FIRST names; everything else
 * is served straight from the assets. It's the stealth gate (lib/stealth.ts, the same
 * decisions, cookie and secret as proxy.vercel.ts, so a session carries over between the
 * hosts), the sign-in post, and the headers and redirects Cloudflare won't apply to a
 * response a Worker produced. With STEALTH_PASSWORD unset it gates nothing. */
import { headersFor, redirectFor, rewriteFor } from '../lib/static-host.ts'
import {
  createRateLimiter,
  decide,
  NOINDEX,
  ROBOTS_DISALLOW,
  SESSION_TTL,
  signIn,
  STEALTH_COOKIE,
  stealthConfig,
  type StealthConfig,
} from '../lib/stealth.ts'

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  STEALTH_PASSWORD?: string
  STEALTH_TOKEN?: string
  STEALTH_SECRET?: string
  /** The launch moment the intro counts down to (an ISO date), set on the Worker in Cloudflare, never in code. */
  LAUNCH_AT?: string
}

/** Per isolate, like the Vercel limiter is per function instance. */
const limiter = createRateLimiter()

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const config = stealthConfig({ STEALTH_PASSWORD: env.STEALTH_PASSWORD, STEALTH_TOKEN: env.STEALTH_TOKEN, STEALTH_SECRET: env.STEALTH_SECRET })
    const response = await route(request, env, config)
    if (config) response.headers.set('X-Robots-Tag', NOINDEX)
    return response
  },
}

async function route(request: Request, env: Env, config: StealthConfig | null): Promise<Response> {
  const url = new URL(request.url)
  const { pathname, search } = url
  const isGatePage = pathname === '/stealth' || pathname.startsWith('/stealth/')

  // While the site is public, the gate isn't there: /stealth is a 404, as on Vercel.
  if (!config && isGatePage) return notFound(request, env)
  if (config && pathname === '/stealth/login' && request.method === 'POST') return login(request, config)
  // Public, ahead of the gate: the intro asks for the launch moment before anyone signs in.
  if (pathname === '/launch.json') return launch(env)

  const decision = await decide({ pathname, search, cookie: readCookie(request), authorization: request.headers.get('authorization') }, config)
  switch (decision.action) {
    case 'robots':
      return new Response(ROBOTS_DISALLOW, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    case 'deny':
      return Response.json(
        { error: 'unauthorized', message: 'This site is private for now. Send Authorization: Bearer <token>.' },
        { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="youj"', 'Cache-Control': 'no-store' } },
      )
    case 'redirect':
      return new Response(null, { status: 307, headers: { Location: new URL(decision.location, url).href } })
    case 'pass':
      return serve(request, env, url)
  }
}

/** The launch moment, read from the Worker's LAUNCH_AT variable so it moves without a deploy; null when unset or invalid. */
function launch(env: Env): Response {
  const at = env.LAUNCH_AT && !Number.isNaN(Date.parse(env.LAUNCH_AT)) ? new Date(env.LAUNCH_AT).toISOString() : null
  return Response.json({ launchAt: at }, { headers: { 'Cache-Control': 'no-store' } })
}

/** The sign-in form's post: the same checks and cookie as app/stealth/login/route.vercel.ts. */
async function login(request: Request, config: StealthConfig): Promise<Response> {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { location, session } = await signIn(await request.formData(), ip, config, limiter)
  const headers = new Headers({ Location: location })
  if (session)
    headers.set(
      'Set-Cookie',
      `${STEALTH_COOKIE}=${session}; Path=/; Max-Age=${SESSION_TTL}; HttpOnly; SameSite=Lax${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
    )
  return new Response(null, { status: 303, headers })
}

/** A page or file from the export, after the site's redirects, with the site's headers on it. */
async function serve(request: Request, env: Env, url: URL): Promise<Response> {
  const redirect = redirectFor(url.pathname)
  if (redirect) {
    // Keep the query, before any #fragment in the destination, as Next does.
    const [path, hash] = redirect.destination.split('#')
    return new Response(null, { status: redirect.status, headers: { Location: `${path}${url.search}${hash ? `#${hash}` : ''}` } })
  }
  const rewrite = rewriteFor(url.pathname)
  const asset = await env.ASSETS.fetch(rewrite ? new Request(new URL(rewrite, url), request) : request)
  // A fetched response's headers are immutable; copy it so the gate can mark it too.
  const response = new Response(asset.body, asset)
  if (response.ok) for (const [key, value] of headersFor(url.pathname)) response.headers.set(key, value)
  return response
}

/** The export's 404 page, with its status. */
async function notFound(request: Request, env: Env): Promise<Response> {
  const page = await env.ASSETS.fetch(new Request(new URL('/404', request.url), { headers: request.headers }))
  return new Response(page.body, { status: 404, headers: page.headers })
}

function readCookie(request: Request): string | undefined {
  const cookies = request.headers.get('cookie') ?? ''
  for (const part of cookies.split(';')) {
    const [name, ...value] = part.trim().split('=')
    if (name === STEALTH_COOKIE) return value.join('=')
  }
  return undefined
}
