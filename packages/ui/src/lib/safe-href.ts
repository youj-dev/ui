/** Control characters (U+0000–U+0020, U+007F) and spaces, which can smuggle a scheme. */
const smuggles = (url: string) => [...url].some((ch) => ch.charCodeAt(0) <= 0x20 || ch.charCodeAt(0) === 0x7f)

/**
 * A URL that is safe to link to: absolute http(s) or mailto, nothing else.
 * javascript:, data:, vbscript:, file: and relative URLs come back null, so
 * the caller renders text. For links an app builds from its own routes, which
 * may be relative, use safeLink.
 */
export function safeHref(raw: string): string | null {
  const url = raw.trim()
  // Control characters and whitespace can smuggle a scheme ("java\tscript:").
  if (!url || smuggles(url)) return null
  if (!/^(?:https?:\/\/|mailto:)/i.test(url)) return null
  try {
    const parsed = new URL(url)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}

/**
 * A link built from row or app data: what safeHref accepts, plus relative
 * links (`/orders/12`, `#top`, `?page=2`, `../x`, `orders/12`), which carry no
 * scheme. Anything with another scheme, or with control characters or
 * whitespace, is null and the caller renders it inert.
 */
export function safeLink(raw: string | null | undefined): string | null {
  const url = raw?.trim()
  if (!url) return null
  if (smuggles(url)) return null
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return safeHref(url)
  return url
}
