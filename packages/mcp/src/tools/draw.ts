import {
  AXES,
  BASE_LABELS,
  BASES,
  baseTop,
  boundsOf,
  CEILING,
  cleanName,
  componentNameOf,
  createPart,
  encodeScene,
  FACINGS,
  FLOOR,
  generateCode,
  hasVariants,
  installItems,
  LATHE_LABELS,
  LATHE_PRESETS,
  MAX_NAME,
  MAX_PARTS,
  nextId,
  PART_TYPES,
  PLATFORM_LIP,
  PRISM_LABELS,
  PRISM_PRESETS,
  sanitizePart,
  sanitizeScene,
  sceneSlug,
  SHADES,
  STEP,
  TEMPLATES,
  VARIANTS,
  type Bounds,
  type BuilderScene,
  type PaletteKind,
  type Part,
  type PartType,
} from '@youj/illustrations/builder'
import type { Catalog } from '../catalog'
import { code } from '../format'
import { inspectProject } from './project-info'

/* Drawing a new isometric scene in the illustration builder's own format:
 * the guide to composing one, and the tool that checks a scene with the
 * builder's model and writes it as a component, with a link that opens it in
 * the builder. Everything about the format comes from the builder's exports. */

/** What each palette item of a type adds: its fields and default size. */
const kindOf = (type: PartType): PaletteKind => (type === 'prism' ? 'prism:gable' : type === 'lathe' ? 'lathe:cup' : type)
const sample = (type: PartType) => createPart(kindOf(type), 'p1')
/** A type's fields, from the part the builder creates; a name and a group are optional. */
const fieldsOf = (type: PartType) => [...Object.keys(sample(type)), 'name', 'group']
const SIZE_KEYS = ['w', 'd', 'r', 'h'] as const
const sizeOf = (part: Part) => SIZE_KEYS.filter((k) => k in part).map((k) => `${k} ${(part as unknown as Record<string, number>)[k]}`).join(', ')

const TYPE_NOTES: Record<PartType, string> = {
  box: 'A block: furniture, buildings, cards, slabs. h 0 is a flat tile (a rug, a label, a foot).',
  cylinder: 'A disc or drum: tiers, coins, pots, pillars. h 0 is a flat disc.',
  platform: 'A slab with a plate on top (adds 0.2): a stage, a tray, a rug. round: true for a disc; grid: true for a gridded plate.',
  prism: 'An outline extruded: roofs, awnings, signs, hearts, stars, arrows, stairs. preset picks the outline, facing its plane.',
  lathe: 'A turned solid: cups, bells, domes, balls, bottles, vases, bowls. preset picks the profile.',
  pipe: 'A tube lying along axis x or y: its length is w (axis x) or d (axis y); the other side equals h, the diameter.',
  screen: 'A thin panel with a dark pane inset in the face it looks out of (facing): monitors, phones, windows, signs.',
  crate: 'An open box: its opening shows the inside. Trays, bins, drawers.',
}

const FACING_NOTES = 'facing: `left` stands the outline upright facing +y (toward the lower left), `right` stands it facing +x (lower right), `top` lays it flat. The part’s box is w along x, d along y, h up; its thin side is the depth.'

const ID_RULE = 'lowercase letters, digits and -, starting with a letter, up to 16'
const validId = (id: string) => sanitizeScene({ parts: [{ type: 'box', id }] })!.parts[0]!.id === id

/* ── The guide ───────────────────────────────────────────────────────────── */

/** A part as JSON with the defaults left out, as an agent would write it. */
function compact(part: Part): string {
  const quiet: Record<string, unknown> = { variant: 'solid', tone: part.type === 'platform' ? 'sunken' : 'neutral', lit: false, lift: 0, float: 0, round: false, grid: false, group: undefined, name: undefined }
  const first = ['type', 'id', 'name', 'preset', 'facing', 'axis', 'x', 'y', 'z', ...SIZE_KEYS]
  const keys = [...first.filter((k) => k in part), ...Object.keys(part).filter((k) => !first.includes(k))]
  const entries = keys.map((k) => [k, (part as unknown as Record<string, unknown>)[k]] as const)
  return JSON.stringify(Object.fromEntries(entries.filter(([k, v]) => v !== undefined && (!(k in quiet) || quiet[k] !== v))))
}

