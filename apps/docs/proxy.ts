import { NextResponse, type NextRequest } from 'next/server'
import { lowercasePath } from './lib/case-redirect'
import { decide, NOINDEX, ROBOTS_DISALLOW, STEALTH_COOKIE, stealthConfig } from './lib/stealth'

/**
 * `/DOCS/Theming` gets a permanent redirect to `/docs/theming` first (lib/case-redirect.ts); the gate
 * then judges the lowercase URL. Then the stealth-launch gate (lib/stealth.ts): a no-op unless
 * STEALTH_PASSWORD is set.
 */
export async function proxy(request: NextRequest) {
  const config = stealthConfig()
  const lower = lowercasePath(request.nextUrl.pathname)
  if (lower) {
    const url = request.nextUrl.clone()
    url.pathname = lower
    const redirect = NextResponse.redirect(url, 308)
    if (config) redirect.headers.set('X-Robots-Tag', NOINDEX)
    return redirect
  }
  if (!config) return NextResponse.next()
  const { pathname, search } = request.nextUrl
  const decision = await decide(
    { pathname, search, cookie: request.cookies.get(STEALTH_COOKIE)?.value, authorization: request.headers.get('authorization') },
    config,
  )
  const response =
    decision.action === 'pass'
      ? NextResponse.next()
      : decision.action === 'robots'
        ? new NextResponse(ROBOTS_DISALLOW, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        : decision.action === 'deny'
          ? NextResponse.json(
              { error: 'unauthorized', message: 'This site is private for now. Send Authorization: Bearer <token>.' },
              { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="youj"', 'Cache-Control': 'no-store' } },
            )
          : NextResponse.redirect(new URL(decision.location, request.url))
  response.headers.set('X-Robots-Tag', NOINDEX)
  return response
}

/*
 * The matcher decides which requests wake the proxy at all. On Vercel each one is a Node.js function
 * invocation (Next 16 proxies can't run on the edge), and a page view used to make 20-45 of them: the
 * page, its `_rsc` prefetches, every image and video range request.
 *
 * Skipped, so they go straight to the CDN: everything under /_next/ (the build's hashed files, which
 * the sign-in page needs, and /_next/image), and files with a media or font extension. None of these is a page or a data endpoint.
 * The trade-off: a visitor without the cookie can fetch those files if they know the URL. The site's
 * screenshots and videos are served from the media host, not from here; /_next/image only optimises
 * images from public/.
 *
 * Still gated, on purpose: every page, /r/**, /api/** and the .json, .md, .txt and .xml files.
 * RSC prefetches are NOT skipped. A `Next-Router-Prefetch` or `RSC` header can be sent by anyone, and
 * the payload it returns is the page's whole content, so skipping on it would open the gate.
 * Fewer prefetches come from `prefetch={false}` on secondary links instead.
 * The pattern has to stay a literal for Next; lib/stealth.test.ts checks what it lets through.
 */
export const config = {
  matcher: ['/((?!_next/|.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|mp4|webm)$).*)'],
}
