// How `shadcn add` (4.x) re-resolves an installed file's `@/` imports, and
// the registry imports it would point at the wrong file.
//
// After writing an item's files, shadcn resolves every `@/` import
// declaration (not re-exports, not relative imports) to a file and writes
// that file's alias back. Its candidates are the import's own path (`<p>.tsx`,
// `<p>.ts`, …, `<p>/index.*`) and EVERY file it's adding in the same run whose
// name is the import's last segment. It ranks them by extension first
// (.tsx, .ts, .js, .jsx, .css) and only then by sitting under the import's
// path. So with `shell/data.tsx` in the batch, `@/blocks/…/analytics-overview/data`
// (a .ts) becomes `@/blocks/frame/shell/data`, and `@/components/ui/data-table`
// (a folder's index.ts) becomes its own `data-table/data-table.tsx`.
//
// Relative imports are left alone, which is why an item's files import each
// other relatively (scripts/app-imports.mjs). An import between items that
// would still land on a namesake is pinned to its file (`@/components/ui/data-table/index`,
// or `…/themes/terminal.ts` where only the extension tells it apart): the
// pinned file is then the only best-ranked candidate under the import's path,
// and shadcn writes the alias back without `/index` or the extension, so the
// app gets the plain `@/components/ui/data-table`.
import { readdirSync, readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import { installedSource } from './app-imports.mjs'
import { moduleReferences } from './motion-exports.mjs'

const EXTENSIONS = ['.tsx', '.ts', '.js', '.jsx', '.css']
/** Files a shadcn app already has that registry items import but don't ship. */
const APP_FILES = ['lib/utils.ts']

/**
 * The file shadcn points `@/<path>` at (its resolveImportToFile), or null.
 * @param {string} path the import without its `@/`, e.g. `blocks/app/analytics-overview/data`
 * @param {Set<string>} added targets of the files in the batch
 * @param {Set<string>} existing targets already in the app
 */
export function shadcnTarget(path, added, existing = new Set()) {
  const ext = posix.extname(path)
  const stem = ext ? path.slice(0, -ext.length) : path
  const extensions = ext ? [ext] : EXTENSIONS
  const has = (file) => added.has(file) || existing.has(file)
  const found = new Set()
  for (const e of extensions) {
    if (has(stem + e)) found.add(stem + e)
    if (has(`${stem}/index${e}`)) found.add(`${stem}/index${e}`)
  }
  const name = posix.basename(stem)
  for (const file of added) if (extensions.some((e) => file.endsWith(`/${name}${e}`))) found.add(file)
  const under = (file) => (file.startsWith(stem) ? -1 : 1)
  const rank = (file) => extensions.indexOf(posix.extname(file))
  return [...found].sort((a, b) => rank(a) - rank(b) || under(a) - under(b))[0] ?? null
}

/** The file an `@/` import means, the way TypeScript resolves it. */
function intended(path, files) {
  return ['.ts', '.tsx', '/index.ts', '/index.tsx'].map((e) => path + e).find((f) => files.has(f)) ?? null
}

/** The `@/` import declarations in a file: the ones shadcn re-resolves. */
const aliasImports = (code, path) => moduleReferences(code, path).filter((ref) => ref.kind === 'import' && ref.specifier.startsWith('@/'))

/** What a batch of every item holds: the files it adds, and those the app has. */
function batch(items) {
  const added = new Set(items.flatMap((i) => i.files.map((f) => f.target)))
  const existing = new Set(APP_FILES)
  return { added, existing, all: new Set([...added, ...existing]) }
}

/**
 * Every `@/` import in the items' installed files that shadcn would point at a
 * different file, were all the items added together (the worst case: a file
 * can only be misrouted to a namesake that's in the batch).
 * @param {{ name: string, files: { target: string, content: string }[] }[]} items with installed contents
 * @returns {{ item: string, file: string, specifier: string, want: string, got: string | null }[]}
 */
export function misroutedImports(items) {
  const { added, existing, all } = batch(items)
  const found = []
  for (const item of items) {
    for (const file of item.files) {
      if (!/\.[jt]sx?$/.test(file.target)) continue
      for (const { specifier } of aliasImports(file.content, file.target)) {
        const want = intended(specifier.slice(2), all)
        const got = shadcnTarget(specifier.slice(2), added, existing)
        if (want && got !== want) found.push({ item: item.name, file: file.target, specifier, want, got })
      }
    }
  }
  return found
}

/**
 * The imports to pin: each `@/` import shadcn would misroute, mapped to the
 * plainest spelling of its file that shadcn resolves right. A folder's index
 * keeps `/index` (`@/components/ui/data-table/index`, still valid TypeScript
 * should shadcn not rewrite it); a file with a better-ranked namesake keeps its
 * extension (`@/lib/youj/theme/themes/terminal.ts`).
 * @returns {Map<string, string>}
 */
export function importPins(items) {
  const { added, existing } = batch(items)
  const pins = new Map()
  for (const { specifier, want } of misroutedImports(items)) {
    const spellings = [want.replace(/\.[jt]sx?$/, ''), want]
    pins.set(specifier, `@/${spellings.find((s) => shadcnTarget(s, added, existing) === want) ?? want}`)
  }
  return pins
}

/** Rewrites a file's pinned `@/` imports (import declarations only: shadcn doesn't re-resolve re-exports). */
export function pinImports(code, path, pins) {
  for (const ref of aliasImports(code, path).reverse()) {
    const pinned = pins.get(ref.specifier)
    if (pinned) code = code.slice(0, ref.specifierStart + 1) + pinned + code.slice(ref.specifierEnd - 1)
  }
  return code
}

const fragments = (dir) =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))

/**
 * Every item the docs site serves side by side (UI, motion, icons, illustrations, sound), with each
 * file's install target and, for UI's, the source `shadcn add` receives
 * before pinning. Motion's and sound's files only count as namesakes here:
 * their own builds write their imports.
 * @param {string} root packages/ui
 * @param {Map<string, Map<string, string>>} entries from motionEntries()
 */
export function servedItems(root, entries) {
  const ui = fragments(join(root, 'registry')).map((item) => ({
    name: item.name,
    files: item.files.map((f) => ({
      target: f.target ?? f.path.replace(/^src\//, ''),
      content: /\.tsx?$/.test(f.path) ? installedSource(readFileSync(join(root, f.path), 'utf8'), f.path, entries, item.files.map((x) => x.path)) : '',
    })),
  }))
  const namesakes = (pkg, targetFor) =>
    fragments(join(root, '..', pkg, 'registry')).map((item) => ({
      name: item.name,
      files: (item.files ?? []).map((f) => ({ target: f.target ?? targetFor(f.path), content: '' })),
    }))
  const own = (p) => p.replace(/^src\//, '')
  return [...ui, ...namesakes('motion', own), ...namesakes('icons', own), ...namesakes('illustrations', own), ...namesakes('sound', (p) => p.replace(/^src\//, 'lib/youj/sound/'))]
}