function example(scene: BuilderScene): string {
  const groups = scene.groups.length ? `,\n  "groups": ${JSON.stringify(scene.groups)}` : ''
  return `{\n  "name": ${JSON.stringify(scene.name)},\n  "base": "${scene.base}",\n  "parts": [\n${scene.parts.map((p) => `    ${compact(p)}`).join(',\n')}\n  ]${groups}\n}`
}

const EXAMPLES = ['shop', 'lounge', 'workshop'] as const

export function illustrationGuide(catalog: Catalog): string {
  const scenes = catalog.index.illustrations.scenes.length
  const presetRow = (label: string, part: Part, facing?: string) => `\`${(part as { preset: string }).preset}\` ${label} (${facing ? `${facing}, ` : ''}${sizeOf(part)})`
  return [
    '# Drawing an isometric illustration',
    '',
    `First look for a ready-made one: ${scenes} scenes in \`list_illustrations\` (by category) and \`search\` with kinds ["illustration"]. Draw a new scene only when none fits, then pass it to \`draw_illustration\`: it checks the scene, and returns the component, a link to tweak it in the builder, and where to put it.`,
    '',
    '## The volume',
    '',
    `- Every scene frames the same volume: an ${FLOOR} × ${FLOOR} floor (x and y from 0 to ${FLOOR}) and ${CEILING} units of height (z from 0 to ${CEILING}), so any scene swaps for any other without the layout moving.`,
    `- A part is placed by its corner nearest the origin (x, y, z) and sized w along x, d along y and h up; a cylinder or lathe by r (a 2r square footprint) and h. Its footprint stays on the floor (x + w ≤ ${FLOOR}) and its top under the ceiling (z + h ≤ ${CEILING}).`,
    `- Numbers take two decimals; the builder's own moves snap to ${STEP}, and scenes read best on that grid.`,
    '- On screen x runs toward the lower right and y toward the lower left: a larger x + y is nearer. Put tall parts at the back (small x + y) and small ones in front, or they hide what is behind them.',
    `- Stacking: a part resting on another starts at z = its z + h (a platform adds its ${PLATFORM_LIP} plate). \`draw_illustration\` warns when one hovers, sinks or cuts through another.`,
    `- At most ${MAX_PARTS} parts; 4 to 12 is the sweet spot.`,
    `- base, what it all stands on: ${BASES.map((b) => `\`${b}\` (${BASE_LABELS[b].toLowerCase()}${baseTop(b) ? `, its top at z ${baseTop(b)}: parts on it start there` : ''})`).join(', ')}.`,
    '',
    '## Parts',
    '',
    `Every part has \`type\`, \`id\` (${ID_RULE}: p1, p2…), x, y, z, and optionally: \`name\` (up to ${MAX_NAME} characters, written as a comment), \`tone\` (${SHADES.map((s) => `\`${s}\``).join(', ')}), \`lit\` (true: drawn in the accent), \`lift\` (0 to ${CEILING}: how far it rises when the scene comes apart, with \`explode\`), \`float\` (0 to 1: the height of a gentle bob), \`group\` (a group's id). Omitted fields take the defaults below.`,
    '',
    '| type | fields | default |  |',
    '| --- | --- | --- | --- |',
    ...PART_TYPES.map((t) => {
      const part = sample(t)
      const own = Object.keys(part).filter((k) => !['id', 'x', 'y', 'z', 'variant', 'tone', 'lit', 'lift', 'float'].includes(k) && k !== 'type')
      const variant = hasVariants(t) ? `, variant (${VARIANTS.join(', ')})` : ''
      return `| \`${t}\` | ${own.join(', ')}${variant} | ${sizeOf(part)}${part.tone !== 'neutral' ? `, tone ${part.tone}` : ''} | ${TYPE_NOTES[t]} |`
    }),
    '',
    `Only ${PART_TYPES.filter(hasVariants).join(', ')} take a \`variant\`; the others are solid.`,
    '',
    `**Prism presets** (\`"type": "prism", "preset", "facing"\`; ${FACINGS.join(', ')}): ${PRISM_PRESETS.map((p) => {
      const part = createPart(`prism:${p}`, 'p1') as Part & { facing: string }
      return presetRow(PRISM_LABELS[p], part, part.facing)
    }).join('; ')}.`,
    '',
    FACING_NOTES,
    '',
    `**Lathe presets** (\`"type": "lathe", "preset"\`): ${LATHE_PRESETS.map((p) => presetRow(LATHE_LABELS[p], createPart(`lathe:${p}`, 'p1'))).join('; ')}. A ball whose h is 2r is a true sphere.`,
    '',
    `**Pipes** lie along \`axis\` ${AXES.map((a) => `\`${a}\``).join(' or ')}. **Screens** take a \`facing\` like prisms.`,
    '',
    '**Groups** move as one: give two or more parts the same `group`, and list it in `groups` as `{ "id": "g1", "lift": 0, "float": 0.08 }` (its own lift and float, on top of the parts\').',
    '',
    '## Composing one that reads at small sizes',
    '',
    '- One subject, drawn big: a few large, simple masses beat many small parts. Scenes are often shown at 120 to 240 px, where anything under 0.25 units is a speck; keep details 0.5 and up, except thin panels (screens, doors, windows: 0.08 to 0.2 deep) and tiles (h 0).',
    '- Keep the subject in the middle, on the plinth (x and y from about 1 to 7), with air around it.',
    '- Light one part: `lit: true` on the thing the scene is about (the screen on a desk, the awning on a shop). One, two at most; the accent loses its meaning when it is everywhere.',
    '- Shade for hierarchy: `raised` for the main masses and surfaces you look at (a desk, a building), `neutral` for most parts, `sunken` for recesses, openings, feet, doors and windows. Two touching parts read apart when their tones differ.',
    '- Variant for state: `solid` for what is there, `ghost` for what is next, empty or pending (the top tier of the Stack template), `wire` for a plan, a draft or a placeholder.',
    '- Motion is optional: a lift of 0.3 to 0.9 on the parts that come apart (more the higher they sit), and a float of 0.08 to 0.15 on one or two small parts. Reduced motion draws the scene finished and still.',
    '- Name the parts (`"name": "Monitor"`): the names become comments in the code.',
    '',
    '## Examples',
    '',
    'The builder\'s own templates, in the JSON `draw_illustration` takes (defaults left out):',
    '',
    ...EXAMPLES.flatMap((id) => {
      const t = TEMPLATES.find((x) => x.id === id)!
      return [`**${t.name}**: ${t.note}.`, code('json', example(t.scene)), '']
    }),
  ].join('\n').trimEnd()
}

