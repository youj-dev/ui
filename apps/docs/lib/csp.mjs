/* The Content-Security-Policy the site sends, in report-only mode (lib/headers.mjs). Plain JS, like headers.mjs.
 *
 * Why script-src keeps 'unsafe-inline' and lists no hashes: the fixed inline scripts (the theme and brand
 * scripts, React's streaming helpers, the /view mark, the analytics loader) could be hashed, but Next's flight
 * payloads (`self.__next_f.push([1,"..."])`) are inline too and differ on every page (940 distinct ones in 864
 * pages), and a header applies to a whole path. A hash list can't cover them, and once a hash is listed the
 * browser ignores 'unsafe-inline'. Per-request nonces need a server; the static host has none. So the script
 * rule limits where scripts may come from (this origin and the analytics beacon), not which inline ones run.
 *
 * Report-only ignores frame-ancestors, so that one is sent enforced, on its own (lib/headers.mjs). */

const mediaOrigin = () => new URL(process.env.NEXT_PUBLIC_MEDIA_URL || 'https://media.youj.dev').origin

/** The policy's directives, in the order they are written. */
export function cspDirectives() {
  const media = mediaOrigin()
  return [
    ["default-src", "'self'"],
    ['script-src', "'self' 'unsafe-inline' https://static.cloudflareinsights.com"],
    ['style-src', "'self' 'unsafe-inline'"],
    ['font-src', "'self' data:"],
    ['img-src', `'self' data: blob: ${media}`],
    ['media-src', `'self' blob: ${media}`],
    ['connect-src', `'self' ${media} https://cloudflareinsights.com`],
    // The /view/* previews are this site's own pages in frames.
    ['frame-src', "'self'"],
    ['worker-src', "'self' blob:"],
    ['object-src', "'none'"],
    ['base-uri', "'self'"],
    ['form-action', "'self'"],
  ]
}

export const cspReportOnly = () => cspDirectives().map(([name, value]) => `${name} ${value}`).join('; ')

/** Enforced: who may frame the site. 'self', not 'none': the site embeds its own /view/* pages. */
export const FRAME_ANCESTORS = "frame-ancestors 'self'"
