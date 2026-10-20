import type { Catalog } from '../catalog'
import { NotFound } from '../format'

/* The whole-catalog lists for what search otherwise has to be asked about by meaning:
 * components, loaders and miniatures, optionally one category. */

const oneLine = (text: string, max = 100) => {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat
}

const grouped = <T extends { category: string }>(items: T[], line: (item: T) => string) => {
  const out: string[] = []
  let current: string | undefined
  for (const item of items) {
    if (item.category !== current) {
      current = item.category
      out.push('', `## ${current}`)
    }
    out.push(line(item))
  }
  return out
}

function inCategory<T extends { category: string }>(what: string, items: T[], category?: string): T[] {
  const asked = category?.trim().toLowerCase()
  if (!asked) return items
  const found = items.filter((i) => i.category.toLowerCase() === asked)
  if (!found.length) throw new NotFound(`No ${what} in "${category}". Categories: ${[...new Set(items.map((i) => i.category))].join(', ')}.`)
  return found
}

export function listComponents(catalog: Catalog, options: { kind?: string; category?: string } = {}): string {
  const all = catalog.index.components.filter((c) => !options.kind || c.kind === options.kind)
  if (!all.length) throw new NotFound(`No components of kind "${options.kind}". Kinds: ui, core, motion, sound.`)
  const list = inCategory('components', all, options.category).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  return [
    `${list.length} components (a package import, or \`npx @youj/cli add <name>\` to copy one in):`,
    ...grouped(list, (c) => `- \`${c.name}\` (${c.kind}, ${c.package}, ${c.stability}) ${c.title}: ${oneLine(c.description)}`),
    '',
    'Details: get_component("<name>").',
  ].join('\n')
}

export function listLoaders(catalog: Catalog, category?: string): string {
  const list = inCategory('loaders', catalog.index.loaders, category)
  return [
    `${list.length} loaders (\`npx @youj/cli add loader-<id>\`, or \`import { Loader<Name> } from '@youj/loaders/<id>'\`):`,
    ...grouped(list, (a) => `- \`${a.id}\` (\`${a.component}\`, ${a.technique}) ${oneLine(a.description)}`),
    '',
    'search finds loaders by meaning, e.g. "uploading".',
  ].join('\n')
}

export function listMiniatures(catalog: Catalog, category?: string): string {
  const list = inCategory('miniatures', catalog.index.miniatures, category)
  return [
    `${list.length} miniatures (\`npm install @youj/miniatures\`, then \`import { <Component> } from '@youj/miniatures/<id>'\`):`,
    ...grouped(list, (m) => `- \`${m.id}\` (\`${m.component}\`) ${oneLine(m.description)}`),
    '',
    'search finds miniatures by meaning.',
  ].join('\n')
}