/* ── Checking a scene ────────────────────────────────────────────────────── */

const SCENE_KEYS = ['version', 'name', 'base', 'parts', 'groups']
const oneOfText = (list: readonly string[]) => list.map((v) => `"${v}"`).join(', ')
const show = (v: unknown) => (typeof v === 'string' ? `"${v}"` : JSON.stringify(v) ?? String(v))

/** Why the builder changed a field it kept: the rule it brought the value into. */
function rangeRule(part: Part, field: string): string {
  const round = part.type === 'cylinder' || part.type === 'lathe'
  switch (field) {
    case 'x':
    case 'y':
      return `the footprint stays on the ${FLOOR} × ${FLOOR} floor (0 ≤ ${field} and ${field} + ${round ? '2r' : field === 'x' ? 'w' : 'd'} ≤ ${FLOOR})`
    case 'z':
    case 'h':
      return part.type === 'pipe' && field === 'h' ? 'a pipe is round: its diameter h sets its other side too, and fits under the ceiling' : `the top stays under the ceiling (z + h${part.type === 'platform' ? ` + ${PLATFORM_LIP} plate` : ''} ≤ ${CEILING})`
    case 'w':
    case 'd':
      return part.type === 'pipe' ? `a pipe is round: the side across its axis equals h (0.25 to ${CEILING})` : `sizes run from 0.1 to ${FLOOR}`
    case 'r':
      return `a radius runs from 0.25 to ${FLOOR / 2}`
    case 'lift':
      return `lift runs from 0 to ${CEILING}`
    case 'float':
      return 'float runs from 0 to 1'
    default:
      return 'the builder’s range'
  }
}

