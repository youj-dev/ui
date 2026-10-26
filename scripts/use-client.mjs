// Marks React client modules with "use client", in the package builds and in
// registry items, so Next.js and other RSC frameworks can import youj from
// server components. Both packages publish one ESM file per source module, so
// the boundary sits exactly on the modules that need the client.
//
// A client module is one that:
//   - already says "use client",
//   - is a .tsx component, or
//   - imports runtime values (hooks, context) from react or motion/react.
// Barrels and plain .ts helpers (tokens, cn, GLSL, colour maths) stay
// server-safe, so `cn` and the tokens work in server components too.

const DIRECTIVE_LITERAL = /['"]use client['"]/y
const CLIENT_IMPORT = /^import\s+(?!type\s)([^'";]+?)\s+from\s+['"](?:react|motion\/react)['"]/gm

/**
 * Whether the source opens with "use client", after any whitespace and comments. A scan, not one
 * regex: nested quantifiers around the comment forms backtrack badly on a file of many comments.
 * @param {string} source
 */
export function hasUseClientDirective(source) {
  let i = 0
  for (;;) {
    while (i < source.length && /\s/.test(source[i])) i++
    if (source.startsWith('//', i)) {
      const end = source.indexOf('\n', i)
      if (end < 0) return false
      i = end + 1
    } else if (source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2)
      if (end < 0) return false
      i = end + 2
    } else break
  }
  DIRECTIVE_LITERAL.lastIndex = i
  return DIRECTIVE_LITERAL.test(source)
}

/** @param {string} path @param {string} source */
export function isClientModule(path, source) {
  if (hasUseClientDirective(source) || path.endsWith('.tsx')) return true
  for (const [, clause] of source.matchAll(CLIENT_IMPORT)) {
    const names = clause.replace(/[{}]/g, '').split(',').map((n) => n.trim())
    if (names.some((n) => n && !n.startsWith('type '))) return true
  }
  return false
}

/** Prepends the directive to a client module that lacks it. */
export function withUseClient(path, source) {
  return !hasUseClientDirective(source) && isClientModule(path, source) ? `'use client'\n\n${source}` : source
}

/** A Rolldown plugin applying withUseClient to the package's own modules. */
export function useClient() {
  return {
    name: 'youj:use-client',
    transform: {
      filter: { id: { include: /\.tsx?$/, exclude: /node_modules/ } },
      handler(code, id) {
        const next = withUseClient(id, code)
        return next === code ? null : { code: next, map: null }
      },
    },
  }
}
