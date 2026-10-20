// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { signSession, STEALTH_COOKIE, stealthConfig, verifySession } from '../lib/stealth'
import worker, { type Env } from './index'

/** A fake ASSETS binding over a few files, answering a missing path with the 404 page as Workers' `404-page` handling does. */
function assets(files: Record<string, [body: string, type: string]>): Env['ASSETS'] {
  return {
    async fetch(request) {
      const { pathname } = new URL(request.url)
      const file = files[pathname] ?? files[`${pathname}.html`] ?? files[`${pathname.replace(/\/$/, '')}/index.html`]
      if (file) return new Response(file[0], { headers: { 'Content-Type': file[1] } })
      return new Response('<h1>This page didn’t land.</h1>', { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    },
  }
}

const FILES: Record<string, [string, string]> = {
  '/index.html': ['<h1>Home</h1>', 'text/html; charset=utf-8'],
  '/docs/button.html': ['<h1>Button</h1>', 'text/html; charset=utf-8'],
  '/docs/button.txt': ['0:{"page":"Button"}', 'text/plain; charset=utf-8'],
  '/docs/button.md': ['# Button', 'text/markdown; charset=utf-8'],
  '/docs.md': ['# Docs', 'text/markdown; charset=utf-8'],
  '/404.html': ['<h1>This page didn’t land.</h1>', 'text/html; charset=utf-8'],
  '/stealth.html': ['<h1>Coming soon</h1>', 'text/html; charset=utf-8'],
  '/r/button.json': ['{"name":"button"}', 'application/json'],
  '/api/search': ['[]', 'application/null'],
  '/_next/static/chunks/app.js': ['console.log(1)', 'text/javascript; charset=utf-8'],
  '/_next/static/build/_payload.json': ['{"page":"secret"}', 'application/json'],
  '/previews/blocks/login/abc/basalt-dark-640.webp': ['webp', 'image/webp'],
}

const SECRETS = { STEALTH_PASSWORD: 'hunter2', STEALTH_TOKEN: 'tok-123', STEALTH_SECRET: 'sekrit' }
const gated: Env = { ASSETS: assets(FILES), ...SECRETS }
const open: Env = { ASSETS: assets(FILES) }

const get = (env: Env, path: string, headers: Record<string, string> = {}) => worker.fetch(new Request(`https://next.youj.dev${path}`, { headers }), env)
const login = (env: Env, password: string, ip: string, next = '/docs/button') =>
  worker.fetch(
    new Request('https://next.youj.dev/stealth/login', {
      method: 'POST',
      headers: { 'cf-connecting-ip': ip, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ password, next }),
    }),
    env,
  )

describe('the Cloudflare gate, while STEALTH_PASSWORD is set', () => {
  it('sends a page without a cookie to the sign-in, keeping where it was going, and marks it noindex', async () => {
    const response = await get(gated, '/docs/button?tab=code')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://next.youj.dev/stealth?next=%2Fdocs%2Fbutton%3Ftab%3Dcode')
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
    expect((await get(gated, '/')).headers.get('location')).toBe('https://next.youj.dev/stealth')
  })

  it('answers machine endpoints and page data with a 401, never their content', async () => {
    for (const path of ['/r/button.json', '/api/search', '/docs/button.md', '/docs.md', '/llms.md', '/docs/button.txt', '/_next/static/build/_payload.json']) {
      const response = await get(gated, path)
      expect(response.status, path).toBe(401)
      expect(response.headers.get('www-authenticate')).toBe('Bearer realm="youj"')
      expect(await response.text()).not.toContain('secret')
    }
  })

  it('sends a wrong password back to the form, and a right one on with the session cookie', async () => {
    const wrong = await login(gated, 'nope', '1.1.1.1')
    expect(wrong.status).toBe(303)
    expect(wrong.headers.get('location')).toBe('/stealth?error=wrong&next=%2Fdocs%2Fbutton')
    expect(wrong.headers.get('set-cookie')).toBeNull()

    const right = await login(gated, 'hunter2', '1.1.1.1')
    expect(right.status).toBe(303)
    expect(right.headers.get('location')).toBe('/docs/button')
    const cookie = right.headers.get('set-cookie')!
    expect(cookie).toMatch(new RegExp(`^${STEALTH_COOKIE}=\\d+\\.[0-9a-f]{64}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax; Secure$`))
    const value = cookie.split(';')[0]!.split('=')[1]
    expect(await verifySession(value, stealthConfig(SECRETS)!.secret)).toBe(true)

    const page = await get(gated, '/docs/button', { cookie: `theme=dark; ${STEALTH_COOKIE}=${value}` })
    expect(page.status).toBe(200)
    expect(await page.text()).toBe('<h1>Button</h1>')
    expect(page.headers.get('x-robots-tag')).toBe('noindex, nofollow')
  })

  it('never sends the browser off the site after sign-in', async () => {
    expect((await login(gated, 'hunter2', '3.3.3.3', '//evil.dev')).headers.get('location')).toBe('/')
  })

  it('stops answering an IP after ten tries', async () => {
    for (let i = 0; i < 10; i++) await login(gated, 'nope', '2.2.2.2')
    expect((await login(gated, 'hunter2', '2.2.2.2')).headers.get('location')).toBe('/stealth?error=rate&next=%2Fdocs%2Fbutton')
  })

  it('accepts a cookie the Vercel gate signed: same name, format and secret derivation', async () => {
    const derived = { ASSETS: assets(FILES), STEALTH_PASSWORD: 'hunter2' }
    const vercelCookie = await signSession(stealthConfig({ STEALTH_PASSWORD: 'hunter2' })!.secret)
    expect((await get(derived, '/', { cookie: `${STEALTH_COOKIE}=${vercelCookie}` })).status).toBe(200)
    expect((await get(derived, '/', { cookie: `${STEALTH_COOKIE}=${await signSession('other')}` })).status).toBe(307)
  })

  it('lets the bearer token through, and not a wrong one', async () => {
    const response = await get(gated, '/r/button.json', { authorization: 'Bearer tok-123' })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ name: 'button' })
    expect((await get(gated, '/r/button.json', { authorization: 'Bearer tok-12' })).status).toBe(401)
  })

  it('disallows all crawling in robots.txt', async () => {
    const response = await get(gated, '/robots.txt')
    expect(await response.text()).toBe('User-agent: *\nDisallow: /\n')
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8')
  })

  it('serves the sign-in page and what it loads, but not other files under /_next/', async () => {
    expect((await get(gated, '/stealth?next=%2Fdocs')).status).toBe(200)
    expect((await get(gated, '/_next/static/chunks/app.js')).status).toBe(200)
    expect((await get(gated, '/_next/static/build/_payload.json')).status).toBe(401)
    // Media is ungated (run_worker_first skips it); if a request reaches the Worker anyway it's still gated.
    expect((await get(gated, '/previews/blocks/login/abc/basalt-dark-640.webp')).status).toBe(307)
  })
})

