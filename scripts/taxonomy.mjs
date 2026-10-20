// The ladder (taxonomy.json): every item's level and its category within it.
//
//   node scripts/taxonomy.mjs           check the file against the registry; exit 1 on problems (pnpm check:taxonomy, part of pnpm verify)
//   node scripts/taxonomy.mjs --ladder  list items that compose a higher level (pnpm lint:ladder; report only)
//   node scripts/taxonomy.mjs --ladder --strict   the same, exit 1 on any
//
// The check fails on a UI registry item (component or block) with no
// level or category, an entry that names no item, a category its level doesn't
// have, a level its registry type can't have (a component is a component, a
// block a card, section, frame or screen), a component
// without a complexity (simple or composite) or another level with one, and a
// partOf or merge that points nowhere, or an inApp on anything but a screen. packages/ui/scripts/generate.mjs writes
// each item's level, complexity and category into the registry as meta.level,
// meta.complexity and meta.category from the same file.
//
// The `frame` level (the frame's sidebars, top bars, account and search) stays on
// the ladder, in the registry and the CLI and MCP filters, but the site no longer
// browses it: Create chooses those parts, and each keeps its page.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dirname, '..')

export const LEVELS = ['component', 'card', 'section', 'frame', 'screen']
/** How much a component is made of: one thing, or several cooperating parts or a model. */
export const COMPLEXITIES = ['simple', 'composite']
/** What an overlay card opens in, shown on its page. */
export const OPENS = ['dialog', 'sheet', 'popover', 'banner']
/** The levels each registry type can hold. Motion's components (`registry:component`) are components, like UI's. */
const LEVELS_OF_TYPE = {
  'registry:ui': ['component'],
  'registry:component': ['component'],
  'registry:block': ['card', 'section', 'frame', 'screen'],
}
/** The UI registry types that must each have a level. Hooks and libs are plumbing, not on the ladder. */
const LADDER_TYPES = ['registry:ui', 'registry:block']

export function readTaxonomy(dir = root) {
  return JSON.parse(readFileSync(join(dir, 'taxonomy.json'), 'utf8'))
}

/** Every registry item of every package, by name. */
export function readRegistry(dir = root) {
  const items = new Map()
  for (const pkg of readdirSync(join(dir, 'packages')).sort()) {
    const reg = join(dir, 'packages', pkg, 'registry')
    if (!existsSync(reg)) continue
    for (const file of readdirSync(reg).filter((f) => f.endsWith('.json')).sort())
      for (const item of JSON.parse(readFileSync(join(reg, file), 'utf8'))) items.set(item.name, { ...item, package: pkg })
  }
  return items
}

/** A block composition: a story with no registry item of its own (`marketing-landing`: src/blocks/marketing/landing.stories.tsx). */
function isComposition(name, dir) {
  const blocks = join(dir, 'packages/ui/src/blocks')
  return readdirSync(blocks).some((group) => name.startsWith(`${group}-`) && existsSync(join(blocks, group, `${name.slice(group.length + 1)}.stories.tsx`)))
}

export function taxonomyProblems(taxonomy, registry, dir = root) {
  const problems = []
  const { levels, items } = taxonomy
  for (const level of LEVELS) if (!levels[level]) problems.push(`levels: "${level}" is missing`)
  for (const level of Object.keys(levels)) if (!LEVELS.includes(level)) problems.push(`levels: "${level}" isn't one of ${LEVELS.join(', ')}`)

  for (const item of registry.values()) {
    if (item.package === 'ui' && LADDER_TYPES.includes(item.type) && !items[item.name]) problems.push(`${item.name}: no level or category`)
  }
  for (const [name, entry] of Object.entries(items)) {
    const item = registry.get(name)
    const composition = !item && isComposition(name, dir)
    if (!item && !composition) {
      problems.push(`${name}: no registry item or block composition of that name`)
      continue
    }
    if (!levels[entry.level]) {
      problems.push(`${name}: level "${entry.level}" isn't one of ${LEVELS.join(', ')}`)
      continue
    }
    if (entry.level === 'component' ? !COMPLEXITIES.includes(entry.complexity) : entry.complexity !== undefined) problems.push(`${name}: ${entry.level === 'component' ? `a component's complexity must be ${COMPLEXITIES.join(' or ')}` : `a ${entry.level} has no complexity`}`)
    if (!levels[entry.level].categories[entry.category]) problems.push(`${name}: ${entry.level} has no category "${entry.category}"`)
    const allowed = composition ? LEVELS_OF_TYPE['registry:block'] : LEVELS_OF_TYPE[item.type]
    if (!allowed?.includes(entry.level)) problems.push(`${name}: a ${composition ? 'block composition' : item.type} can't be a ${entry.level}`)
    if (entry.partOf && items[entry.partOf]?.level !== entry.level) problems.push(`${name}: partOf "${entry.partOf}" isn't a ${entry.level} in taxonomy.json`)
    if (entry.hidden !== undefined && entry.hidden !== true) problems.push(`${name}: hidden is true or left out`)
    if (entry.opens && (entry.level !== 'card' || !OPENS.includes(entry.opens))) problems.push(`${name}: opens "${entry.opens}" must be ${OPENS.join(', ')}, on a card`)
    if (entry.inApp !== undefined && (entry.level !== 'screen' || entry.inApp !== true)) problems.push(`${name}: inApp is true or left out, on a screen`)
    if (entry.counterpart && (!items[entry.counterpart] || items[entry.counterpart].level === entry.level || items[entry.counterpart].counterpart !== name)) problems.push(`${name}: counterpart "${entry.counterpart}" must be an item of another level that names it back`)
  }
  const merges = Object.groupBy(Object.entries(items).filter(([, e]) => e.merge), ([, e]) => e.merge)
  for (const [group, members] of Object.entries(merges)) if (members.length < 2) problems.push(`merge "${group}": only ${members[0][0]} is in it`)
  return problems
}

/** Items that compose an item of a higher level, from the registry dependencies their imports produce (the generators derive them from the shipped files). */
export function ladderViolations(taxonomy, registry) {
  const rank = (name) => LEVELS.indexOf(taxonomy.items[name]?.level)
  const violations = []
  for (const item of registry.values()) {
    const own = rank(item.name)
    if (own < 0) continue
    for (const dep of item.registryDependencies ?? []) {
      if (rank(dep) > own) violations.push({ item: item.name, level: taxonomy.items[item.name].level, uses: dep, usesLevel: taxonomy.items[dep].level })
    }
  }
  return violations
}

if (import.meta.main ?? process.argv[1] === import.meta.filename) {
  const taxonomy = readTaxonomy()
  const registry = readRegistry()
  if (process.argv.includes('--ladder')) {
    const violations = ladderViolations(taxonomy, registry)
    for (const v of violations) console.log(`${v.item} (${v.level}) uses ${v.uses} (${v.usesLevel})`)
    console.log(`ladder: ${violations.length} item${violations.length === 1 ? '' : 's'} compose a higher level`)
    if (violations.length && process.argv.includes('--strict')) process.exit(1)
  } else {
    const problems = taxonomyProblems(taxonomy, registry)
    if (problems.length) {
      console.error(`taxonomy.json:\n  ${problems.join('\n  ')}`)
      process.exit(1)
    }
    const counts = LEVELS.map((level) => `${Object.values(taxonomy.items).filter((e) => e.level === level).length} ${level}s`)
    console.log(`taxonomy: ok (${counts.join(', ')})`)
  }
}
