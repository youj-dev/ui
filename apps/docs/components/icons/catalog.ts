import type { LucideIcon } from 'lucide-react'
import {
  icons as youjIcons,
  ICON_CATEGORIES,
  type IconCategory,
  type IconSwapTransition,
  type YoujIconComponent,
  type YoujIconEffect,
} from '@youj/icons'
import type { IconNode } from './static-svg'

/* The explorer's catalog: every Youj icon (read from the generated icon
 * index, so new icons appear by themselves) and the pairs IconSwap can swap
 * between. The lucide entries are for the MCP index only; no page shows them. */

export interface YoujEntry {
  kind: 'youj'
  /** URL id: the icon's name, e.g. `bell-off`. */
  id: string
  name: string
  /** Export name, e.g. `BellOffIcon`. */
  component: string
  Icon: YoujIconComponent
  category: IconCategory
  keywords: string[]
  /** [rest, active] for state icons. */
  states?: [string, string]
  /** Loaders run continuously, and loop by default. */
  loops: boolean
  /** The choreography, from the icon's doc comment. */
  description: string
  /** The icon at rest, rendered at build time. */
  nodes: IconNode[]
}

export interface LucideEntry {
  kind: 'lucide'
  /** URL id: `lucide:<name>`. */
  id: string
  name: string
  /** lucide-react's export name, e.g. `Rocket`. */
  component: string
  Icon: LucideIcon
  /** lucide-react's other export names for the same icon, as words. */
  keywords: string[]
}

export type IconEntry = YoujEntry

export interface PairEntry {
  kind: 'pair'
  /** URL id: `<from id>~<to id>`, e.g. `bell~bell-off`. */
  id: string
  name: string
  from: IconEntry
  to: IconEntry
}

export type Entry = IconEntry | PairEntry

/** Every icon (each plays on hover), the state icons, or swap pairs. */
export type ExplorerType = 'animated' | 'morph' | 'swap'

export { ICON_CATEGORIES, type IconCategory }

/** A category as a label: `status` reads Status, `ai` reads AI. */
export const categoryLabel = (category: IconCategory) => (category === 'ai' ? 'AI' : category.charAt(0).toUpperCase() + category.slice(1))

/* ── Youj ───────────────────────────────────────────────────────────── */

export function youjEntries(svgs: Record<string, IconNode[]>, descriptions: Record<string, string>): YoujEntry[] {
  return youjIcons.map((Icon) => {
    const { name, category, keywords, states, defaultTrigger } = Icon.meta
    return {
      kind: 'youj',
      id: name,
      name,
      component: Icon.displayName ?? 'Icon',
      Icon,
      category,
      keywords,
      states,
      loops: defaultTrigger === 'loop',
      description: descriptions[name] ?? '',
      nodes: svgs[name] ?? [],
    }
  })
}

/* ── Lucide ────────────────────────────────────────────────────────────── */

/**
 * lucide-react's file names from its export names: `ArrowDownAZ` →
 * `arrow-down-a-z`, `Grid2x2` → `grid-2x2`. Four of lucide's names can't be
 * told apart this way (`ArrowDown01` is arrow-down-0-1); they read as
 * arrow-down-01 here, and import by the right name all the same.
 */
