// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { config as proxyConfig, proxy } from '../proxy'
import { lowercasePath } from './case-redirect'
import { createRateLimiter, decide, safeEqual, safeNext, SESSION_TTL, signSession, STEALTH_COOKIE, stealthConfig, verifySession } from './stealth'

const config = stealthConfig({ STEALTH_PASSWORD: 'hunter2', STEALTH_TOKEN: 'tok-123', STEALTH_SECRET: 'sekrit' })!
const now = Date.UTC(2026, 8, 28)
const page = (pathname: string, extra: { cookie?: string; authorization?: string; search?: string } = {}) =>
  decide({ pathname, search: extra.search ?? '', cookie: extra.cookie, authorization: extra.authorization }, config, now)

describe('stealth switch', () => {
  it('is off without STEALTH_PASSWORD, and lets everything through', async () => {
    expect(stealthConfig({})).toBeNull()
    expect(stealthConfig({ STEALTH_PASSWORD: '' })).toBeNull()
    expect(await decide({ pathname: '/r/button.json', search: '' }, null)).toEqual({ action: 'pass' })
  })

  it('derives the signing secret from the password when STEALTH_SECRET is unset', () => {
    const derived = stealthConfig({ STEALTH_PASSWORD: 'a' })!
    expect(derived.secret).not.toBe('a')
    expect(derived.secret).not.toBe(stealthConfig({ STEALTH_PASSWORD: 'b' })!.secret)
    expect(derived.token).toBeUndefined()
  })

  it('refuses to derive the signing secret in production', () => {
    expect(() => stealthConfig({ STEALTH_PASSWORD: 'a' }, true)).toThrow('STEALTH_SECRET')
    expect(() => stealthConfig({ STEALTH_PASSWORD: 'a', VERCEL_ENV: 'production' })).toThrow('STEALTH_SECRET')
    expect(stealthConfig({ STEALTH_PASSWORD: 'a', STEALTH_SECRET: 's' }, true)!.secret).toBe('s')
    expect(stealthConfig({}, true)).toBeNull()
  })
})

describe('session cookie', () => {
  it('is valid for 30 days', async () => {
    const cookie = await signSession(config.secret, now)
    expect(await verifySession(cookie, config.secret, now)).toBe(true)
    expect(await verifySession(cookie, config.secret, now + (SESSION_TTL - 60) * 1000)).toBe(true)
  })

  it('is rejected once expired', async () => {
    const cookie = await signSession(config.secret, now)
    expect(await verifySession(cookie, config.secret, now + SESSION_TTL * 1000)).toBe(false)
  })

  it('is rejected when tampered with or signed with another secret', async () => {
    const cookie = await signSession(config.secret, now)
    const [expires, signature] = cookie.split('.')
    expect(await verifySession(`${Number(expires) + 86400}.${signature}`, config.secret, now)).toBe(false)
    expect(await verifySession(`${expires}.${signature!.replace(/.$/, (c) => (c === '0' ? '1' : '0'))}`, config.secret, now)).toBe(false)
    expect(await verifySession(cookie, 'other', now)).toBe(false)
    expect(await verifySession('garbage', config.secret, now)).toBe(false)
    expect(await verifySession(undefined, config.secret, now)).toBe(false)
  })
})

