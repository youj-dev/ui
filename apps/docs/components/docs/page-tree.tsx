'use client'

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { IntentLink } from '@/components/site/intent-link'
import { usePathname } from 'next/navigation'
import type * as PageTree from 'fumadocs-core/page-tree'
import { Collapse } from '@youj/motion'
import { AudioLinesIcon, ChevronRightIcon, CompassIcon, LayoutGridIcon, PuzzleIcon, RocketIcon, ShapesIcon, WindIcon } from '@youj/icons'
import { cn } from '@/lib/cn'
import { containsUrl, treeSections, type NavItem } from '@/lib/tree'

/* The docs tree, for the sidebar and the mobile menu. Separators become
 * labeled sections; folders are groups that open on motion's Collapse. Only
 * the group holding the current page opens by itself, and it closes again
 * when you leave it, so the tree stays a short list of group names; a group
 * you open yourself stays as you left it. The current page is marked by its
 * accent tick on the timeline beside it and its name in ink, nothing more. */

const TreeContext = createContext({
  keyId: 'docs-tree-key',
  onNavigate: undefined as (() => void) | undefined,
  /** The page a click is taking the reader to, until it arrives. */
  pending: undefined as string | undefined,
  setPending: (() => {}) as (url: string) => void,
})

const rowClass =
  'relative flex min-h-8 touch:min-h-12 w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-start text-ui-lg touch:text-base leading-snug transition-colors yj-duration-fast ease-standard focus-ring touch:active:bg-hover'

function PageRow({ item, nameId, className }: { item: NavItem; nameId?: string; className?: string }) {
  const pathname = usePathname()
  const { onNavigate, pending, setPending } = useContext(TreeContext)
  // The key moves on the click, not when the page arrives; aria-current waits for the page.
  const active = item.url === (pending ?? pathname)
  return (
    <IntentLink
      href={item.url}
      aria-current={item.url === pathname ? 'page' : undefined}
      data-active={active || undefined}
      onClick={(e) => {
        if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) setPending(item.url)
        onNavigate?.()
      }}
      className={cn(rowClass, 'tree-link', active ? 'font-medium text-fg' : 'text-fg-muted hover:bg-[color-mix(in_oklab,var(--color-accent)_6%,transparent)] hover:text-fg', className)}
    >
      <span id={nameId} className="flex min-w-0 flex-1 items-center gap-2">
        {item.name}
        {item.status && (
          <span data-status={item.status} className="sidebar-badge">
            {item.status}
          </span>
        )}
      </span>
    </IntentLink>
  )
}

/** Who opened a group: the route (the current page is in it) or the reader. */
type Opened = false | 'route' | 'reader'