/** Every problem with one part, each with its fix; the part as the builder keeps it when there are none. */
function checkPart(raw: unknown, i: number, ids: Map<string, number>, groupIds: Set<string>): { problems: string[]; part?: Part } {
  const at = `parts[${i}]`
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { problems: [`${at} must be an object, e.g. {"type":"box","x":3,"y":3,"z":0.5,"w":2,"d":2,"h":1}.`] }
  const o = raw as Record<string, unknown>
  const label = `${at}${typeof o.name === 'string' ? ` ("${o.name}")` : ''}`
  const problems: string[] = []
  const type = o.type as PartType
  if (!PART_TYPES.includes(type)) {
    const preset = PRISM_PRESETS.includes(o.type as never) ? 'prism' : LATHE_PRESETS.includes(o.type as never) ? 'lathe' : undefined
    problems.push(
      preset
        ? `${label}: ${show(o.type)} is a ${preset} preset, not a type: use "type": "${preset}", "preset": ${show(o.type)}.`
        : `${label}: type ${o.type === undefined ? 'is missing' : `${show(o.type)} is unknown`}; use one of ${oneOfText(PART_TYPES)}.`,
    )
    return { problems }
  }
  const fields = fieldsOf(type)
  for (const key of Object.keys(o)) if (!fields.includes(key)) problems.push(`${label}: a ${type} has no field "${key}"; drop it (a ${type} takes ${fields.join(', ')}).`)

  const id = o.id === undefined ? nextId([...ids.keys()], 'p') : o.id
  if (typeof id !== 'string' || !validId(id)) problems.push(`${label}: id ${show(o.id)} must be ${ID_RULE}; use "${nextId([...ids.keys()], 'p')}".`)
  else if (ids.has(id)) problems.push(`${label}: id "${id}" is already parts[${ids.get(id)}]'s; use "${nextId([...ids.keys()], 'p')}".`)
  else ids.set(id, i)

  const sample0 = sample(type) as unknown as Record<string, unknown>
  const lists: Record<string, readonly string[]> = { variant: VARIANTS, tone: SHADES, facing: FACINGS, axis: AXES, preset: type === 'prism' ? PRISM_PRESETS : LATHE_PRESETS }
  for (const key of fields) {
    const v = o[key]
    if (v === undefined || key === 'type' || key === 'id') continue
    if (key === 'name') {
      if (typeof v !== 'string') problems.push(`${label}: name must be a string.`)
      else if (cleanName(v) !== v) problems.push(`${label}: name ${show(v)} keeps letters, digits, spaces and ' . , ( ) & - (up to ${MAX_NAME} characters); use ${show(cleanName(v) ?? 'a plain name')}.`)
    } else if (key === 'group') {
      if (typeof v !== 'string' || !groupIds.has(v)) problems.push(`${label}: group ${show(v)} isn't in \`groups\`; add {"id": ${show(v)}, "lift": 0, "float": 0} there, or drop the field.`)
    } else if (key in lists) {
      const list = lists[key]!
      const other = key === 'preset' && (type === 'prism' ? LATHE_PRESETS : PRISM_PRESETS).includes(v as never)
      if (!list.includes(v as string)) problems.push(`${label}: ${key} ${show(v)} ${other ? `is a ${type === 'prism' ? 'lathe' : 'prism'} preset (set "type": "${type === 'prism' ? 'lathe' : 'prism'}")` : `isn't a ${type} ${key}`}; use one of ${oneOfText(list)}.`)
      else if (key === 'variant' && v !== 'solid' && !hasVariants(type)) problems.push(`${label}: a ${type} is solid only; drop "variant" (only ${PART_TYPES.filter(hasVariants).join(', ')} take ${VARIANTS.filter((x) => x !== 'solid').join(' or ')}).`)
    } else if (typeof sample0[key] === 'number' && (typeof v !== 'number' || !Number.isFinite(v))) problems.push(`${label}: ${key} must be a number (grid units), not ${show(v)}.`)
    else if (typeof sample0[key] === 'boolean' && typeof v !== 'boolean') problems.push(`${label}: ${key} must be true or false, not ${show(v)}.`)
  }
  if (problems.length) return { problems }

  // In range: what the builder keeps is what was asked, else each change is a fix.
  const part = sanitizePart(o, id as string)!
  const kept = part as unknown as Record<string, unknown>
  for (const key of Object.keys(o)) {
    if (typeof o[key] !== 'number' || kept[key] === o[key]) continue
    problems.push(`${label}: ${key} ${o[key]} is out of range; use ${kept[key]}: ${rangeRule(part, key)}.`)
  }
  return { problems, part }
}

export interface Checked {
  problems: string[]
  scene?: BuilderScene
}

/** A scene checked against the builder's model: every problem with its fix, or the scene exactly as the builder keeps it. */
export function checkScene(input: unknown): Checked {
  if (typeof input === 'string') {
    try {
      input = JSON.parse(input)
    } catch {
      return { problems: ['scene is a string that isn’t JSON: pass the scene object, {"name", "base", "parts": [...]}.'] }
    }
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { problems: ['scene must be an object: {"name": "…", "base": "plinth", "parts": [...]}.'] }
  const o = input as Record<string, unknown>
  const problems: string[] = []
  for (const key of Object.keys(o)) if (!SCENE_KEYS.includes(key)) problems.push(`scene has no field "${key}"; drop it (a scene takes ${SCENE_KEYS.join(', ')}).`)
  if (o.version !== undefined && o.version !== 1) problems.push(`version ${show(o.version)}: the format is version 1; use 1 or drop it.`)
  if (o.name !== undefined && (typeof o.name !== 'string' || !o.name.trim() || o.name.trim().length > 40)) problems.push(`name must be a string of 1 to 40 characters${typeof o.name === 'string' && o.name.length > 40 ? `; use ${show(o.name.trim().slice(0, 40))}` : ''}.`)
  if (o.base !== undefined && !BASES.includes(o.base as never)) problems.push(`base ${show(o.base)} is unknown; use one of ${oneOfText(BASES)}.`)

  const groupIds = new Set<string>()
  if (o.groups !== undefined && !Array.isArray(o.groups)) problems.push('groups must be an array of {"id", "lift", "float"}.')
  for (const [i, g] of (Array.isArray(o.groups) ? o.groups : []).entries()) {
    const r = g as Record<string, unknown>
    if (!g || typeof g !== 'object' || typeof r.id !== 'string' || !validId(r.id) || groupIds.has(r.id)) {
      problems.push(`groups[${i}] needs a unique id (${ID_RULE}), e.g. {"id": "${nextId([...groupIds], 'g')}", "lift": 0, "float": 0}.`)
      continue
    }
    groupIds.add(r.id)
    for (const [key, max] of [['lift', CEILING], ['float', 1]] as const) {
      const v = r[key]
      if (v !== undefined && (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > max)) problems.push(`groups[${i}] ("${r.id}"): ${key} must be a number from 0 to ${max}, not ${show(v)}.`)
    }
    for (const key of Object.keys(r)) if (!['id', 'lift', 'float'].includes(key)) problems.push(`groups[${i}] ("${r.id}") has no field "${key}"; a group takes id, lift and float.`)
  }

  if (!Array.isArray(o.parts)) return { problems: [...problems, `parts must be an array of 1 to ${MAX_PARTS} parts (see get_illustration_guide).`] }
  if (!o.parts.length) problems.push('parts is empty: add the parts to draw (see get_illustration_guide).')
  if (o.parts.length > MAX_PARTS) problems.push(`${o.parts.length} parts: a scene holds at most ${MAX_PARTS}; drop ${o.parts.length - MAX_PARTS}, or merge rows of small parts into one box or platform.`)
  const ids = new Map<string, number>()
  const parts: Part[] = []
  for (const [i, raw] of o.parts.entries()) {
    const checked = checkPart(raw, i, ids, groupIds)
    problems.push(...checked.problems)
    if (checked.part) parts.push(checked.part)
  }
  for (const id of groupIds) {
    const members = o.parts.filter((p) => (p as { group?: unknown } | null)?.group === id).length
    if (members < 2) problems.push(`group "${id}" holds ${members === 1 ? 'one part' : 'no parts'}: a group holds two or more; give another part "group": "${id}", or drop the group.`)
  }
  if (problems.length) return { problems }

  const scene = sanitizeScene(o)!
  // Held to what the builder keeps: a check above that missed something is still a problem, not a silent change.
  if (JSON.stringify(scene.parts) !== JSON.stringify(parts)) return { problems: ['The builder would change this scene in a way this check doesn’t name; compare it with the guide’s examples.'] }
  return { problems: [], scene }
}

/* ── Warnings: valid, but likely not what was meant ──────────────────────── */

const overlap = (a: Bounds, b: Bounds) => a.x < b.x + b.w - 1e-6 && b.x < a.x + a.w - 1e-6 && a.y < b.y + b.d - 1e-6 && b.y < a.y + a.d - 1e-6
/** Side by side and at the same height: a sign on a wall, a pipe off a tank. */
const touches = (a: Bounds, b: Bounds) =>
  a.x <= b.x + b.w + 1e-6 && b.x <= a.x + a.w + 1e-6 && a.y <= b.y + b.d + 1e-6 && b.y <= a.y + a.d + 1e-6 && a.z < b.z + b.h + 1e-6 && b.z < a.z + a.h + 1e-6

export function sceneWarnings(scene: BuilderScene): string[] {
  const out: string[] = []
  const names = (p: Part) => `${p.id}${p.name ? ` ("${p.name}")` : ''}`
  const lit = scene.parts.filter((p) => p.lit).length
  if (!lit && scene.parts.length > 1) out.push('Nothing is lit: set "lit": true on the one part the scene is about.')
  if (lit > 2) out.push(`${lit} parts are lit: the accent reads best on one.`)
  const floor = baseTop(scene.base)
  const boxes = scene.parts.map((p) => ({ part: p, b: boundsOf(p) }))
  for (const [i, { part, b }] of boxes.entries()) {
    if (b.z < floor - 1e-6) out.push(`${names(part)} sinks into the ${scene.base} (its top is at z ${floor}): set z to ${floor}.`)
    // What it stands on: the base, or the highest top under it at or below its own bottom.
    const under = Math.max(floor, ...boxes.filter((o) => o.part !== part && overlap(o.b, b) && o.b.z + o.b.h <= b.z + 1e-6).map((o) => o.b.z + o.b.h))
    const held = boxes.some((o) => o.part !== part && touches(o.b, b))
    if (b.z > under + 1e-6 && !held) out.push(`${names(part)} hovers ${Math.round((b.z - under) * 100) / 100} above what is under it and touches nothing; to rest it, set z to ${Math.round(under * 100) / 100}.`)
    for (const o of boxes.slice(i + 1)) {
      if (overlap(o.b, b) && b.z < o.b.z + o.b.h - 1e-6 && o.b.z < b.z + b.h - 1e-6) out.push(`${names(part)} and ${names(o.part)} cut through each other; isometric sorting draws that wrongly: move one, or stack it (z = the other's z + h).`)
    }
  }
  return out
}

/* ── Drawing it ──────────────────────────────────────────────────────────── */

/** The builder link, as the builder writes its own address: the name (unless Untitled) and the scene. */
export function builderLink(site: string, scene: BuilderScene): string {
  const name = scene.name === 'Untitled' ? '' : `name=${encodeURIComponent(scene.name)}&`
  return `${site}/illustrations/build?${name}s=${encodeScene(scene)}`
}

/** A component name to a scene name: "IllustrationEmptyInbox" and "EmptyInbox" both give "Empty Inbox". */
const sceneName = (name: string) => name.trim().replace(/^Illustration(?=[A-Z])/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2').slice(0, 40)

/** The longest scene the builder opens from a link. */
const LINK_MAX = 4000

export interface Drawn {
  text: string
  isError: boolean
  scene?: BuilderScene
  code?: string
  link?: string
}

export function drawIllustration(catalog: Catalog, input: unknown, options: { name?: string; cwd?: string } = {}): Drawn {
  const checked = checkScene(input)
  if (!checked.scene) {
    const n = checked.problems.length
    return { isError: true, text: [`The scene has ${n} problem${n === 1 ? '' : 's'}; fix ${n === 1 ? 'it' : 'them'} and call draw_illustration again (the format: get_illustration_guide).`, '', ...checked.problems.map((p) => `- ${p}`)].join('\n') }
  }
  const named = options.name ? sceneName(options.name) : ''
  const scene: BuilderScene = named ? { ...checked.scene, name: named } : checked.scene
  const fits = encodeScene(scene).length <= LINK_MAX
  const link = fits ? builderLink(catalog.index.meta.site, scene) : undefined
  const { project } = inspectProject(catalog.host.project(options.cwd))
  const source = generateCode(scene, { link })
  const component = componentNameOf(scene.name)
  const file = `${project.path('src') ? 'src/' : ''}components/illustrations/${sceneSlug(scene.name)}.tsx`
  const lit = scene.parts.filter((p) => p.lit).length
  const warnings = sceneWarnings(scene)
  const install = code('bash', `npx @youj/cli add ${installItems(scene).join(' ')}`) + '\nIt copies in the illustration kit and the shapes the scene uses (skip it if they are there already).'

  const text = [
    `# ${scene.name}`,
    '',
    `Valid: ${scene.parts.length} part${scene.parts.length === 1 ? '' : 's'} on ${scene.base === 'none' ? 'no base' : `a ${BASE_LABELS[scene.base].toLowerCase()}`}${lit ? `, ${lit} lit` : ''}${scene.groups.length ? `, ${scene.groups.length} group${scene.groups.length === 1 ? '' : 's'}` : ''}.`,
    ...(warnings.length ? ['', 'Check these (the scene draws, but they are often mistakes):', ...warnings.map((w) => `- ${w}`)] : []),
    '',
    link ? `Open it in the builder to see it, tweak it and export SVG or PNG: ${link}` : `The scene is too long for a builder link (over ${LINK_MAX} characters); fewer or unnamed parts shorten it.`,
    '',
    '## Install',
    '',
    install,
    '',
    `## Write it to \`${file}\``,
    '',
    code('tsx', source),
    '',
    `Use it: \`<${component} title="…" />\` (decorative without a title; reduced motion draws it finished and still). It takes the scenes' props: \`explode="hover"\` takes it apart by each part's lift, \`float={false}\` holds it still, \`unit\` sets its size (px per grid unit, default 22).`,
    '',
    'This is the builder’s own code export: the kit’s shapes placed in grid units, source you own. The builder itself is not a published entry, so there is no package route.',
  ].join('\n')
  return { text, isError: false, scene, code: source, link }
}
