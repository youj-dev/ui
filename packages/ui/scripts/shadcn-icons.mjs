// lucide-react → Youj icons, for files `shadcn add` produces.
//
// shadcn's CLI can't be pointed at our icons: `iconLibrary` in components.json
// only selects one of its built-in libraries (lucide, tabler, hugeicons,
// phosphor, remixicon; see ICON_LIBRARIES in the installed shadcn package), and
// an unknown value leaves every IconPlaceholder unresolved. So components.json
// keeps "lucide", whose names every registry item carries, and this rewrite
// swaps each lucide import for its Youj equivalent. An icon with no
// equivalent throws, naming it, rather than letting lucide-react back in.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ICONS = join(dirname(fileURLToPath(import.meta.url)), '../../icons')
const YOUJ_ICONS = '@youj/icons'

/* Where the names differ but the meaning doesn't. Everything else is derived
 * from lucide's own aliases (the ones the docs' icon catalogue lists). */
const OVERRIDES = {
  CircleCheck: 'CheckCircleIcon',
  GripVertical: 'GripIcon',
  Loader: 'LoaderRingIcon',
  LoaderCircle: 'LoaderRingIcon',
  OctagonX: 'CircleXIcon',
  PanelLeft: 'SidebarIcon',
}

/** `ChevronDownIcon`, `LucideChevronDown` and `ChevronDown` → `ChevronDown`. */
const word = (exportName) => exportName.replace(/^Lucide(?=[A-Z])/, '').replace(/(?<=.)Icon$/, '')

/** Export names of the Youj icon set, read from its generated index. */
export function youjIconNames(indexSource = readFileSync(join(ICONS, 'src/components/youj/icons/index.ts'), 'utf8')) {
  return new Set([...indexSource.matchAll(/^import \{ (\w+Icon) \} from '\.\//gm)].map((m) => m[1]))
}

/** lucide-react as installed for motion (a devDependency there; this package no longer depends on it). */
export function loadLucide() {
  return createRequire(join(ICONS, 'package.json'))('lucide-react')
}

/**
 * Every lucide word (canonical or alias) → the Youj export for it. A lucide
 * icon maps when one of its names, or an override, names a Youj icon.
 */
export function buildLucideMap(lucide, youj) {
  const groups = new Map()
  for (const [name, value] of Object.entries(lucide)) {
    if (!/^[A-Z]/.test(name) || name === 'Icon' || (typeof value !== 'object' && typeof value !== 'function')) continue
    let words = groups.get(value)
    if (!words) groups.set(value, (words = new Set()))
    words.add(word(name))
  }
  const map = new Map()
  for (const words of groups.values()) {
    const all = [...words]
    const target = all.map((w) => OVERRIDES[w]).find(Boolean) ?? all.map((w) => `${w}Icon`).find((n) => youj.has(n))
    if (target) for (const w of all) map.set(w, target)
  }
  return map
}

const LUCIDE_IMPORT = /import\s+(type\s+)?\{([^}]*)\}\s+from\s+(["'])lucide-react\3;?/g

/**
 * Rewrites `import { XIcon, Check as Tick } from "lucide-react"` to Youj
 * imports, renaming unaliased uses in the file when the Youj name differs.
 * Throws on a type import or an icon without an equivalent.
 */
export function rewriteLucideImports(source, map, path = 'file') {
  const renames = []
  const unmapped = []
  let out = source.replace(LUCIDE_IMPORT, (_, typeOnly, list) => {
    if (typeOnly) unmapped.push('a type import (use YoujIconComponent from @youj/icons)')
    const specifiers = list.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
      const [imported, local] = s.split(/\s+as\s+/)
      const target = map.get(word(imported))
      if (!target) {
        unmapped.push(imported)
        return s
      }
      if (local) return target === local ? target : `${target} as ${local}`
      if (target !== imported) renames.push([imported, target])
      return target
    })
    return `import { ${[...new Set(specifiers)].join(', ')} } from '${YOUJ_ICONS}'`
  })
  if (unmapped.length) {
    throw new Error(`${path}: no Youj icon for lucide ${unmapped.join(', ')}. Add a mapping to OVERRIDES in scripts/shadcn-icons.mjs, or draw the icon in @youj/motion first.`)
  }
  for (const [from, to] of renames) out = out.replace(new RegExp(`(?<![\\w$.'"/-])${from}(?![\\w$])`, 'g'), to)
  return out
}