function FolderNode({ folder }: { folder: PageTree.Folder }) {
  const pathname = usePathname()
  const id = useId()
  const holdsActive = containsUrl(folder, pathname)
  const [opened, setOpened] = useState<Opened>(holdsActive ? 'route' : folder.defaultOpen === true ? 'reader' : false)
  const open = opened !== false
  // Navigating into a group opens it; leaving one closes it, unless the reader opened it.
  useEffect(() => {
    setOpened((o) => (holdsActive ? o || 'route' : o === 'route' ? false : o))
  }, [holdsActive])
  const setOpen = (next: (open: boolean) => boolean) => setOpened((o) => (next(o !== false) ? 'reader' : false))

  const chevron = (
    <ChevronRightIcon
      size={14}
      strokeWidth={1.75}
      trigger="none"
      className={cn('tree-chevron shrink-0 text-fg-subtle transition-transform yj-duration-fast ease-standard rtl:-scale-x-100', open && 'rotate-90 rtl:-rotate-90')}
    />
  )

  return (
    <li>
      {folder.index ? (
        <div className="relative flex items-center">
          <PageRow item={folder.index} nameId={`${id}-name`} className="tree-folder-link pe-9 touch:pe-12" />
          <button
            type="button"
            id={`${id}-toggle`}
            aria-expanded={open}
            aria-controls={`${id}-children`}
            aria-labelledby={`${id}-toggle ${id}-name`}
            onClick={() => setOpen((o) => !o)}
            className="tree-folder-toggle absolute end-1 grid size-7 touch:size-11 place-items-center rounded-md text-fg-subtle transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg focus-ring"
          >
            <span className="sr-only">{open ? 'Collapse' : 'Expand'}</span>
            {chevron}
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-children`}
          onClick={() => setOpen((o) => !o)}
          className={cn(rowClass, 'justify-between text-fg-muted hover:bg-[color-mix(in_oklab,var(--color-accent)_6%,transparent)] hover:text-fg')}
        >
          <span className="flex min-w-0 items-center gap-2">{folder.name}</span>
          {chevron}
        </button>
      )}
      <Collapse id={`${id}-children`} open={open}>
        <ul className="relative ms-3.5 mt-0.5 mb-1 flex flex-col gap-px ps-2">
          <TreeNodes nodes={folder.children} />
        </ul>
      </Collapse>
    </li>
  )
}

function TreeNodes({ nodes }: { nodes: PageTree.Node[] }) {
  return nodes.map((node, i) => {
    if (node.type === 'page') {
      return (
        <li key={node.$id ?? node.url}>
          <PageRow item={node} />
        </li>
      )
    }
    if (node.type === 'folder') return <FolderNode key={node.$id ?? i} folder={node} />
    return (
      <li key={node.$id ?? i} className="tree-label">
        {node.name}
      </li>
    )
  })
}

const length: Record<number, string> = { 2: 'w-3.5', 3: 'w-2.5', 4: 'w-1.5' }

/** The same timeline as On this page's, beside the tree: a tick level with every page, short for a page in a group (section headers carry an icon and groups their arrow in the rail instead); the current page's is the accent. */
function TreeTimeline({ at }: { at: string }) {
  const rail = useRef<HTMLDivElement>(null)
  const [ticks, setTicks] = useState<{ top: number; depth: number; active: boolean }[]>([])

  useLayoutEffect(() => {
    const el = rail.current?.parentElement
    if (!el) return
    const measure = () => {
      const base = el.getBoundingClientRect().top
      // Ticks mark pages only: a section header carries its icon, a group its arrow in the rail, and a label inside a group is a plain heading.
      const rows = el.querySelectorAll<HTMLElement>('a.tree-link:not(.tree-folder-link)')
      setTicks(
        Array.from(rows).flatMap((row) => {
          if (row.closest('[inert]')) return []
          const r = row.getBoundingClientRect()
          if (r.height === 0) return []
          const depth = row.classList.contains('tree-label') ? 2 : row.parentElement?.closest('[id$="-children"]') ? 4 : 3
          return [{ top: Math.round(r.top - base + r.height / 2), depth, active: row.hasAttribute('data-active') }]
        }),
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [at])

  const current = ticks.find((t) => t.active)

  return (
    <div ref={rail} aria-hidden className="pointer-events-none absolute inset-y-0 start-2.5 w-3.5">
      {ticks.map((t, i) => (
        <span
          key={i}
          className={cn('absolute h-px', t.depth === 4 ? '-end-2.5' : 'end-0', length[t.depth] ?? 'w-1.5', t.depth === 2 ? 'h-0.5 -translate-y-px bg-fg-subtle' : 'bg-line-strong')}
          style={{ top: t.top }}
        />
      ))}
      {current && (
        <span
          className={cn('docs-timeline-marker absolute top-0 h-0.5 rounded-full bg-accent', current.depth === 4 ? '-end-2.5' : 'end-0', length[current.depth] ?? 'w-1.5')}
          style={{ translate: `0 ${current.top - 1}px` }}
        />
      )}
    </div>
  )
}

/** Each section's mark in its header, where a row would have its tick. */
const SECTION_ICON: Record<string, typeof RocketIcon> = {
  'Get started': RocketIcon,
  Guides: CompassIcon,
  Components: PuzzleIcon,
  Blocks: LayoutGridIcon,
  Visuals: ShapesIcon,
  Motion: WindIcon,
  Sound: AudioLinesIcon,
}

/** A labeled section of the tree: its header folds the section away on the same Collapse a group uses. */
function Section({ label, labelId, children }: { label: ReactNode; labelId: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  const Icon = typeof label === 'string' ? SECTION_ICON[label] : undefined
  return (
    <div role="group" aria-labelledby={labelId}>
      <button
        type="button"
        id={labelId}
        aria-expanded={open}
        aria-controls={`${labelId}-rows`}
        onClick={() => setOpen((o) => !o)}
        className="tree-section group font-semibold text-fg focus-ring"
      >
        {Icon && <Icon size={14} strokeWidth={1.75} trigger="hover" aria-hidden className="tree-section-icon shrink-0 text-fg-subtle group-hover:text-fg" />}
        <span className="min-w-0 flex-1 text-start">{label}</span>
        <ChevronRightIcon
          size={12}
          strokeWidth={1.75}
          trigger="none"
          aria-hidden
          className={cn('shrink-0 text-fg-subtle opacity-0 transition yj-duration-fast ease-standard group-hover:opacity-100 group-focus-visible:opacity-100 rtl:-scale-x-100', open && 'rotate-90 rtl:-rotate-90', !open && 'opacity-100')}
        />
      </button>
      <Collapse id={`${labelId}-rows`} open={open}>
        {/* A step in from the header, so the rows' ticks and arrows sit inside its icon rather than under it. */}
        <ul className="tree-section-rows flex flex-col gap-px">{children}</ul>
      </Collapse>
    </div>
  )
}

export function PageTreeNav({
  tree,
  keyId = 'docs-tree-key',
  onNavigate,
  className,
  label = 'Docs',
  timeline = false,
}: {
  tree: PageTree.Root
  /** Distinct per mounted tree, so two trees never trade the key. */
  keyId?: string
  /** Called when a link is followed, e.g. to close a drawer. */
  onNavigate?: () => void
  className?: string
  label?: string
  /** Draws the timeline beside the tree (the desktop sidebar). */
  timeline?: boolean
}) {
  const id = useId()
  const pathname = usePathname()
  const [pending, setPending] = useState<string>()
  useEffect(() => setPending(undefined), [pathname])
  return (
    <TreeContext.Provider value={{ keyId, onNavigate, pending, setPending }}>
      {/* One stacking context for the whole tree, so the gliding key passes under every row's text. */}
      <nav aria-label={label} data-timeline={timeline || undefined} className={cn('relative isolate flex flex-col gap-6', timeline && 'ps-6', className)}>
        {timeline && <TreeTimeline at={pending ?? pathname} />}
        {treeSections(tree).map((section) =>
          section.label ? (
            <Section key={section.id} label={section.label} labelId={`${id}-${section.id}`}>
              <TreeNodes nodes={section.nodes} />
            </Section>
          ) : (
            <ul key={section.id} className="flex flex-col gap-px">
              <TreeNodes nodes={section.nodes} />
            </ul>
          ),
        )}
      </nav>
    </TreeContext.Provider>
  )
}
