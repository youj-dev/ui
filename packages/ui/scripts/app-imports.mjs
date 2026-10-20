// Rewrites a UI file's package imports to the paths `shadcn add` gives the
// files in an app, the way shadcn's own items import each other:
//   ./analytics-overview/data       → unchanged                (a file of the same item: shadcn leaves
//                                                           relative imports alone, see shadcn-imports.mjs)
//   ../../lib/utils             → @/lib/utils              (other relative imports: @/ + their path from src/)
//   ./button                    → @/components/ui/button
//   ../../hooks/use-mobile      → @/hooks/use-mobile
//   @youj/<pkg>/<src path>   → @/<src path>              (motion, icons and illustrations items keep their src layout)
//   @youj/<pkg>[/entry]      → one import per declaring file
// The CLI then maps `@/components`, `@/lib`, `@/hooks`… onto the app's own aliases.
import { posix } from 'node:path'
import { withUseClient } from '../../../scripts/use-client.mjs'
import { moduleReferences, motionFilesFor, sourceOf } from './motion-exports.mjs'

const stem = (file) => file.replace(/\.tsx?$/, '').replace(/\/index$/, '')
const alias = (file) => `@/${stem(file)}`

/**
 * @param {string} path the file's package path, e.g. `src/components/ui/button.tsx`
 * @param {Map<string, Map<string, string>>} entries from motionEntries()
 * @param {string[]} [own] package paths of the item's files, which keep importing each other relatively
 */
export function toAppImports(code, path, entries, own = []) {
  const siblings = new Set(own.map(stem))
  const edits = []
  for (const ref of moduleReferences(code, path)) {
    const { specifier } = ref
    const quote = code[ref.specifierStart]
    const respecify = (to) => edits.push([ref.specifierStart, ref.specifierEnd, `${quote}${to}${quote}`])
    if (specifier.startsWith('.')) {
      if (!siblings.has(stem(posix.join(posix.dirname(path), specifier)))) respecify(alias(posix.join(posix.dirname(path.replace(/^src\//, '')), specifier)))
    } else if (sourceOf(specifier)) {
      if (ref.bindings.some((b) => b.name === '*' || b.name === 'default')) {
        throw new Error(`${path}: ${specifier} needs named imports to map onto registry files`)
      }
      const files = motionFilesFor(specifier, ref.bindings.map((b) => b.name), entries)
      const byFile = Map.groupBy(ref.bindings, (b) => files.get(b.name))
      if (byFile.size === 1) {
        respecify(alias([...byFile.keys()][0]))
        continue
      }
      // One statement per file, keeping `type` and `as` exactly as written.
      const keyword = ref.kind === 'import' ? 'import' : 'export'
      const statements = [...byFile].map(([file, bindings]) => {
        const list = bindings
          .map((b) => `${b.typeOnly && !ref.typeOnly ? 'type ' : ''}${b.name}${b.local !== b.name ? ` as ${b.local}` : ''}`)
          .join(', ')
        return `${keyword}${ref.typeOnly ? ' type' : ''} { ${list} } from ${quote}${alias(file)}${quote}`
      })
      edits.push([ref.start, ref.end, statements.join('\n')])
    }
  }
  for (const [start, end, text] of edits.sort((a, b) => b[0] - a[0])) code = code.slice(0, start) + text + code.slice(end)
  return code
}

/**
 * A source file exactly as `shadcn add` writes it into an app: app aliases for
 * its imports, and "use client" on client modules. The registry build and the
 * docs' Code tab both use this, so the two never drift.
 * @param {string} path the file's package path, e.g. `src/blocks/app/billing.tsx`
 * @param {Map<string, Map<string, string>>} entries from motionEntries()
 * @param {string[]} [own] package paths of the item's files
 */
export function installedSource(code, path, entries, own) {
  return withUseClient(path, toAppImports(code, path, entries, own))
}
