/**
 * Page URLs are lowercase, so `/DOCS/Theming` should land on `/docs/theming` rather than a 404.
 * Returns the lowercase pathname to redirect to, or undefined when the path should be left alone:
 * already lowercase, an API route, or a file (`/r/Button.json`, `/llms.txt`), whose names can
 * legitimately carry capitals. Percent escapes (`%2F`) don't count as capitals.
 */
export function lowercasePath(pathname: string): string | undefined {
  if (!/[A-Z]/.test(pathname.replace(/%[0-9A-F]{2}/gi, ''))) return undefined
  if (/^\/api(\/|$)/i.test(pathname)) return undefined
  if (/\.[a-z0-9]+$/i.test(pathname.split('/').at(-1) ?? '')) return undefined
  return pathname.replace(/%[0-9A-F]{2}|[^%]+/gi, (part) => (part.startsWith('%') ? part : part.toLowerCase()))
}
