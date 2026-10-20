import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { isBasicLevel, type BasicLevel } from './level-paths.ts'
import { registryItems } from './registry.ts'
import { docsUrl, pageFor } from './showcase.ts'
import { taxonomy, type Complexity } from './taxonomy.ts'

/* The components of the Components list: taxonomy.json's component items (simple and
 * composite, which the list filters by), each with its docs page, its main demo (the first
 * <ComponentPreview> on that page, shown by /view/component/<slug>), every other
 * example on that page (the full-page preview's stories) and the import its page
 * shows. A component's page is its docs page. */

export interface BasicEntry {
  /** The list, which is also the kind of its /view page (`component/<slug>`). */
  kind: BasicLevel
  level: BasicLevel
  /** One control, surface, mark or effect, or several cooperating parts: the list's `?complexity=` filter. */
  complexity: Complexity
  /** The registry item's name: `button`, `share-ring`. */
  slug: string
  title: string
  summary: string
  /** Its category id on its level's list. */
  category: string
  /** Its docs page: `/docs/components/button`. */
  href: string
  /** The example its card renders live, as the examples' index names it: `button/demo`. */
  demo?: string
  /** Every live example on its docs page, in page order (the main demo first), each named by the heading it sits under: the viewer's stories. */
  demos: { id: string; label: string }[]
  /** What the page imports it by, when it's from `@youj/react`: `import { Button } from '@youj/react'`. */
  import?: string
}

/* The curated order of the list, in one place. A list opens with an
 * Essentials group (ESSENTIALS, in this order; each item also stays in its own
 * category), its categories run basics first (CATEGORY_ORDER), and inside a
 * category the COMMON items lead in the order listed, then the rest A to Z. */

export const ESSENTIALS: string[] = [
  ...['button', 'input', 'textarea', 'select', 'checkbox', 'radio-group', 'switch', 'label', 'card', 'badge', 'tabs', 'dialog', 'tooltip', 'dropdown-menu', 'avatar'],
  ...['data-table', 'combobox', 'date-picker', 'multi-select', 'command-palette', 'file-upload', 'kanban'],
]

export const CATEGORY_ORDER: string[] = [
  ...['actions', 'form-controls', 'display', 'feedback', 'overlays', 'navigation', 'layout', 'data-marks', 'capsules', 'media', 'effects', 'backgrounds'],
  ...['data-and-tables', 'pickers-and-inputs', 'navigation-and-app-chrome', 'charts-and-meters', 'timelines-and-planning', 'chat-and-ai', 'specialized'],
]

const COMMON: string[] = [
  ...['button', 'button-group', 'toggle', 'toggle-group', 'segmented-control'],
  ...['input', 'select', 'checkbox', 'switch', 'radio-group', 'textarea', 'label', 'field', 'form', 'input-group', 'slider'],
  ...['card', 'badge', 'avatar', 'table', 'typography'],
  ...['alert', 'toast', 'progress', 'skeleton', 'spinner', 'empty'],
  ...['dialog', 'tooltip', 'popover', 'dropdown-menu', 'sheet', 'alert-dialog', 'drawer', 'command'],
  ...['tabs', 'breadcrumb', 'pagination', 'accordion'],
  ...['separator', 'scroll-area'],
  ...['data-table', 'combobox', 'date-picker', 'multi-select', 'command-palette', 'file-upload', 'kanban'],
  ...['date-range-picker', 'chart', 'sidebar', 'app-header', 'wizard', 'tree-view', 'timeline', 'carousel'],
]

const CONTENT = join(/*turbopackIgnore: true*/ process.cwd(), 'content/docs')

/** A page with no demo of its own borrows the demo of what it's presented in. */
const DEMO_OF: Record<string, string> = { presentation: 'sheet/demo', empty: 'empty-state/demo', label: 'field/demo' }

interface Page {
  demo?: string
  demos: { id: string; label: string }[]
  import?: string
}

const hasExample = (name: string) => existsSync(join(process.cwd(), 'examples', `${name}.tsx`))

/** Each `<ComponentPreview>` on a page, named by the `##` heading or `<Story label>` above it (the first, above every heading, is the overview). */
function pageDemos(text: string): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = []
  let heading = 'Overview'
  for (const line of text.split('\n')) {
    const h = /^##\s+(.+?)\s*$/.exec(line)
    if (h) heading = h[1]!
    const story = /<Story\s[^>]*\blabel="([^"]+)"/.exec(line)
    if (story) heading = story[1]!
    for (const [, name] of line.matchAll(/<ComponentPreview\s+name="([^"]+)"/g)) {
      if (!name || out.some((d) => d.id === name) || !hasExample(name)) continue
      const taken = out.filter((d) => d.label === heading || d.label.startsWith(`${heading} `)).length
      out.push({ id: name, label: taken ? `${heading} ${taken + 1}` : heading })
    }
  }
  return out
}

let pages: Map<string, Page> | undefined

/** What each docs page shows, by URL: its first live example and its first `@youj/react` import. */
function docsPageFacts(): Map<string, Page> {
  if (pages) return pages
  pages = new Map()
  for (const file of (readdirSync(CONTENT, { recursive: true }) as string[]).filter((f) => /^(components|patterns)[\\/].*\.mdx$/.test(f))) {
    const text = readFileSync(join(CONTENT, file), 'utf8')
    const demo = /<ComponentPreview\s+name="([^"]+)"/.exec(text)?.[1]
    // A stories page puts its stories (which may import a companion) before Installation & usage: read the import there first.
    const usage = text.slice(Math.max(0, text.indexOf('id="installation-usage"')))
    const imports = /import \{\s*([A-Za-z0-9_]+)[^}]*\}\s*from '(@youj\/react[^']*)'/
    const code = imports.exec(usage) ?? imports.exec(text)
    pages.set(docsUrl(file), { demo, demos: pageDemos(text), import: code ? `import { ${code[1]} } from '${code[2]}'` : undefined })
  }
  return pages
}

let cache: BasicEntry[] | undefined

/** The list's components, in taxonomy order; one whose page doesn't exist yet isn't listed. */
export function basics(level: BasicLevel = 'component'): BasicEntry[] {
  if (cache) return cache
  const registry = registryItems()
  const facts = docsPageFacts()
  const out = Object.entries(taxonomy().items).flatMap(([name, e]) => {
    if (e.level !== level) return []
    const href = pageFor(name)
    if (!href) return []
    const page = facts.get(href)
    const item = registry.get(name)
    const demo = page?.demo ?? DEMO_OF[name]
    const main = demo && hasExample(demo) ? demo : undefined
    const others = (page?.demos ?? []).filter((d) => d.id !== main)
    const entry: BasicEntry = {
      kind: level,
      level,
      slug: name,
      title: item?.title ?? name,
      summary: item?.description ?? '',
      complexity: e.complexity ?? 'simple',
      category: e.category,
      href,
      ...(main && { demo: main }),
      demos: main ? [{ id: main, label: page?.demos.find((d) => d.id === main)?.label ?? 'Overview' }, ...others] : others,
      ...(item?.package === '@youj/react' && page?.import && { import: page.import }),
    }
    return [entry]
  })
  const rank = (slug: string) => {
    const at = COMMON.indexOf(slug)
    return at < 0 ? Infinity : at
  }
  out.sort((a, b) => rank(a.slug) - rank(b.slug) || a.title.localeCompare(b.title, 'en'))
  cache = out
  return out
}

export const isBasic = (e: { kind: string }): e is BasicEntry => isBasicLevel(e.kind)
