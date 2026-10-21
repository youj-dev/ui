import { SHEETS } from '../src/plugin/pages'
import { PENDING } from '../src/plugin/sheet'
import { KEY } from '../src/plugin/store'
import { allNodes, resolveVariable, type FakeEnv, type FakeNode } from './fake-figma'

/* The integrity check both build suites run (integrity.test.ts on every plan,
 * failures.test.ts after injected failures): every page holds its sheet and
 * nothing else, every component set has well-formed variants, every bound
 * variable resolves, every text node's font is loaded, nothing is zero-size
 * or off the canvas. Returns the problems it found. */

type Alias = { type: 'VARIABLE_ALIAS'; id: string }
const aliases = (value: unknown): Alias[] => {
  if (!value || typeof value !== 'object') return []
  const v = value as Record<string, unknown>
  if (v.type === 'VARIABLE_ALIAS' && typeof v.id === 'string') return [v as unknown as Alias]
  return Object.values(v).flatMap(aliases)
}

/** Every variable reference in the file: node fields, paints, effects and styles. */
function references(env: FakeEnv): { where: string; alias: Alias }[] {
  const out: { where: string; alias: Alias }[] = []
  for (const n of allNodes(env)) {
    const where = `${n.type} "${n.name}"`
    for (const alias of aliases(n.boundVariables)) out.push({ where, alias })
    for (const p of [...n.fills, ...n.strokes, ...n.effects]) for (const alias of aliases(p.boundVariables)) out.push({ where, alias })
  }
  for (const s of env.styles) {
    for (const alias of aliases(s.boundVariables)) out.push({ where: `style ${s.name}`, alias })
    const effects = (s as unknown as { effects?: { boundVariables?: unknown }[] }).effects ?? []
    for (const e of effects) for (const alias of aliases(e.boundVariables)) out.push({ where: `style ${s.name}`, alias })
  }
  return out
}

export function checkIntegrity(env: FakeEnv) {
  const problems: string[] = []
  const kitPages = env.pages.filter((p) => p.getPluginData(KEY).startsWith('page:'))
  expect(kitPages.length).toBeGreaterThan(0)

  // Pages: each holds sheets and only sheets (nothing stranded where it was created), none is empty.
  const sheets = new Map<string, FakeNode>()
  for (const page of kitPages) {
    if (!page.rawChildren().length) problems.push(`page ${page.name} is empty`)
    for (const top of page.rawChildren()) {
      const key = top.getPluginData(KEY)
      if (!key.startsWith('sheet:')) problems.push(`stray ${top.type} "${top.name}" on ${page.name}`)
      else if (sheets.has(key)) problems.push(`${key} twice`)
      else sheets.set(key, top)
      if (top.getPluginData(PENDING)) problems.push(`${key} carries a notice: ${top.getPluginData(PENDING)}`)
      if (!(top.x >= 0 && top.x < 50_000 && top.y >= 0 && top.y < 50_000)) problems.push(`${key} is off the canvas at ${top.x}, ${top.y}`)
    }
  }
  for (const s of SHEETS) {
    const frame = sheets.get(`sheet:${s}`)
    if (!frame) problems.push(`no sheet:${s}`)
    else if (frame.rawChildren().length < 2 || frame.height < 400) problems.push(`sheet:${s} is nearly empty (${frame.rawChildren().length} children, ${Math.round(frame.height)}px)`)
  }
  // Nothing left on a non-kit page by the build (a new file's page is taken over; your own pages stay yours).
  for (const page of env.pages.filter((p) => !kitPages.includes(p))) {
    for (const n of page.rawChildren()) if (n.getPluginData(KEY) || n.name === 'Svg' || n.type === 'INSTANCE') problems.push(`kit node "${n.name}" left on your page ${page.name}`)
  }

  // Component sets: variants only, uniquely named, all with the same properties.
  for (const set of allNodes(env).filter((n) => n.type === 'COMPONENT_SET')) {
    const kids = set.rawChildren()
    if (!kids.length) problems.push(`${set.name} has no variants`)
    if (kids.some((k) => k.type !== 'COMPONENT')) problems.push(`${set.name} holds a non-component`)
    const names = kids.map((k) => k.name)
    if (new Set(names).size !== names.length) problems.push(`${set.name} has variants with the same values`)
    const shape = (k: FakeNode) => Object.keys(k.variantProperties ?? {}).sort().join(',')
    if (new Set(kids.map(shape)).size > 1) problems.push(`${set.name} mixes variant properties`)
    for (const k of kids) if (!k.rawChildren().length && !/Skeleton|Separator/.test(set.name)) problems.push(`${set.name} / ${k.name} is empty`)
  }

  // Variables: every reference points at a variable that resolves to a value.
  const ids = new Set(env.variables.map((v) => v.id))
  const resolves = new Map<string, boolean>()
  for (const { where, alias } of references(env)) {
    if (!ids.has(alias.id)) problems.push(`${where} binds a missing variable ${alias.id}`)
    else {
      if (!resolves.has(alias.id)) resolves.set(alias.id, resolveVariable(env, alias.id) !== undefined)
      if (!resolves.get(alias.id)) problems.push(`${where} binds ${alias.id}, which doesn't resolve`)
    }
  }

  // Text: written in loaded fonts, never blank. Boxes: never zero-size.
  for (const n of allNodes(env)) {
    if (n.type === 'TEXT') {
      if (!env.loadedFonts.has(`${n.fontName.family}/${n.fontName.style}`)) problems.push(`text "${n.name}" is in an unloaded font ${n.fontName.family} ${n.fontName.style}`)
      if (!n.characters.trim()) problems.push(`text "${n.name}" is blank`)
    }
    if (['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'TEXT', 'RECTANGLE', 'ELLIPSE'].includes(n.type) && !(n.width > 0 && n.height > 0)) {
      problems.push(`${n.type} "${n.name}" is ${n.width} × ${n.height}`)
    }
  }
  return problems
}