export function lucideName(component: string): string {
  return component
    .replace(/(?<!^)([A-Z])/g, '-$1')
    .replace(/([a-zA-Z])(?<!\d[a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase()
}

type LucideModule = { icons: Record<string, LucideIcon> } & Record<string, unknown>

/** Every lucide icon, with its alias export names as keywords. */
export function lucideEntries(mod: LucideModule): LucideEntry[] {
  const aliases = new Map<unknown, Set<string>>()
  for (const [exportName, value] of Object.entries(mod)) {
    if (exportName === 'icons' || typeof value !== 'object' || value === null) continue
    const word = exportName.replace(/^Lucide/, '').replace(/Icon$/, '')
    if (!word) continue
    let names = aliases.get(value)
    if (!names) aliases.set(value, (names = new Set()))
    names.add(word)
  }
  return Object.entries(mod.icons)
    .map(([component, Icon]): LucideEntry => {
      const name = lucideName(component)
      const keywords = [...(aliases.get(Icon) ?? [])].map(lucideName).filter((alias) => alias !== name)
      return { kind: 'lucide', id: `lucide:${name}`, name, component, Icon, keywords }
    })
    .sort((a, b) => (a.name < b.name ? -1 : 1))
}

let lucide: Promise<LucideEntry[]> | undefined

/** lucide-react is loaded the first time it's needed, as its own chunk. */
export function loadLucide(): Promise<LucideEntry[]> {
  lucide ??= import('lucide-react').then((mod) => lucideEntries(mod as unknown as LucideModule))
  return lucide
}

/* ── Pairs ─────────────────────────────────────────────────────────────── */

/** Opposite words: a name with one of them swapped for the other names the pair's second icon. */
const OPPOSITES: [string, string][] = [
  ['up', 'down'],
  ['left', 'right'],
  ['in', 'out'],
  ['upload', 'download'],
  ['back', 'forward'],
  ['undo', 'redo'],
  ['maximize', 'minimize'],
  ['plus', 'minus'],
  ['increasing', 'decreasing'],
  ['open', 'closed'],
  ['on', 'off'],
]

/** A second state spelled as a suffix: bell → bell-off, mail → mail-open. */
const SUFFIXES = ['off', 'check', 'checks', 'open', 'x', 'plus', 'minus', 'crack', 'ring', 'alert', 'call', 'text', 'xml', 'circle']

/** Pairs worth showing that no naming rule finds. Missing names are skipped. */
const CURATED: [string, string][] = [
  ['copy', 'check'],
  ['clipboard', 'check'],
  ['plus', 'check'],
  ['message', 'messages'],
  ['user', 'users'],
  ['user-plus', 'user-check'],
  ['smartphone', 'tablet'],
  ['laptop', 'monitor'],
  ['cloud', 'cloud-rain'],
  ['cloud-sun', 'cloud-lightning'],
  ['heart', 'thumbs-up'],
  ['star', 'sparkles'],
  ['lock', 'shield-check'],
  ['rewind', 'fast-forward'],
  ['list', 'list-ordered'],
  ['align-left', 'align-center'],
  ['bar-chart', 'line-chart'],
  ['line-chart', 'pie-chart'],
  ['git-branch', 'git-merge'],
  ['git-commit', 'git-pull-request'],
  ['sidebar', 'panel-right'],
  ['search', 'filter'],
  ['file', 'file-text'],
  ['folder', 'archive'],
  ['map', 'map-pin'],
  ['clock', 'alarm-clock'],
  ['sun', 'moon'],
  ['play', 'pause'],
  ['eye', 'eye-off'],
  ['wifi', 'wifi-off'],
  ['volume-2', 'volume-x'],
  ['mic', 'mic-off'],
  ['lock', 'lock-open'],
  ['bookmark', 'bookmark-check'],
  ['link-2', 'link-2-off'],
  ['heart', 'heart-crack'],
  ['bell', 'bell-ring'],
  ['rotate-ccw', 'rotate-cw'],
  ['circle', 'circle-dot'],
  ['rows-2', 'rows'],
  ['grip', 'grip-horizontal'],
  ['align-start-vertical', 'align-end-vertical'],
  ['file', 'file-code'],
]

const opposite = new Map(OPPOSITES.flatMap(([a, b]) => [[a, b] as const, [b, a] as const]))

/** Swap pairs among a set of names: curated first, then by naming rule, each pair once. */
export function pairNames(names: readonly string[]): [string, string][] {
  const known = new Set(names)
  const seen = new Set<string>()
  const out: [string, string][] = []
  const add = (a: string, b: string) => {
    const key = [a, b].sort().join('|')
    if (!known.has(a) || !known.has(b) || a === b || seen.has(key)) return
    seen.add(key)
    out.push([a, b])
  }
  for (const [a, b] of CURATED) add(a, b)
  for (const name of names) {
    for (const suffix of SUFFIXES) add(name, `${name}-${suffix}`)
    const words = name.split('-')
    words.forEach((word, i) => {
      const other = opposite.get(word)
      if (!other) return
      const swapped = [...words.slice(0, i), other, ...words.slice(i + 1)].join('-')
      // Always from the first word of the pair, so up → down, never down → up.
      if (OPPOSITES.some(([a]) => a === word)) add(name, swapped)
    })
  }
  return out
}

/** Pairs within one set of icons, as entries. */
export function pairsOf<T extends IconEntry>(entries: readonly T[]): PairEntry[] {
  const byName = new Map(entries.map((e) => [e.name, e]))
  return pairNames(entries.map((e) => e.name)).map(([a, b]) => {
    const from = byName.get(a)!
    const to = byName.get(b)!
    return { kind: 'pair', id: `${from.id}~${to.id}`, name: `${a} → ${b}`, from, to }
  })
}

/* ── Choreography vocabulary ───────────────────────────────────────────── */

export const EFFECTS: { id: YoujIconEffect; note: string }[] = [
  { id: 'pop', note: 'Squeezes, pops past full size and settles.' },
  { id: 'wiggle', note: 'A damped rotation, back and forth.' },
  { id: 'spin', note: 'One full turn, always forwards.' },
  { id: 'nudge', note: 'Out and back along its direction.' },
  { id: 'pulse', note: 'Swells and dims, then returns.' },
  { id: 'ring', note: 'Swings from near the top, like a bell.' },
  { id: 'bounce', note: 'Two hops, the second smaller.' },
  { id: 'flip', note: 'A coin turned once on its vertical axis, with perspective.' },
  { id: 'swing', note: 'A pendulum hung from the top edge, dying away.' },
  { id: 'float', note: 'Lifts, then bobs for as long as it’s active.' },
  { id: 'heartbeat', note: 'A strong beat, a softer one, then a long release.' },
  { id: 'shake', note: 'A hard horizontal shake that decays, for errors.' },
  { id: 'jelly', note: 'Squash and stretch on the ground line.' },
  { id: 'orbit', note: 'One lap around its own center.' },
  { id: 'tilt', note: 'Cocks to one side and holds while active.' },
  { id: 'zoom-in', note: 'Dips away and returns from small.' },
  { id: 'zoom-out', note: 'Dips away and lands from large, like a stamp.' },
  { id: 'draw', note: 'Re-traces every stroke.' },
  { id: 'draw-in', note: 'Rests undrawn, draws on while active and retracts after.' },
  { id: 'draw-out', note: 'Strokes run out through their ends, and grow back after.' },
  { id: 'draw-sequence', note: 'Writes the icon one stroke at a time, at a constant pen speed.' },
  { id: 'stagger-draw', note: 'A wave through the strokes: each rewinds and redraws in turn.' },
]

export const TRANSITIONS: { id: IconSwapTransition; note: string }[] = [
  { id: 'morph', note: 'A true path morph from one icon’s strokes to the other’s.' },
  { id: 'scale-blur', note: 'The old icon shrinks out of focus as the new one sharpens in.' },
  { id: 'rotate', note: 'One continuous quarter turn, out one side and in from the other.' },
  { id: 'draw', note: 'The old strokes run out through their ends, then the new ones draw on.' },
  { id: 'flip', note: 'A card turned on its vertical axis.' },
  { id: 'fold', note: 'Hinged flaps: out folds back, in swings down from the top.' },
  { id: 'slide', note: 'One strip: the new icon pushes the old one out of the box.' },
  { id: 'wipe', note: 'A hard edge sweeps across, with the new icon behind it.' },
  { id: 'zoom', note: 'Out flies past the viewer, in arrives from far away.' },
  { id: 'pop', note: 'Success: the new icon overshoots once and settles.' },
]

export const isState = (entry: Entry): entry is YoujEntry => entry.kind === 'youj' && !!entry.states
