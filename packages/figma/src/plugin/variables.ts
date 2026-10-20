import type { Kit, KitColor, Mode, Personality, Rgba } from '../kit'
import { message } from './steps'
import { keyOf, tag } from './store'

/* Variables. Four collections mirror the code's layers:
 *
 *   Theme   one mode per preset (Graphite, Terminal, …): the contract's
 *           per-theme values, radius, control heights and the raw colours
 *           each mode resolves to (light/…, dark/…)
 *   Color   Light and Dark: the names components use (role/canvas,
 *           role/accent…), each an alias into Theme or into another Color
 *   Scale   one mode: spacing, the type scale, the focus ring
 *   Motion  Precise, Calm, Lively: durations, curves, springs, staggers
 *
 * Plans cap modes per collection (Starter: 1, Professional: 10,
 * Organization: 20). The plugin probes the cap first and lays the same names
 * out to fit: a collection that can't hold its modes is split into one
 * single-mode source per preset ("Theme · Terminal"), and Theme and Color become
 * single-mode interfaces that alias the preset and mode in use. Components
 * bind to the same names either way; `Youj kit → Theme` re-points the
 * interfaces on Starter and sets modes on Professional. */

export interface Layout {
  /** Modes per collection this file allows (capped at what the kit needs). */
  limit: number
  theme: 'modes' | 'split'
  color: 'modes' | 'single'
  motion: 'modes' | 'split'
}

export function planLayout(limit: number, themes: number, personalities: number): Layout {
  return {
    limit,
    theme: limit >= themes ? 'modes' : 'split',
    color: limit >= 2 ? 'modes' : 'single',
    motion: limit >= personalities ? 'modes' : 'split',
  }
}

const PLAN_LIMIT = /limited to (\d+) modes?/i

/** Reads the plan's mode cap from Figma's own error, e.g. "in addMode: Limited to 1 modes only". */
export function limitFromError(error: unknown, attempted: number): number | null {
  const text = message(error)
  const m = PLAN_LIMIT.exec(text)
  if (m) return Math.max(1, Number(m[1]))
  if (/limit|plan|upgrade/i.test(text)) return attempted - 1
  return null
}

/** How many modes a collection can have in this file, up to `max`: adds modes to a scratch collection until Figma refuses. */
export async function probeModeLimit(max: number): Promise<number> {
  const probe = figma.variables.createVariableCollection('Youj · mode probe')
  try {
    for (let count = 2; count <= max; count++) {
      try {
        probe.addMode(`Mode ${count}`)
      } catch (error) {
        // Figma's wording varies by version; any refusal here means the cap is below `count`.
        const limit = limitFromError(error, count)
        if (limit === null) console.warn(`Youj kit: addMode refused (${message(error)}); taking the cap as ${count - 1}`)
        return limit ?? count - 1
      }
    }
    return max
  } finally {
    probe.remove()
  }
}

export interface Applied {
  theme: string
  mode: Mode
}

export interface Vars {
  layout: Layout
  applied: Applied
  theme: VariableCollection
  color: VariableCollection
  scale: VariableCollection
  /** Modes layout only. */
  motion?: VariableCollection
  themeModes: Record<string, string> | null
  colorModes: Record<Mode, string> | null
  motionModes: Record<Personality, string> | null
  sources: Map<string, VariableCollection>
  motionSources: Map<Personality, VariableCollection>
  /** A variable by collection and name, e.g. get('color', 'role/canvas'). */
  get(collection: 'theme' | 'color' | 'scale', name: string): Variable
  /** The raw per-theme variable for a name in Theme: the source's in a split layout, Theme's own otherwise (bind it and set Theme's mode). */
  source(theme: string, name: string): Variable
  /** A motion token for a personality: the Motion collection's (set its mode) or the personality's source. */
  motionVar(personality: Personality, name: string): Variable
  /** One line per collection, for the report. */
  summary: string[]
  /** Things that worked only partly, for the cover. */
  warnings: string[]
}

