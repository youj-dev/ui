import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { buildKit } from '../src/data/build-kit'
import { run } from '../src/plugin/run'
import { DOCS } from '../src/plugin/sheets/components'
import { KEY } from '../src/plugin/store'
import { allNodes, installFakeFigma, type FakeEnv } from './fake-figma'
import baselineJson from './parity-baseline.json'

/* Typed, since an empty list would read as never[]. */
const baseline = baselineJson as { ceiling: { components: number; blocks: number }; components: string[]; blocks: string[]; variantGaps: string[] }

/* Parity between the code and the Figma kit, read from the real sources: which
 * components, blocks and examples the kit draws and which it doesn't, and
 * whether what it claims to draw still matches the code.
 *
 * - Components: every file or folder in packages/ui/src/components/ui. A drawn
 *   one is a component set on the Components page (its file comes from the
 *   set's docs). The rest are in parity-baseline.json.
 * - Blocks: every block under packages/ui/src/blocks. A drawn one is a reference image in assets/blocks (its story id
 *   names it). The rest are in the baseline.
 * - Drift: a drawn set's Variant, Size... properties and their values are the
 *   `cva` keys in its file, and every `role/*` colour it names is a role the
 *   kit has.
 *
 * The baseline only shrinks: an undrawn item must be in it, a drawn one must
 * not be (remove it), and the totals can't go up. */

const repo = new URL('../../../', import.meta.url).pathname
const ui = join(repo, 'packages/ui/src')
const kit = buildKit()

const isSource = (f: string) => /\.tsx?$/.test(f) && !/\.(test|stories|fixtures|ssr-cases|variants|press|hold|land)\./.test(f) && !/\.d\.ts$/.test(f)
const entries = (dir: string) => readdirSync(dir).sort()
const isDir = (p: string) => statSync(p).isDirectory()

/** Every component: a file, or a folder of them, in components/ui. */
function codeComponents(): string[] {
  const dir = join(ui, 'components/ui')
  return entries(dir)
    .filter((f) => (isDir(join(dir, f)) ? true : isSource(f)))
    .map((f) => f.replace(/\.tsx?$/, ''))
    .filter((v, i, all) => all.indexOf(v) === i)
}

/** Every block as `category/name`. */
function codeBlocks(): string[] {
  const out: string[] = []
  const blocks = join(ui, 'blocks')
  for (const category of entries(blocks).filter((c) => isDir(join(blocks, c)))) {
    for (const f of entries(join(blocks, category))) {
      if (isDir(join(blocks, category, f))) out.push(`${category}/${f}`)
      else if (isSource(f)) out.push(`${category}/${f.replace(/\.tsx?$/, '')}`)
    }
  }
  return [...new Set(out)]
}

/** A block's reference image names it by story: `blocks-<category>-<name>--story`. */
function drawnBlock(story: string, known: string[]): string | undefined {
  const id = story.split('--')[0]!
  return known.find((b) => id === `blocks-${b.replace('/', '-')}`)
}

/** The component a set draws, from its docs: the first part of its file under components/ui. */
const COMPANION: Record<string, string> = {
  'component:toggle-group': 'component:toggle',
  'component:radio-group': 'component:radio',
  'component:dropdown-menu': 'component:menu-item',
  'component:tabs': 'component:tabs-trigger',
  'component:pagination': 'component:pagination-link',
}
function drawnFiles(key: string): string[] {
  return (DOCS[key]?.file ?? DOCS[COMPANION[key] ?? '']?.file ?? '')
    .split(' · ')
    .map((f) => f.trim())
    .filter(Boolean)
    .map((f) => (f.startsWith('packages/') ? f : `packages/ui/src/components/ui/${f}`))
}
const componentOf = (file: string) => (file.startsWith('packages/ui/src/components/ui/') ? file.replace('packages/ui/src/components/ui/', '').split('/')[0]!.replace(/(\.variants)?\.tsx?$/, '') : file)

