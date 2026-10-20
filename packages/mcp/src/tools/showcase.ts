import type { Catalog } from '../catalog'
import { code, NotFound, stabilityLine } from '../format'
import type { ShowcaseItem } from '../types'

/* Blocks (cards, sections and screens): the list, one block's
 * details, and its source a page at a time. */

/** Characters of source per page: enough for most files, small enough to keep context for the work. */
export const SOURCE_PAGE = 12_000

/** The copy-in levels a block is on (the docs' "Choosing a level"). */
export const BLOCK_LEVELS = ['card', 'section', 'screen'] as const

export function listShowcase(catalog: Catalog, group?: string, level?: string): string {
  const list = catalog.index.blocks
  const byGroup = group ? list.filter((s) => s.group?.toLowerCase() === group.toLowerCase()) : list
  if (!byGroup.length) {
    const groups = [...new Set(list.map((s) => s.group).filter(Boolean))].join(', ')
    throw new NotFound(`No blocks in "${group}". Groups: ${groups}.`)
  }
  const wanted = level?.toLowerCase().replace(/s$/, '')
  const filtered = wanted ? byGroup.filter((s) => s.level === wanted) : byGroup
  if (!filtered.length) throw new NotFound(`No blocks at level "${level}". Levels: ${BLOCK_LEVELS.join(', ')}.`)
  const counts = BLOCK_LEVELS.map((l) => [l, filtered.filter((s) => s.level === l).length] as const).filter(([, n]) => n).map(([l, n]) => `${n} ${l}s`).join(', ')
  const out = [`${filtered.length} blocks (${counts}; copy-in, install with \`npx @youj/cli add <slug>\`):`]
  let current: string | undefined
  for (const s of filtered) {
    if (s.group !== current) {
      current = s.group
      out.push('', `## ${current}`)
    }
    out.push(`- \`${s.slug}\` (${s.level}) ${s.title}: ${s.summary}`)
  }
  out.push('', 'Details and source: get_block("<slug>").')
  return out.join('\n')
}

/** The components a block's editorial list names, from the index. */
function builtWith(catalog: Catalog, item: ShowcaseItem) {
  return item.components.flatMap((link) => {
    const component = catalog.index.components.find((c) => link.url.replace(/\/$/, '').endsWith(`/docs/${c.docs}`) || c.title === link.title)
    return component ? [component] : []
  })
}

/** What the item's main file exports, and the import it gets in an app: `import { Customers } from '@/blocks/app/customers'`. */
async function appImport(catalog: Catalog, item: ShowcaseItem): Promise<string | undefined> {
  const file = item.files[0]
  if (!file) return undefined
  const source = await catalog.source(file)
  const listed = [...source.matchAll(/^export \{([^}]*)\}/gm)].flatMap((m) => m[1]!.split(',').map((part) => part.trim()).filter((part) => part && !part.startsWith('type ')).map((part) => part.split(/\s+as\s+/).pop()!))
  const names = [...new Set([...[...source.matchAll(/^export (?:function|const|class) ([A-Z]\w*)/gm)].map((m) => m[1]!), ...listed.filter((name) => /^[A-Z]/.test(name))])]
  return names.length ? `import { ${names.join(', ')} } from '@/${file.replace(/\.tsx?$/, '')}'` : undefined
}

export function install(item: ShowcaseItem): string {
  if (item.registry) return `npx @youj/cli add ${item.registry}`
  if (item.stack?.length) return `npx @youj/cli add ${item.stack.join(' ')}`
  return ''
}

export async function getShowcase(catalog: Catalog, slug: string, options: { source?: boolean; file?: string; offset?: number } = {}): Promise<string> {
  const item = catalog.block(slug)
  const site = catalog.index.meta.site
  const sizes = options.source || options.file ? [] : await Promise.all(item.files.map(async (f) => `- ${f} (${Math.round((await catalog.source(f)).length / 100) / 10}k chars)`))

  if (options.source || options.file) {
    const file = options.file ? item.files.find((f) => f === options.file || f.endsWith(`/${options.file}`)) : item.files[0]
    if (!file) throw new NotFound(`${item.title} has no file "${options.file}". Its files:\n${item.files.join('\n')}`)
    const text = await catalog.source(file)
    const offset = Math.max(0, options.offset ?? 0)
    const page = text.slice(offset, offset + SOURCE_PAGE)
    const end = offset + page.length
    const next = end < text.length ? `\n\nMore: get_block({ name: "${item.slug}", file: "${file}", offset: ${end} }) (${text.length - end} chars left).` : ''
    const others = item.files.filter((f) => f !== file)
    return [
      `${file} (${offset ? `chars ${offset}–${end} of ${text.length}` : `${text.length} chars`}), as \`youj add\` writes it into an app (under \`src/\` when the app has one):`,
      '',
      code(file.endsWith('.css') ? 'css' : 'tsx', page),
      next,
      others.length ? `\nOther files: ${others.join(', ')} (pass \`file\`).` : '',
    ].join('\n').trim()
  }

  const command = install(item)
  const out = [
    `# ${item.group ? `${item.group}: ` : ''}${item.title}`,
    '',
    `Block \`${item.slug}\` · preview: ${site}${item.url}`,
    '',
    item.description || item.summary,
    '',
    stabilityLine(item.stability, site),
  ]
  if (command) out.push('', '## Install', '', code('bash', command), '', 'The CLI copies the block into `blocks/…` with the components it uses (`@/components/ui/…`), so you can edit it freely.')
  const usage = await appImport(catalog, item)
  if (usage) out.push('', 'Then import it:', code('tsx', usage))
  if (item.stack?.length) out.push('', `A composition of blocks: ${item.stack.join(', ')}.`)
  const used = builtWith(catalog, item)
  if (used.length) out.push('', '## Built with', '', used.map((c) => c.title).join(', '), '', 'To build with the package instead of copying the block, import them from it:', code('tsx', [...new Set(used.flatMap((c) => (!c.install.copyOnly && c.install.packageImport ? [c.install.packageImport] : [])))].join('\n')))
  if (item.theme) out.push('', `Designed in: ${item.theme.preset ? `the ${item.theme.preset} preset` : `a custom theme "${item.theme.theme}" (accent ${item.theme.accent})`}.`)
  out.push('', '## Files', '', ...(sizes.length ? ['Where `youj add` writes them (under `src/` when the app has one):', '', ...sizes, '', `Source: get_block({ name: "${item.slug}", source: true }), a file at a time.`] : ['None of its own: it installs the blocks it stacks, each with its files. Read one with get_block.']))
  return out.join('\n')
}
