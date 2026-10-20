import { installedFiles } from '@/components/showcase/install-parts'
import { exampleSource } from '@/lib/code-files'
import { codeUrl } from '@/lib/code-url'
import { isBasic, type BasicEntry } from '@/lib/basics'
import { itemHref } from '@/lib/block-docs'
import { LEVEL_LABELS } from '@/lib/level-paths'
import { levelCategories } from '@/lib/levels'
import { blocks, framing, installOf, type ShowcaseEntry } from '@/lib/showcase'
import { LEVELS, taxonomy, type Level } from '@/lib/taxonomy'
import type { ViewerEntry, ViewerFile } from '@/components/showcase/viewer-entry'

/* What an item's /view page opened on its own reads, a level at a time (a docs
 * preview's "Open in a new tab": components/showcase/full-preview), so no page
 * carries it. Each item's stories, how it's framed, the command that adds it, its
 * import, its files and its page. Prerendered: `/viewer-index/card.json`. */

export const dynamic = 'force-static'
export const dynamicParams = false

export function generateStaticParams() {
  return LEVELS.map((level) => ({ level: `${level}.json` }))
}

const lines = (code: string) => code.split('\n').length

function basicEntry(e: BasicEntry, category: string): ViewerEntry {
  return {
    key: `${e.kind}/${e.slug}`,
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    category,
    level: LEVEL_LABELS[e.level].one,
    framing: 'card',
    docs: e.href,
    install: `npx youj add ${e.slug}`,
    ...(e.import && { import: e.import }),
    stories: e.demos.map((d) => ({ id: d.id, label: d.label, files: [{ path: `${d.id}.tsx`, src: codeUrl.example(d.id), lines: lines(exampleSource(d.id)) }] })),
  }
}

function showcaseEntry(e: ShowcaseEntry): ViewerEntry {
  // Its stack, else the rule, else none.
  const names = installOf(e).install ?? e.slug
  const command = names ? `npx youj add ${names}` : undefined
  const href = itemHref(e)
  return {
    key: `${e.kind}/${e.slug}`,
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    category: taxonomy().levels[e.level].categories[e.category] ?? e.category,
    level: LEVEL_LABELS[e.level].one,
    framing: framing(e),
    ...(href && { page: href }),
    ...(command && { install: command }),
    stories: e.stories.map((s) => ({ id: s.id, label: s.name })),
    files: installedFiles(e) as ViewerFile[],
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ level: string }> }) {
  const level = (await params).level.replace(/\.json$/, '') as Level
  if (!LEVELS.includes(level)) return new Response('Not found', { status: 404 })
  if (level === 'component') {
    // The list's order, each component once (Essentials repeats some).
    const seen = new Set<string>()
    const entries = levelCategories(level)
      .filter((c) => !c.repeats)
      .flatMap((c) => c.entries.flatMap((e) => (!isBasic(e) || seen.has(e.slug) ? [] : (seen.add(e.slug), [basicEntry(e, c.title)]))))
    return Response.json(entries)
  }
  const items: ShowcaseEntry[] = blocks().filter((b) => b.level === level)
  return Response.json(items.map(showcaseEntry))
}