/** The keys of every `cva` variants group in a source: { variant: [...], size: [...] }. */
export function cvaVariants(source: string): Record<string, string[]> {
  const start = source.indexOf('variants: {')
  if (start < 0) return {}
  const groups: Record<string, string[]> = {}
  let depth = 0
  let group = ''
  let i = start + 'variants: '.length
  for (; i < source.length; i++) {
    const ch = source[i]!
    if (ch === '{' || ch === '[' || ch === '(') depth++
    else if (ch === '}' || ch === ']' || ch === ')') {
      if (--depth === 0) break
    } else if (ch === "'" || ch === '"' || ch === '`') {
      // Skip string values, but read a quoted key (depth 1 or 2 followed by a colon).
      const end = source.indexOf(ch, i + 1)
      const text = source.slice(i + 1, end)
      if ((depth === 1 || depth === 2) && /^\s*:/.test(source.slice(end + 1))) {
        if (depth === 1) groups[(group = text)] = []
        else groups[group]!.push(text)
      }
      i = end
    } else if (depth <= 2 && /[A-Za-z_]/.test(ch) && !/[\w$]/.test(source[i - 1] ?? '')) {
      const m = /^([A-Za-z_][\w$]*)\s*:/.exec(source.slice(i))
      if (m && depth === 1) groups[(group = m[1]!)] = []
      else if (m && depth === 2) groups[group]!.push(m[1]!)
      if (m) i += m[1]!.length - 1
    }
  }
  return groups
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const read = (file: string) => (existsSync(join(repo, file)) ? readFileSync(join(repo, file), 'utf8') : '')

interface DrawnSet {
  key: string
  name: string
  props: Record<string, Set<string>>
}

let env: FakeEnv
let sets: DrawnSet[]

beforeAll(async () => {
  env = installFakeFigma({ modeLimit: 10 }).env
  await run(kit, 'build')
  sets = allNodes(env)
    .filter((n) => n.type === 'COMPONENT_SET' && n.getPluginData(KEY).startsWith('component:'))
    .map((set) => {
      const props: Record<string, Set<string>> = {}
      for (const v of set.rawChildren()) for (const [k, val] of Object.entries(v.variantProperties ?? {})) (props[k] ??= new Set()).add(val)
      return { key: set.getPluginData(KEY), name: set.name, props }
    })
}, 120_000)

const components = codeComponents()
const blocks = codeBlocks()

describe('components', () => {
  const drawn = () => new Set(sets.flatMap((s) => drawnFiles(s.key).map(componentOf)))

  test('every drawn set is drawn from a component that exists', () => {
    const missing = sets.flatMap((s) => (drawnFiles(s.key).length ? [] : [`${s.key} names no file in its docs`]))
    const gone = sets.flatMap((s) => drawnFiles(s.key).filter((f) => f.includes('/components/ui/') && !existsSync(join(repo, f.replace(/\/$/, '')))).map((f) => `${s.key}: ${f}`))
    expect([...missing, ...gone]).toEqual([])
  })

  test('the components not drawn yet are listed, and only those', () => {
    const undrawn = components.filter((c) => !drawn().has(c))
    expect(undrawn.filter((c) => !baseline.components.includes(c)), 'draw it in the kit, or (if the owner agrees) list it in test/parity-baseline.json').toEqual([])
    expect(baseline.components.filter((c) => !undrawn.includes(c)), 'drawn or gone: remove it from test/parity-baseline.json').toEqual([])
  })

  test('the baseline only shrinks', () => {
    expect(baseline.components.length).toBeLessThanOrEqual(baseline.ceiling.components)
    expect(baseline.blocks.length).toBeLessThanOrEqual(baseline.ceiling.blocks)
  })

  test('reports the coverage', () => {
    const covered = components.filter((c) => drawn().has(c))
    console.info(`Figma parity, components: ${covered.length} of ${components.length} drawn (${sets.length} sets); blocks: ${kit.blocks.length} of ${blocks.length} as reference images; icons: ${kit.icons.length}`)
    expect(covered.length + baseline.components.length).toBe(components.length)
  })
})

describe('blocks', () => {
  test('every reference image names a block that still exists', () => {
    expect(kit.blocks.filter((b) => !drawnBlock(b.story, blocks)).map((b) => `${b.id}: ${b.story}`)).toEqual([])
  })

  test('the blocks without a reference image are listed, and only those', () => {
    const drawn = new Set(kit.blocks.map((b) => drawnBlock(b.story, blocks)))
    const undrawn = blocks.filter((b) => !drawn.has(b))
    expect(undrawn.filter((b) => !baseline.blocks.includes(b))).toEqual([])
    expect(baseline.blocks.filter((b) => !undrawn.includes(b)), 'drawn or gone: remove it from test/parity-baseline.json').toEqual([])
  })
})

describe('drawn sets match the code', () => {
  /** The cva groups of a set's files: `variant` → its keys. */
  const codeGroups = (key: string) => {
    const groups: Record<string, string[]> = {}
    for (const file of drawnFiles(key).filter((f) => f.endsWith('.tsx'))) {
      for (const f of [file, file.replace(/\.tsx$/, '.variants.tsx')]) Object.assign(groups, cvaVariants(read(f)))
    }
    return groups
  }

  test('a drawn Variant, Size... property has exactly the code’s values, bar the ones listed', () => {
    const problems: string[] = []
    const gaps = new Set<string>(baseline.variantGaps)
    const used = new Set<string>()
    for (const set of sets) {
      // The composites (Toggle group, Radio group, Dropdown menu, Tabs, Pagination) are built from the primitives checked here.
      if (COMPANION[set.key]) continue
      const owner = set.key.replace('component:', '')
      for (const [group, keys] of Object.entries(codeGroups(set.key))) {
        const prop = capital(group)
        const drawn = set.props[prop]
        if (!drawn) {
          // The code has a group the set doesn't draw at all.
          for (const k of keys) {
            const gap = `${owner}.${group}.${k}`
            if (gaps.has(gap)) used.add(gap)
          }
          if (!keys.every((k) => gaps.has(`${owner}.${group}.${k}`)) && set.props.Variant !== undefined) problems.push(`${set.key}: the code has ${group} (${keys.join(', ')}) and the set has no ${prop} property`)
          continue
        }
        for (const k of keys) {
          const gap = `${owner}.${group}.${k}`
          if (drawn.has(k)) {
            if (gaps.has(gap)) problems.push(`${gap} is drawn now: remove it from variantGaps in test/parity-baseline.json`)
          } else if (gaps.has(gap)) used.add(gap)
          else problems.push(`${set.key}: the code's ${group}="${k}" isn't a ${prop} value in the set (has ${[...drawn].join(', ')})`)
        }
        for (const v of drawn) if (!keys.includes(v)) problems.push(`${set.key}: ${prop}="${v}" isn't in the code (has ${keys.join(', ')})`)
      }
    }
    for (const gap of gaps) if (!used.has(gap) && !problems.some((p) => p.startsWith(gap))) problems.push(`${gap} no longer exists in the code: remove it from variantGaps`)
    expect(problems).toEqual([])
  })

  test('every role a drawing names is a colour the kit has', () => {
    const roles = new Set(kit.colors.map((c) => c.name))
    const dir = join(import.meta.dirname, '../src/plugin')
    const files = (d: string): string[] => entries(d).flatMap((f) => (isDir(join(d, f)) ? files(join(d, f)) : f.endsWith('.ts') ? [join(d, f)] : []))
    const missing = files(dir).flatMap((f) => [...new Set(readFileSync(f, 'utf8').match(/\brole\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*/g) ?? [])].filter((r) => !roles.has(r)).map((r) => `${f.slice(dir.length + 1)}: ${r}`))
    expect(missing).toEqual([])
  })
})

describe('cvaVariants', () => {
  test('reads the groups and their keys, quoted or not', () => {
    const src = `cva('base', { variants: { variant: { default: 'a', 'x-y': ['b', 'c'] }, size: { sm: "h-1 [&_svg]:size-3", icon: 'z' } }, defaultVariants: { variant: 'default' } })`
    expect(cvaVariants(src)).toEqual({ variant: ['default', 'x-y'], size: ['sm', 'icon'] })
  })
})
