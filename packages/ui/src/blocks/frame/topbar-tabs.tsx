'use client'

import { useLayoutEffect, useRef, useState, type MouseEvent, type RefObject } from 'react'
import { useYouj, useLabels } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { AppHeader, AppHeaderActions } from '../../components/ui/app-header'
import { Separator } from '../../components/ui/separator'
import { SidebarTrigger } from '../../components/ui/sidebar'
import { cn } from '../../lib/utils'
import { useFrame, type FrameTopbarSlots } from './shell'

/* A top bar for pages with views, like a project header: the sidebar's
 * trigger, the page's name, then search, actions and the account; under it
 * the page's views as links. The current view is marked by an underline that
 * glides to it (and a hover pill that follows the pointer and keyboard
 * focus); on phones the views scroll sideways, fading at the edge that has
 * more. Both rows stick, so every control stays in reach wherever you are in
 * the page; once content scrolls under, the bar turns into a blurred surface
 * and its first row tightens by 8px, as every frame bar does. Reduced
 * motion: the underline jumps and the bar condenses at once. It names the
 * page, so the frame folds the page's own title (shell.tsx). */

interface FrameView {
  id: string
  label: string
  /** A count after the label: open issues, unread. */
  count?: number
  /** Where it goes, when views are routes of their own. Default: it switches in place (`#view-<id>`). */
  href?: string
}

interface FrameTopbarTabsProps extends FrameTopbarSlots {
  /** The page's views. Default: Overview, Activity, Issues, Insights and Settings. */
  views?: FrameView[]
  /** The current view's id, when you keep it (in the URL, say). */
  view?: string
  /** The view a page starts on. Default: the first. */
  defaultView?: string
  /** A view was chosen. Views with an `href` are links: call `event.preventDefault()` to route yourself. */
  onViewChange?: (id: string, event: MouseEvent<HTMLAnchorElement>) => void
}

/** Sample views: replace them with your page's own. */
const VIEWS: FrameView[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'issues', label: 'Issues', count: 24 },
  { id: 'insights', label: 'Insights' },
  { id: 'settings', label: 'Settings' },
]

/** How far the edges fade, and the room kept around a view scrolled into sight. */
const FADE = 24

/** A sideways scroller's fade: each edge fades by how far there is to scroll on that side. `items` keys its children. */
function useEdgeMask(ref: RefObject<HTMLElement | null>, items: string) {
  const [edges, setEdges] = useState({ left: 0, right: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // RTL scrollers count scrollLeft down from 0 to -max.
    const rtl = getComputedStyle(el).direction === 'rtl'
    let frame = 0
    const measure = () => {
      frame = 0
      const max = Math.max(el.scrollWidth - el.clientWidth, 0)
      const fromStart = Math.min(Math.abs(el.scrollLeft), max)
      const left = rtl ? max - fromStart : fromStart
      setEdges((prev) => (Math.abs(prev.left - left) < 1 && Math.abs(prev.right - (max - left)) < 1 ? prev : { left, right: max - left }))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    el.addEventListener('scroll', schedule, { passive: true })
    // The links too: a font landing widens them without resizing the scroller.
    const observer = new ResizeObserver(schedule)
    for (const node of [el, ...Array.from(el.children)]) observer.observe(node)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', schedule)
      observer.disconnect()
    }
  }, [ref, items])
  if (edges.left < 1 && edges.right < 1) return undefined
  const mask = `linear-gradient(to right, transparent, black ${Math.min(edges.left, FADE)}px, black calc(100% - ${Math.min(edges.right, FADE)}px), transparent)`
  return { maskImage: mask, WebkitMaskImage: mask }
}

