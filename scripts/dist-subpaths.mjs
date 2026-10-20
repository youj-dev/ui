// Finds `@youj/<pkg>/<subpath>` imports in built files that the target package's
// `exports` map doesn't expose. A published package only exposes its entries, so
// such an import works in the workspace (where a path resolves to src/) and fails
// in every app's bundler. Used by scripts/check-packages.mjs on each packed dist.

/** Whether an `exports` map exposes a subpath ('.', './internal', './locales/en'). Patterns use one `*`. */
export function exposes(exportsMap, subpath) {
  if (!exportsMap || typeof exportsMap !== 'object' || Array.isArray(exportsMap)) return subpath === '.' && Boolean(exportsMap)
  return Object.keys(exportsMap).some((key) => {
    if (!key.includes('*')) return key === subpath
    const [prefix, suffix] = key.split('*')
    return subpath.length >= key.length - 1 && subpath.startsWith(prefix) && subpath.endsWith(suffix)
  })
}

const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)(["'])(@youj\/[^"']+)\1/g

/** The `@youj/*` specifiers a file imports, with the line they're on. */
export function youjSpecifiers(code) {
  return [...code.matchAll(IMPORT)].map((m) => ({ specifier: m[2], line: code.slice(0, m.index).split('\n').length }))
}

/**
 * Specifiers in `code` that the target's exports don't expose.
 * @param {string} code
 * @param {Record<string, unknown>} exportsByName package name → published `exports` map
 */
export function unexposedImports(code, exportsByName) {
  return youjSpecifiers(code).filter(({ specifier }) => {
    const pkg = specifier.match(/^@youj\/[^/]+/)?.[0]
    if (!pkg || !(pkg in exportsByName)) return false
    const sub = specifier.slice(pkg.length)
    return !exposes(exportsByName[pkg], sub ? `.${sub}` : '.')
  })
}