const COLOR_SCOPES: Record<KitColor['role'], VariableScope[]> = {
  surface: ['ALL_FILLS'],
  text: ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR'],
  line: ['STROKE_COLOR', 'SHAPE_FILL', 'EFFECT_COLOR'],
  fill: ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'],
  effect: ['EFFECT_COLOR'],
}

const FLOAT_SCOPES: Record<string, VariableScope[]> = {
  gap: ['GAP', 'WIDTH_HEIGHT'],
  radius: ['CORNER_RADIUS'],
  size: ['WIDTH_HEIGHT'],
  'font-size': ['FONT_SIZE'],
  'line-height': ['LINE_HEIGHT'],
  stroke: ['STROKE_FLOAT'],
  none: [],
}

export const PERSONALITIES: Personality[] = ['precise', 'calm', 'lively']
const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const MODE_NAMES: Record<Mode, string> = { light: 'Light', dark: 'Dark' }

interface Entry {
  name: string
  type: VariableResolvedDataType
  description: string
  scopes: VariableScope[]
  web?: string
  hidden?: boolean
}

interface ThemeEntry extends Entry {
  values: Record<string, VariableValue>
}

/** Everything that varies by theme: raw colours per mode, radius, control heights, density, fonts. */
export function themeEntries(kit: Kit): ThemeEntry[] {
  const out: ThemeEntry[] = []
  for (const mode of ['light', 'dark'] as Mode[]) {
    for (const c of kit.colors) {
      const v = c[mode]
      if (!('values' in v)) continue
      out.push({
        name: `${mode}/${c.name}`,
        type: 'COLOR',
        description: `${c.name} in ${mode} mode, per theme (${c.source}). Bind Color/${c.name}: it picks the mode.`,
        scopes: [],
        hidden: true,
        values: v.values as Record<string, Rgba>,
      })
    }
  }
  for (const n of kit.theme) {
    out.push({ name: n.name, type: 'FLOAT', description: n.source, scopes: FLOAT_SCOPES[n.scope]!, web: n.css.startsWith('--') ? `var(${n.css})` : n.css, values: n.values })
  }
  for (const f of kit.fonts) {
    out.push({ name: f.name, type: 'STRING', description: `The theme's ${f.name.slice(5)} family in code. The kit's text styles are set in the default theme's (Basalt's Inter and JetBrains Mono).`, scopes: ['FONT_FAMILY'], values: f.values })
  }
  return out
}

/** Motion tokens per personality. */
export function motionEntries(kit: Kit): ThemeEntry[] {
  const p = kit.motion.personalities
  const per = <T extends VariableValue>(fn: (x: Personality) => T) => Object.fromEntries(PERSONALITIES.map((x) => [x, fn(x)])) as Record<string, T>
  const out: ThemeEntry[] = []
  for (const t of Object.keys(p.precise.durations)) {
    out.push({ name: `duration/${t}`, type: 'FLOAT', description: `${kit.motion.usage.durations[t] ?? ''} (ms, before the Speed control scales it).`, scopes: [], web: `var(--yj-duration-${t})`, values: per((x) => p[x].durations[t]!) })
  }
  for (const t of Object.keys(p.precise.easings)) {
    out.push({ name: `easing/${t}`, type: 'STRING', description: kit.motion.usage.easings[t] ?? '', scopes: [], web: `var(--ease-${t})`, values: per((x) => `cubic-bezier(${p[x].easings[t]!.join(', ')})`) })
  }
  for (const t of Object.keys(p.precise.springs)) {
    out.push({ name: `spring/${t}/duration`, type: 'FLOAT', description: `${kit.motion.usage.springs[t] ?? ''} Perceived duration, seconds.`, scopes: [], web: `k.spring('${t}')`, values: per((x) => p[x].springs[t]!.visualDuration) })
    out.push({ name: `spring/${t}/bounce`, type: 'FLOAT', description: 'Bounce, 0 (none) to 1.', scopes: [], web: `k.spring('${t}')`, values: per((x) => p[x].springs[t]!.bounce) })
  }
  for (const t of Object.keys(p.precise.staggers)) {
    out.push({ name: `stagger/${t}`, type: 'FLOAT', description: `${kit.motion.usage.staggers[t] ?? ''} (ms between siblings).`, scopes: [], web: `k.stagger('${t}')`, values: per((x) => p[x].staggers[t]!) })
  }
  return out
}