describe('the Cloudflare Worker, while STEALTH_PASSWORD is unset', () => {
  it('passes everything through, unmarked', async () => {
    for (const path of ['/', '/docs/button', '/docs/button.txt', '/r/button.json', '/_next/static/build/_payload.json']) {
      const response = await get(open, path)
      expect(response.status, path).toBe(200)
      expect(response.headers.get('x-robots-tag')).toBeNull()
    }
  })

  it('has no sign-in: /stealth is the 404 page and the login post 404s', async () => {
    const page = await get(open, '/stealth')
    expect(page.status).toBe(404)
    expect(await page.text()).toContain('didn’t land')
    expect((await login(open, 'hunter2', '1.1.1.1')).status).toBe(404)
    expect((await get(open, '/robots.txt')).status).toBe(404)
  })

  it('serves the site’s headers, redirects and Markdown rewrite, which Cloudflare skips for Worker responses', async () => {
    const registry = await get(open, '/r/button.json')
    expect(registry.headers.get('cache-control')).toBe('public, max-age=300, s-maxage=86400, stale-while-revalidate=86400')
    expect(registry.headers.get('content-type')).toBe('application/json; charset=utf-8')
    const search = await get(open, '/api/search')
    expect(search.headers.get('content-type')).toBe('application/json')
    expect(search.headers.get('cache-control')).toContain('max-age=3600')

    const graphics = await get(open, '/graphics?scene=coffee')
    expect(graphics.status).toBe(307)
    expect(graphics.headers.get('location')).toBe('/illustrations?scene=coffee')

    expect(await (await get(open, '/llms.md')).text()).toBe('# Docs')
    const twin = await get(open, '/llms.md/button')
    expect(await twin.text()).toBe('# Button')
    expect(twin.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    const missing = await get(open, '/nope')
    expect(missing.status).toBe(404)
    expect(missing.headers.get('cache-control')).toBeNull()
  })
})

describe('the Cloudflare Worker after launch, with the gate secrets deleted', () => {
  const ROBOTS = 'User-Agent: *\nAllow: /\n\nSitemap: https://www.youj.dev/sitemap.xml\n'
  const launched: Env = {
    ASSETS: assets({ ...FILES, '/robots.txt': [ROBOTS, 'text/plain'], '/sitemap.xml': ['<urlset/>', 'application/xml'] }),
  }

  it('serves www and the registry with a 200, unmarked', async () => {
    for (const path of ['/', '/r/button.json', '/sitemap.xml']) {
      const response = await get(launched, path)
      expect(response.status, path).toBe(200)
      expect(response.headers.get('x-robots-tag'), path).toBeNull()
    }
  })

  it('serves the built robots.txt, which allows everything and names the sitemap', async () => {
    const response = await get(launched, '/robots.txt')
    expect(response.status).toBe(200)
    expect(await response.text()).toBe(ROBOTS)
  })

  it('has no /stealth, and no countdown', async () => {
    expect((await get(launched, '/stealth')).status).toBe(404)
    expect(await (await get(launched, '/launch.json')).json()).toEqual({ launchAt: null })
  })

  it('stays open when only the token, the secret or LAUNCH_AT was left behind: the password is the switch', async () => {
    const leftovers: Env = { ...launched, STEALTH_TOKEN: 'tok-123', STEALTH_SECRET: 'sekrit', LAUNCH_AT: '2026-10-21T16:00:00Z' }
    expect((await get(leftovers, '/')).status).toBe(200)
    expect((await get(leftovers, '/r/button.json')).status).toBe(200)
    expect((await get(leftovers, '/stealth')).status).toBe(404)
    expect(await (await get(leftovers, '/robots.txt')).text()).toBe(ROBOTS)
  })
})

describe('the launch moment', () => {
  it('answers /launch.json from the LAUNCH_AT variable, ahead of the gate and uncached', async () => {
    const env = { ASSETS: assets(FILES), ...SECRETS, LAUNCH_AT: '2026-10-14T16:00:00Z' }
    const response = await get(env, '/launch.json')
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ launchAt: '2026-10-14T16:00:00.000Z' })
  })

  it('answers null when LAUNCH_AT is unset or not a date', async () => {
    expect(await (await get({ ASSETS: assets(FILES), ...SECRETS }, '/launch.json')).json()).toEqual({ launchAt: null })
    expect(await (await get({ ASSETS: assets(FILES), ...SECRETS, LAUNCH_AT: 'soon' }, '/launch.json')).json()).toEqual({ launchAt: null })
  })
})
