import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/* Where a page sits: its section, then its group. It's the eyebrow above a
 * page's title and the breadcrumbs of search results and the MCP index. Read
 * from the content folders rather than the URL, because a group is a
 * `(group)` folder the URL leaves out: components/(pickers-and-inputs)/date-picker.mdx is
 * /docs/components/date-picker, in "Components / Pickers & inputs". Folder
 * titles come from their meta.json, as the sidebar's do. Plain fs, so the MCP
 * index can use it outside Next. */

const CONTENT = join(/*turbopackIgnore: true*/ process.cwd(), 'content/docs')
const GROUP = /^\(.+\)$/

interface Meta {
  title?: string
  pagesIndex?: string
}

function meta(dir: string): Meta {
  const file = join(CONTENT, dir, 'meta.json')
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Meta) : {}
}

const words = (name: string) => name.replace(/^\(|\)$/g, '').replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

let trails: Map<string, string[]> | undefined

/** A top-level page's section: the root meta.json's separator above it, or above the group that lists it (`(theming)` names `../theming`); Get started by default. */
function topLevelSections(): Map<string, string> {
  const out = new Map<string, string>()
  const pages = (file: string) => (JSON.parse(readFileSync(join(CONTENT, file), 'utf8')) as { pages?: string[] }).pages ?? []
  let section = 'Get started'
  for (const entry of pages('meta.json')) {
    const separator = /^---(.+)---$/.exec(entry)?.[1]
    if (separator) section = separator
    else if (GROUP.test(entry) && existsSync(join(CONTENT, entry, 'meta.json'))) {
      for (const page of pages(`${entry}/meta.json`)) if (/^\.\.\/[^./]+$/.test(page)) out.set(page.slice(3), section)
    } else if (/^[\w-]+$/.test(entry)) out.set(entry, section)
  }
  return out
}

/** Every page's trail, by its slug (`components/date-picker`). */
function trailsBySlug(): Map<string, string[]> {
  if (trails) return trails
  trails = new Map()
  const topLevel = topLevelSections()
  for (const file of (readdirSync(CONTENT, { recursive: true }) as string[]).filter((f) => f.endsWith('.mdx'))) {
    const dirs = file.split(/[\\/]/)
    const name = dirs.pop()!.replace(/\.mdx$/, '')
    const slug = [...dirs.filter((d) => !GROUP.test(d)), ...(name === 'index' ? [] : [name])].join('/')
    if (!dirs.length) {
      trails.set(slug, [topLevel.get(name) ?? 'Get started'])
      continue
    }
    const section = meta(dirs[0]!).title ?? words(dirs[0]!)
    // A page in a group or a sub-folder names it, unless it's that folder's own page.
    const folder = dirs.slice(0, 2).join('/')
    const own = name === 'index' || name === meta(folder).pagesIndex
    trails.set(slug, dirs.length > 1 && !own ? [section, meta(folder).title ?? words(dirs[1]!)] : [section])
  }
  return trails
}

/** The eyebrow above a page title: "Components / Forms & inputs" for components/date-picker, a top-level page's section ("Get started"). */
export function sectionTrail(slugs: string[]): string[] {
  const known = trailsBySlug().get(slugs.join('/'))
  if (known) return known
  return slugs.length > 1 ? [words(slugs[0]!)] : ['Get started']
}