describe('gate decisions', () => {
  it('redirects pages to the sign-in, keeping where they were going', async () => {
    expect(await page('/')).toEqual({ action: 'redirect', location: '/stealth' })
    expect(await page('/docs/button', { search: '?tab=code' })).toEqual({ action: 'redirect', location: '/stealth?next=%2Fdocs%2Fbutton%3Ftab%3Dcode' })
    expect(await page('/illustrations', { search: '?scene=coffee' })).toEqual({ action: 'redirect', location: '/stealth?next=%2Fillustrations%3Fscene%3Dcoffee' })
  })

  it('answers machine endpoints with a 401 instead', async () => {
    for (const path of ['/r/button.json', '/r/illustration-coffee.json', '/r/illustration-kit.json', '/r/registry.json', '/llms.txt', '/llms-full.txt', '/docs/button.md', '/showcase-index.json', '/api/search', '/changelog.xml', '/sitemap.xml'])
      expect(await page(path)).toEqual({ action: 'deny' })
  })

  it('lets a valid session cookie through, and not an expired one', async () => {
    expect(await page('/', { cookie: await signSession(config.secret, now) })).toEqual({ action: 'pass' })
    expect(await page('/r/button.json', { cookie: await signSession(config.secret, now) })).toEqual({ action: 'pass' })
    expect(await page('/', { cookie: await signSession(config.secret, now - SESSION_TTL * 1000 - 1000) })).toMatchObject({ action: 'redirect' })
  })

  it('lets the bearer token through, and not a wrong one', async () => {
    expect(await page('/r/button.json', { authorization: 'Bearer tok-123' })).toEqual({ action: 'pass' })
    expect(await page('/r/button.json', { authorization: 'Bearer tok-12' })).toEqual({ action: 'deny' })
    expect(await page('/r/button.json', { authorization: 'Basic tok-123' })).toEqual({ action: 'deny' })
    const tokenless = stealthConfig({ STEALTH_PASSWORD: 'hunter2' })!
    expect(await decide({ pathname: '/r/button.json', search: '', authorization: 'Bearer undefined' }, tokenless)).toEqual({ action: 'deny' })
  })

  it('exempts the sign-in page and what it loads, but not image optimization', async () => {
    for (const path of ['/stealth', '/stealth/login', '/_next/static/chunks/app.js', '/icons/basalt-dark.svg', '/icons/site-light.svg', '/icons/basalt-dark-32.png', '/icons/site-light-32.png', '/apple-icon.png', '/favicon.ico'])
      expect(await page(path)).toEqual({ action: 'pass' })
    expect(await page('/_next/image')).toMatchObject({ action: 'redirect' })
    expect(await page('/stealthy')).toMatchObject({ action: 'redirect' })
  })

  it('disallows all crawling in robots.txt', async () => {
    expect(await page('/robots.txt')).toEqual({ action: 'robots' })
  })
})

describe('helpers', () => {
  it('compares secrets exactly', async () => {
    expect(await safeEqual('hunter2', 'hunter2')).toBe(true)
    expect(await safeEqual('hunter2', 'hunter3')).toBe(false)
    expect(await safeEqual('hunter2', 'hunter22')).toBe(false)
  })

  it('only follows same-site paths after sign-in', () => {
    expect(safeNext('/docs?a=1')).toBe('/docs?a=1')
    for (const bad of ['https://evil.dev', '//evil.dev', '/\\evil.dev', undefined, null]) expect(safeNext(bad)).toBe('/')
  })

  it('rate-limits attempts per key within the window', () => {
    const limiter = createRateLimiter(3, 1000)
    expect([1, 2, 3, 4].map(() => limiter.attempt('a', 0))).toEqual([true, true, true, false])
    expect(limiter.attempt('b', 0)).toBe(true)
    expect(limiter.attempt('a', 1000)).toBe(true)
    limiter.attempt('a', 1000)
    limiter.clear('a')
    expect(limiter.attempt('a', 1000)).toBe(true)
  })
})