/** Where a Color variable points in one mode: another Color variable, or its raw value in Theme. */
export function colorTarget(c: KitColor, mode: Mode): { collection: 'color' | 'theme'; name: string } {
  const v = c[mode]
  return 'alias' in v ? { collection: 'color', name: v.alias } : { collection: 'theme', name: `${mode}/${c.name}` }
}

/** Follows aliases down to the colour that holds values. */
export function rawColor(kit: Kit, name: string, mode: Mode): KitColor {
  let c = kit.colors.find((x) => x.name === name)
  for (let guard = 0; c && guard < 10; guard++) {
    const v = c[mode]
    if (!('alias' in v)) return c
    c = kit.colors.find((x) => x.name === v.alias)
  }
  throw new Error(`colour ${name} has no value in ${mode}`)
}

class Upserter {
  used = new Set<string>()
  usedCollections = new Set<string>()
  created = 0
  updated = 0
  /** Why setting code syntax failed, once it has. */
  noCodeSyntax = ''
  constructor(
    private collections: VariableCollection[],
    private variables: Variable[],
  ) {}

  /** Finds the collection by key only: a collection of yours with the same name is left alone. */
  collection(key: string, name: string, modes: string[], hidden = false): { collection: VariableCollection; modeIds: string[] } {
    let c = this.collections.find((x) => keyOf(x) === key)
    if (!c) {
      c = figma.variables.createVariableCollection(name)
      this.collections.push(c)
    } else if (c.name !== name) c.name = name
    tag(c, key)
    c.hiddenFromPublishing = hidden
    this.usedCollections.add(c.id)
    // The default mode takes the first name; others are matched by name. Unwanted
    // modes go before any rename, so two modes never share a name.
    const wanted = modes.slice(1)
    const kept = new Map<string, string>()
    for (const m of c.modes) if (m.modeId !== c.defaultModeId && wanted.includes(m.name) && !kept.has(m.name)) kept.set(m.name, m.modeId)
    const keep = new Set(kept.values())
    for (const m of c.modes) if (m.modeId !== c.defaultModeId && !keep.has(m.modeId)) c.removeMode(m.modeId)
    c.renameMode(c.defaultModeId, modes[0]!)
    const ids = [c.defaultModeId, ...wanted.map((mode) => kept.get(mode) ?? c.addMode(mode))]
    return { collection: c, modeIds: ids }
  }

  variable(collection: VariableCollection, entry: Entry): Variable {
    const key = `${keyOf(collection)}/${entry.name}`
    let v = this.variables.find((x) => keyOf(x) === key) ?? this.variables.find((x) => x.variableCollectionId === collection.id && x.name === entry.name && !keyOf(x))
    if (v && (v.resolvedType !== entry.type || v.variableCollectionId !== collection.id)) {
      v.remove()
      this.variables = this.variables.filter((x) => x !== v)
      v = undefined
    }
    if (!v) {
      v = figma.variables.createVariable(entry.name, collection, entry.type)
      this.variables.push(v)
      this.created++
    } else {
      if (v.name !== entry.name) v.name = entry.name
      this.updated++
    }
    tag(v, key)
    this.used.add(v.id)
    if (v.description !== entry.description) v.description = entry.description
    v.scopes = entry.scopes
    v.hiddenFromPublishing = entry.hidden ?? false
    if (entry.web && !this.noCodeSyntax) {
      // Code syntax is Dev Mode metadata; a file or version that refuses it still gets working variables.
      try {
        v.setVariableCodeSyntax('WEB', entry.web)
      } catch (error) {
        this.noCodeSyntax = message(error)
      }
    }
    return v
  }