function FrameTopbarTabs({
  search,
  actions,
  account,
  className,
  views = VIEWS,
  view: viewProp,
  defaultView,
  onViewChange,
}: FrameTopbarTabsProps) {
  const { trail, active, mobileNav } = useFrame()
  const labels = useLabels()
  const k = useYouj()
  const first = defaultView ?? views[0]?.id
  // Each page starts on its first view (unless you keep the view yourself).
  const [own, setOwn] = useState({ page: active, view: first })
  if (own.page !== active) setOwn({ page: active, view: first })
  const current = viewProp ?? own.view

  const nav = useRef<HTMLElement>(null)
  const mask = useEdgeMask(nav, views.map((v) => v.id).join())
  const moved = useRef(false)
  // Keep the current view in sight on a phone's scroller: at once on the first
  // pass, smoothly after. The scroller moves itself, never the page.
  useLayoutEffect(() => {
    const first = !moved.current
    moved.current = true
    const list = nav.current
    const link = list?.querySelector<HTMLElement>('[aria-current=page]')
    if (!list || !link || list.scrollWidth <= list.clientWidth) return
    const l = list.getBoundingClientRect()
    const t = link.getBoundingClientRect()
    const pad = FADE + 8
    const delta = t.left - pad < l.left ? t.left - pad - l.left : t.right + pad > l.right ? t.right + pad - l.right : 0
    if (Math.abs(delta) >= 1) list.scrollBy({ left: delta, behavior: first || k.reduced ? 'auto' : 'smooth' })
  }, [current, k.reduced])

  const select = (next: FrameView, event: MouseEvent<HTMLAnchorElement>) => {
    if (!next.href) event.preventDefault()
    // A real link opened elsewhere (⌘-click, a new window) leaves this page's view as it is.
    else if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (next.id === current) return
    setOwn({ page: active, view: next.id })
    onViewChange?.(next.id, event)
  }

  const page = trail?.child ?? trail?.item
  const Icon = trail?.item.icon
  const hideOnTabs = mobileNav === 'tabs' && 'max-md:hidden'
  return (
    <AppHeader
      data-yj-frame-topbar="tabs"
      data-yj-frame-titled
      className={cn('h-auto flex-col items-stretch gap-0 border-line px-0 data-condensed:h-auto md:gap-0 md:px-0', className)}
    >
      <div
        data-slot="frame-topbar-row"
        className={cn(
          'relative flex h-[calc(var(--spacing-control)+--spacing(6))] items-center gap-3 px-3 md:px-4',
          // Beside an open sidebar on a tablet, the search slims down so the title keeps its room.
          'md:max-lg:[&_[data-frame-search]]:w-40',
          'transition-[height] yj-duration-base ease-standard group-data-condensed/app-header:h-[calc(var(--spacing-control)+--spacing(4))]',
        )}
      >
        <SidebarTrigger className={cn('-ms-1', hideOnTabs)} />
        <Separator orientation="vertical" className={cn('h-4 data-[orientation=vertical]:self-center', hideOnTabs)} />
        {page && (
          <span className="flex min-w-0 items-center gap-2 text-ui-lg font-semibold tracking-tight text-fg">
            {Icon && <Icon size={16} strokeWidth={1.75} className="shrink-0 text-fg-muted" />}
            <span className="truncate">{page.label}</span>
          </span>
        )}
        <AppHeaderActions>
          {search}
          {actions}
          {account}
        </AppHeaderActions>
      </div>
      <nav
        ref={nav}
        aria-label={labels.views}
        data-slot="frame-topbar-views"
        style={mask}
        className="relative isolate -mb-px flex overflow-x-auto px-1.5 [scrollbar-width:none] md:px-2.5 [&::-webkit-scrollbar]:hidden"
      >
        {views.map((v) => (
          <a
            key={v.id}
            href={v.href ?? `#view-${v.id}`}
            aria-current={v.id === current ? 'page' : undefined}
            onClick={(event) => select(v, event)}
            className={cn(
              'group/view relative inline-flex h-control-lg shrink-0 items-center gap-1.5 rounded-xl px-3 text-ui font-medium whitespace-nowrap text-fg-muted select-none',
              'transition-colors yj-duration-fast ease-standard hover:text-fg aria-[current=page]:text-fg',
              // Drawn inside, around the hover pill, so the scroller never clips it.
              'focus-visible:outline-2 focus-visible:-outline-offset-6 focus-visible:outline-focus focus-visible:outline-solid',
            )}
          >
            {v.label}
            {v.count !== undefined && (
              <>
                {' '}
                <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-band px-1.5 text-ui-xs font-medium text-fg-muted tabular-nums transition-colors yj-duration-fast ease-standard group-aria-[current=page]/view:bg-selected group-aria-[current=page]/view:text-fg">
                  {v.count}
                </span>
              </>
            )}
          </a>
        ))}
        <SlidingIndicator follow="hover" className="bg-transparent before:absolute before:inset-1.5 before:rounded-md before:bg-hover" />
        <SlidingIndicator variant="underline" />
      </nav>
    </AppHeader>
  )
}

export { FrameTopbarTabs }
export type { FrameTopbarTabsProps, FrameView }
