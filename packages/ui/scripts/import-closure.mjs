// The UI registry's import closure: a relative import in an item's files must
// land in the item or in its (transitive) registry dependencies, and a name
// imported from @youj/motion must be declared in a file that one of the
// motion items among them ships. Otherwise `shadcn add` copies code that
// can't compile. Motion's own registry check does the same for its items.
import { readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import { moduleReferences, motionFilesFor, sourceOf } from './motion-exports.mjs'

const stripExt = (path) => path.replace(/\.(tsx?|css)$/, '').replace(/\/index$/, '')
const DYNAMIC = /import\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g

/**
 * @param {{ root: string, items: object[], motionItems: object[], entries: Map<string, Map<string, string>> }} registry
 *   UI items and motion items as in their fragments, `entries` from motionEntries()
 * @returns {string[]} one line per import an item can't satisfy
 */
export function importClosureProblems({ root, items, motionItems, entries }) {
  const byName = new Map([...motionItems.map((i) => [i.name, { item: i, pkg: 'motion' }]), ...items.map((i) => [i.name, { item: i, pkg: 'ui' }])])
  const closure = (name, seen = new Set()) => {
    if (seen.has(name) || !byName.has(name)) return seen
    seen.add(name)
    // A dependency given as a URL lives elsewhere and can't be followed.
    for (const dep of byName.get(name).item.registryDependencies ?? []) if (!dep.includes('/')) closure(dep, seen)
    return seen
  }

  const problems = []
  for (const item of items) {
    const reachable = { ui: new Set(), motion: new Set() }
    for (const name of closure(item.name)) {
      const { item: dep, pkg } = byName.get(name)
      // A stand-in file (registry/stubs) arrives at its target, and answers for the file it replaces.
      for (const file of dep.files ?? []) reachable[pkg].add(stripExt(file.target ? `src/${file.target}` : file.path))
    }
    const missing = (file, what) => problems.push(`${item.name}: ${file} imports ${what}, which isn't in the item or its registry dependencies`)

    for (const { path } of item.files ?? []) {
      if (!/\.tsx?$/.test(path)) continue
      const code = readFileSync(join(root, path), 'utf8')
      const relative = (specifier) => reachable.ui.has(stripExt(posix.join(posix.dirname(path), specifier)))
      for (const { specifier, bindings } of moduleReferences(code, path)) {
        if (specifier.startsWith('.')) {
          if (!relative(specifier)) missing(path, specifier)
        } else if (sourceOf(specifier)) {
          try {
            for (const [name, file] of motionFilesFor(specifier, bindings.map((b) => b.name), entries)) {
              if (!reachable.motion.has(stripExt(`src/${file}`))) missing(path, `${name} from ${specifier} (motion's src/${file})`)
            }
          } catch (error) {
            problems.push(`${item.name}: ${path}: ${error.message}`)
          }
        }
      }
      for (const [, specifier] of code.matchAll(DYNAMIC)) if (!relative(specifier)) missing(path, specifier)
    }
  }
  return problems
}