  /** Kit-made variables and collections this run didn't touch: tokens that no longer exist. */
  sweep(): { variables: number; collections: string[] } {
    let variables = 0
    for (const v of this.variables) {
      if (keyOf(v) && !this.used.has(v.id) && this.collections.some((c) => c.id === v.variableCollectionId && keyOf(c))) {
        v.remove()
        variables++
      }
    }
    const collections: string[] = []
    for (const c of this.collections) {
      if (keyOf(c).startsWith('collection:') && !this.usedCollections.has(c.id)) {
        collections.push(c.name)
        c.remove()
      }
    }
    return { variables, collections }
  }
}

const alias = (v: Variable) => figma.variables.createVariableAlias(v)

export async function buildVariables(kit: Kit, applied: Applied, limit: number): Promise<Vars> {
  const layout = planLayout(limit, kit.themes.length, PERSONALITIES.length)
  const up = new Upserter(await figma.variables.getLocalVariableCollectionsAsync(), await figma.variables.getLocalVariablesAsync())
  const themeById = new Map(kit.themes.map((t) => [t.id, t]))
  const appliedTheme = themeById.get(applied.theme) ?? kit.themes[0]!
  const lookup = new Map<string, Variable>()
  const put = (collection: string, name: string, v: Variable) => lookup.set(`${collection}:${name}`, v)
  const summary: string[] = []

  // Collections first, in the order Figma's variables panel lists them: the one you reach for most on top.
  const colorModesList: Mode[] = layout.color === 'modes' ? ['light', 'dark'] : [applied.mode]
  const color = up.collection('collection:color', 'Color', colorModesList.map((m) => MODE_NAMES[m]))
  const theme =
    layout.theme === 'modes'
      ? up.collection('collection:theme', 'Theme', kit.themes.map((x) => x.name))
      : up.collection('collection:theme', 'Theme', [appliedTheme.name])
  const themeSources = layout.theme === 'modes' ? [] : kit.themes.map((x) => [x, up.collection(`collection:theme:${x.id}`, `Theme · ${x.name}`, [x.name], true)] as const)
  const scale = up.collection('collection:scale', 'Scale', ['Value'])
  const motionCollection = layout.motion === 'modes' ? up.collection('collection:motion', 'Motion', PERSONALITIES.map(title)) : null
  const motionSourceCollections = layout.motion === 'modes' ? [] : PERSONALITIES.map((p) => [p, up.collection(`collection:motion:${p}`, `Motion · ${title(p)}`, [title(p)])] as const)

  // Scale: one mode.
  for (const n of kit.scale) {
    const v = up.variable(scale.collection, { name: n.name, type: 'FLOAT', description: n.source, scopes: FLOAT_SCOPES[n.scope]!, web: n.css.startsWith('--') ? `var(${n.css})` : n.css })
    v.setValueForMode(scale.modeIds[0]!, n.value)
    put('scale', n.name, v)
  }
  summary.push(`Scale: ${kit.scale.length} variables, 1 mode`)

  // Theme: a mode per preset, or a source collection per preset behind a single-mode interface.
  const entries = themeEntries(kit)
  const sources = new Map<string, VariableCollection>()
  const sourceVars = new Map<string, Variable>()
  let themeModes: Record<string, string> | null = null
  if (layout.theme === 'modes') {
    const modes: Record<string, string> = Object.fromEntries(kit.themes.map((x, i) => [x.id, theme.modeIds[i]!]))
    themeModes = modes
    for (const e of entries) {
      const v = up.variable(theme.collection, e)
      for (const x of kit.themes) v.setValueForMode(modes[x.id]!, e.values[x.id]!)
      put('theme', e.name, v)
    }
    summary.push(`Theme: ${entries.length} variables, ${kit.themes.length} modes (${kit.themes.map((x) => x.name).join(', ')})`)
  } else {
    for (const [x, s] of themeSources) {
      sources.set(x.id, s.collection)
      for (const e of entries) {
        const v = up.variable(s.collection, { ...e, hidden: true })
        v.setValueForMode(s.modeIds[0]!, e.values[x.id]!)
        sourceVars.set(`${x.id}:${e.name}`, v)
      }
    }
    for (const e of entries) {
      const v = up.variable(theme.collection, { ...e, description: `${e.description} Points at Theme · ${appliedTheme.name}.` })
      v.setValueForMode(theme.modeIds[0]!, alias(sourceVars.get(`${appliedTheme.id}:${e.name}`)!))
      put('theme', e.name, v)
    }
    summary.push(`Theme · ${kit.themes.map((x) => x.name).join(', Theme · ')}: ${entries.length} variables each, 1 mode (sources)`)
    summary.push(`Theme: ${entries.length} aliases into Theme · ${appliedTheme.name} (the theme in use)`)
  }

  // Color: every variable first, since they alias each other.
  const colorModes = layout.color === 'modes' ? { light: color.modeIds[0]!, dark: color.modeIds[1]! } : null
  for (const c of kit.colors) {
    const v = up.variable(color.collection, { name: c.name, type: 'COLOR', description: `${c.source}${c.css ? ` · ${c.css}` : ''}`, scopes: COLOR_SCOPES[c.role], web: c.css ? `var(${c.css})` : undefined })
    put('color', c.name, v)
  }
  for (const c of kit.colors) {
    colorModesList.forEach((mode, i) => {
      const target = colorTarget(c, mode)
      lookup.get(`color:${c.name}`)!.setValueForMode(color.modeIds[i]!, alias(lookup.get(`${target.collection}:${target.name}`)!))
    })
  }
  summary.push(
    layout.color === 'modes'
      ? `Color: ${kit.colors.length} variables, 2 modes (Light, Dark)`
      : `Color: ${kit.colors.length} variables, 1 mode (${MODE_NAMES[applied.mode]}): the plan allows one mode per collection`,
  )

  // Motion.
  const motionList = motionEntries(kit)
  const motionSources = new Map<Personality, VariableCollection>()
  let motionModes: Record<Personality, string> | null = null
  if (motionCollection) {
    const modes = Object.fromEntries(PERSONALITIES.map((p, i) => [p, motionCollection.modeIds[i]!])) as Record<Personality, string>
    motionModes = modes
    for (const e of motionList) {
      const v = up.variable(motionCollection.collection, e)
      for (const p of PERSONALITIES) v.setValueForMode(modes[p], e.values[p]!)
      put('motion', e.name, v)
    }
    summary.push(`Motion: ${motionList.length} variables, 3 modes (Precise, Calm, Lively)`)
  } else {
    for (const [p, s] of motionSourceCollections) {
      motionSources.set(p, s.collection)
      for (const e of motionList) {
        const v = up.variable(s.collection, e)
        v.setValueForMode(s.modeIds[0]!, e.values[p]!)
        put(`motion:${p}`, e.name, v)
      }
    }
    summary.push(`Motion · Precise, Calm, Lively: ${motionList.length} variables each, 1 mode`)
  }

  const swept = up.sweep()
  if (swept.collections.length) summary.push(`Removed collections from an earlier layout: ${swept.collections.join(', ')}`)
  if (swept.variables) summary.push(`Removed ${swept.variables} variables that no longer exist in code`)
  summary.push(`${up.created} variables created, ${up.updated} updated`)

  const need = (key: string) => {
    const v = lookup.get(key)
    if (!v) throw new Error(`No variable ${key}`)
    return v
  }
  return {
    layout,
    applied: { theme: appliedTheme.id, mode: applied.mode },
    theme: theme.collection,
    color: color.collection,
    scale: scale.collection,
    motion: motionCollection?.collection,
    themeModes,
    colorModes,
    motionModes,
    sources,
    motionSources,
    summary,
    warnings: up.noCodeSyntax ? [`Figma refused the variables' code syntax (${up.noCodeSyntax}), so Dev Mode won't show var(--…) names; the variables work.`] : [],
    get: (collection, name) => need(`${collection}:${name}`),
    source: (theme, name) => (layout.theme === 'modes' ? need(`theme:${name}`) : sourceVars.get(`${theme}:${name}`) ?? need(`theme:${name}`)),
    motionVar: (p, name) => need(layout.motion === 'modes' ? `motion:${name}` : `motion:${p}:${name}`),
  }
}
