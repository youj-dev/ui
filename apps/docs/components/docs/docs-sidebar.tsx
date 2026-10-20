'use client'

import { useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type * as PageTree from 'fumadocs-core/page-tree'
import { ScrollArea } from '@youj/react'
import { PageTreeNav } from '@/components/docs/page-tree'
import { prefetchRoute } from '@/components/site/intent-link'
import { cn } from '@/lib/cn'

/** The sidebar's three areas: the component reference, the block families, and everything else (getting started, guides, theming, visuals, motion, sound). */
type Area = 'docs' | 'components' | 'blocks'
const AREAS: { id: Area; label: string; href?: string }[] = [
  { id: 'docs', label: 'Docs', href: '/docs' },
  { id: 'components', label: 'Components', href: '/docs/components' },
  { id: 'blocks', label: 'Blocks' },
]
/** The tree's sections each area shows, by separator name. */
const SHOWN: Record<Area, (section: string) => boolean> = {
  components: (section) => section === 'Components',
  blocks: (section) => section === 'Blocks',
  docs: (section) => section !== 'Components' && section !== 'Blocks',
}

/** The first blocks page in a run of nodes: where the Blocks area, which has no index of its own, opens. */
function firstUrl(nodes: PageTree.Node[]): string | undefined {
  for (const node of nodes) {
    const url = node.type === 'page' ? (node.url.startsWith('/docs/blocks/') ? node.url : undefined) : node.type === 'folder' ? (node.index?.url ?? firstUrl(node.children)) : undefined
    if (url) return url
  }
}

/** The tree cut to an area's sections. */
function areaTree(tree: PageTree.Root, area: Area): PageTree.Root {
  const children: PageTree.Node[] = []
  let keep = true
  for (const node of tree.children) {
    if (node.type === 'separator') keep = SHOWN[area](String(node.name ?? ''))
    if (keep) children.push(node)
  }
  return { ...tree, children }
}

/** The likely next reads: the pager's two pages, then the current page's neighbors in the tree, nearest first. At most six. */
function nextReads(current: HTMLElement) {
  const pager = [...document.querySelectorAll<HTMLAnchorElement>('nav[aria-label=Pages] a')]
  const rows = [...(current.closest('ul')?.querySelectorAll<HTMLAnchorElement>(':scope > li > a.tree-link, :scope > li > div > a.tree-link') ?? [])]
  const at = rows.indexOf(current as HTMLAnchorElement)
  const near = rows.map((a, i) => [a, Math.abs(i - at) + (i < at ? 0.5 : 0)] as const).sort((a, b) => a[1] - b[1])
  const hrefs = [...pager, ...near.map(([a]) => a)].map((a) => a.getAttribute('href')!)
  return [...new Set(hrefs)].filter((h) => h !== current.getAttribute('href')).slice(0, 6)
}

/**
 * The desktop sidebar: the tree in Youj UI's ScrollArea (overlay bars,
 * edges that fade by how much is left). On arrival the current page is
 * brought into view inside the sidebar, never by scrolling the page. When the
 * browser is idle, the pages a reader is likely to open next are prefetched.
 */
export function DocsSidebar({ tree }: { tree: PageTree.Root }) {
  const pathname = usePathname()
  const router = useRouter()
  const root = useRef<HTMLDivElement>(null)
  const area: Area = pathname?.startsWith('/docs/components') ? 'components' : pathname?.startsWith('/docs/blocks') ? 'blocks' : 'docs'
  const shown = useMemo(() => areaTree(tree, area), [tree, area])
  const blocksHref = useMemo(() => firstUrl(areaTree(tree, 'blocks').children.filter((node) => node.type !== 'separator')) ?? '/docs', [tree])

  useEffect(() => {
    const viewport = root.current?.querySelector<HTMLElement>('[data-slot=scroll-area-viewport]')
    const current = viewport?.querySelector<HTMLElement>('[aria-current=page]')
    if (!viewport || !current) return
    const reveal = () => {
      const view = viewport.getBoundingClientRect()
      const row = current.getBoundingClientRect()
      const margin = 48
      if (row.top < view.top + margin) viewport.scrollTop -= view.top + margin - row.top
      else if (row.bottom > view.bottom - margin) viewport.scrollTop += row.bottom - (view.bottom - margin)
    }
    reveal()

    const idle = window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 200))
    const task = idle(() => nextReads(current).forEach((href) => prefetchRoute(router, href)))
    return () => (window.cancelIdleCallback ?? clearTimeout)(task)
  }, [pathname, router])

  return (
    <div ref={root} className="h-full">
      <ScrollArea aria-label="Docs navigation" className="h-full" viewportClassName="px-3 pt-6 pb-10">
        <nav aria-label="Docs area" className="mb-6 ms-3 flex gap-1">
          {AREAS.map((a) => (
            <Link
              key={a.id}
              href={a.href ?? blocksHref}
              aria-current={a.id === area ? 'true' : undefined}
              className={cn(
                'inline-flex h-9 items-center rounded-[max(0px,calc(var(--radius-control)-3px))] px-3 text-ui font-medium transition-colors yj-duration-fast ease-standard focus-ring',
                a.id === area ? 'bg-(--code-bg) text-fg' : 'text-fg-muted hover:text-fg',
              )}
            >
              {a.label}
            </Link>
          ))}
        </nav>
        <PageTreeNav tree={shown} timeline />
      </ScrollArea>
    </div>
  )
}
