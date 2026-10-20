/* The site's response headers, in next.config.mjs's `headers()` shape. Plain JS, so
 * next.config.mjs can import it. The Cloudflare build serves the same list: as
 * _headers for files served straight from assets, and from the Worker for the
 * paths it fronts (lib/static-host.mjs). */

import { cspReportOnly, FRAME_ANCESTORS } from './csp.mjs'

/**
 * Promo videos and posters are on the media host (lib/media-url.ts), whose keys carry a content hash.
 * /r changes on every deploy
 * (the CDN is purged by one): five minutes in the browser, a day at the edge.
 *
 * @returns {{ source: string, headers: { key: string, value: string }[] }[]}
 */
export function headers() {
  return [
    // Every path. HSTS starts short; raise it once the site has run on https for a while. The CSP is report-only (lib/csp.mjs);
    // frame-ancestors is its own, enforced header, since report-only ignores it.
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=86400' },
        { key: 'Content-Security-Policy', value: FRAME_ANCESTORS },
        { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly() },
      ],
    },
    { source: '/fonts/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    { source: '/api/search', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400' }] },
    { source: '/r/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=300, s-maxage=86400, stale-while-revalidate=86400' }] },
    // A Code tab's files (app/code), like /r: they change with the source, on a deploy.
    { source: '/code/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=300, s-maxage=86400, stale-while-revalidate=86400' }] },
  ]
}