describe('proxy', () => {
  afterEach(() => vi.unstubAllEnvs())
  const request = (path: string, headers: Record<string, string> = {}) => new NextRequest(`https://www.youj.dev${path}`, { headers })

  it('changes nothing while the switch is off', async () => {
    vi.stubEnv('STEALTH_PASSWORD', '')
    const response = await proxy(request('/r/button.json'))
    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(response.headers.get('X-Robots-Tag')).toBeNull()
  })

  it('redirects, denies and marks every response noindex while it is on', async () => {
    vi.stubEnv('STEALTH_PASSWORD', 'hunter2')
    vi.stubEnv('STEALTH_TOKEN', 'tok-123')
    const redirect = await proxy(request('/docs'))
    expect(redirect.status).toBe(307)
    expect(redirect.headers.get('location')).toBe('https://www.youj.dev/stealth?next=%2Fdocs')
    expect(redirect.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')

    const denied = await proxy(request('/r/button.json'))
    expect(denied.status).toBe(401)
    expect(await denied.json()).toMatchObject({ error: 'unauthorized' })
    expect(denied.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')

    const bearer = await proxy(request('/r/button.json', { authorization: 'Bearer tok-123' }))
    expect(bearer.headers.get('x-middleware-next')).toBe('1')
    expect(bearer.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')

    const cookie = await signSession(stealthConfig()!.secret)
    const session = await proxy(request('/', { cookie: `${STEALTH_COOKIE}=${cookie}` }))
    expect(session.headers.get('x-middleware-next')).toBe('1')

    const robots = await proxy(request('/robots.txt'))
    expect(await robots.text()).toBe('User-agent: *\nDisallow: /\n')
  })

  it('sends a mixed-case page URL to its lowercase path with a 308, before the gate, keeping the query', async () => {
    vi.stubEnv('STEALTH_PASSWORD', '')
    const off = await proxy(request('/DOCS/Components/Button?tab=Code'))
    expect(off.status).toBe(308)
    expect(off.headers.get('location')).toBe('https://www.youj.dev/docs/components/button?tab=Code')

    vi.stubEnv('STEALTH_PASSWORD', 'hunter2')
    const on = await proxy(request('/Docs'))
    expect(on.status).toBe(308)
    expect(on.headers.get('location')).toBe('https://www.youj.dev/docs')
    expect(on.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
    // The lowercase URL still meets the gate.
    expect((await proxy(request('/docs'))).status).toBe(307)
  })
})

describe('lowercasePath', () => {
  it('lowercases page paths only', () => {
    expect(lowercasePath('/DOCS/Theming')).toBe('/docs/theming')
    expect(lowercasePath('/docs/theming')).toBeUndefined()
    expect(lowercasePath('/docs/caf%C3%A9')).toBeUndefined()
    expect(lowercasePath('/Docs/caf%C3%A9')).toBe('/docs/caf%C3%A9')
    expect(lowercasePath('/r/Button.json')).toBeUndefined()
    expect(lowercasePath('/llms.TXT')).toBeUndefined()
    expect(lowercasePath('/API/search')).toBeUndefined()
  })
})

describe('proxy matcher', () => {
  // Next compiles the literal with path-to-regexp; an anchored RegExp is the same for this pattern.
  const woken = (pathname: string) => new RegExp(`^${proxyConfig.matcher[0]}$`).test(pathname)

  it('leaves static assets to the CDN', () => {
    for (const path of ['/_next/static/chunks/a.js', '/_next/image', '/a.webp', '/a.mp4', '/fonts/a.woff2', '/icons/site-light.svg', '/icons/site-light-32.png', '/favicon.ico'])
      expect(woken(path)).toBe(false)
  })

  it('still gates every page and data endpoint', () => {
    for (const path of ['/', '/docs/button', '/blocks/app', '/stealth', '/r/button.json', '/r/registry.json', '/api/search', '/llms.txt', '/docs/button.md', '/changelog.xml', '/showcase-index.json', '/samples/a.riv'])
      expect(woken(path)).toBe(true)
  })
})

describe('sign-in', () => {
  afterEach(() => vi.unstubAllEnvs())
  const post = (password: string, ip: string) =>
    new NextRequest('https://www.youj.dev/stealth/login', {
      method: 'POST',
      headers: { 'x-forwarded-for': ip },
      body: new URLSearchParams({ password, next: '/docs' }),
    })

  it('sets the session cookie on the right password and goes back, else returns to the form', async () => {
    vi.stubEnv('STEALTH_PASSWORD', 'hunter2')
    const { POST } = await import('../app/stealth/login/route.vercel')
    const wrong = await POST(post('nope', '1.1.1.1'))
    expect(wrong.status).toBe(303)
    expect(wrong.headers.get('location')).toBe('/stealth?error=wrong&next=%2Fdocs')
    const right = await POST(post('hunter2', '1.1.1.1'))
    expect(right.headers.get('location')).toBe('/docs')
    const cookie = right.cookies.get(STEALTH_COOKIE)!
    expect(cookie.httpOnly).toBe(true)
    expect(await verifySession(cookie.value, stealthConfig()!.secret)).toBe(true)
  })

  it('stops answering an IP after ten tries', async () => {
    vi.stubEnv('STEALTH_PASSWORD', 'hunter2')
    const { POST } = await import('../app/stealth/login/route.vercel')
    for (let i = 0; i < 10; i++) await POST(post('nope', '2.2.2.2'))
    expect((await POST(post('hunter2', '2.2.2.2'))).headers.get('location')).toBe('/stealth?error=rate&next=%2Fdocs')
  })
})

describe('robots.txt route', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('disallows everything while the gate is on', async () => {
    vi.stubEnv('STEALTH_PASSWORD', 'hunter2')
    const { default: robots } = await import('../app/robots')
    expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } })
  })

  it('allows everything and names the sitemap once the gate is off', async () => {
    vi.stubEnv('STEALTH_PASSWORD', '')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.youj.dev')
    const { default: robots } = await import('../app/robots')
    expect(robots()).toEqual({ rules: { userAgent: '*', allow: '/' }, sitemap: 'https://www.youj.dev/sitemap.xml' })
  })
})
