'use client'

import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { useLabels } from '@youj/core'
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '../../components/ui/sidebar'
import { cn } from '../../lib/utils'
import { badgeText, FrameSectionLabel, navPages, useFrame, type FrameNavItem, type FrameSidebarSlots } from './shell'
import { FrameNavIcon } from './shell/nav-icon'
import { ROW_INK, ROW_MOTION } from './shell/signature'
import { branchesOf, filterNav, shownRow } from './shell/filter'
import { FrameFilterField } from './shell/filter-field'
import { FrameNavList } from './shell/nav-list'
import { FrameSidebarBase } from './shell/sidebar-base'
import { FrameTree } from './shell/tree'

/* The glass explorer, for data tools, file systems and knowledge bases: the
 * kit Sidebar's `surface="glass"` over a backdrop of the theme's own inks,
 * with the page beside it as a frosted card. Two columns in the glass:
 * - The nav: the sections under small labels, each top-level page a row,
 *   the current one on a quiet fill. A page with pages of its own opens them
 *   in the explorer rather than unfolding in place.
 * - The explorer: that page's name over a filter and its pages as a tree to
 *   any depth, on guide lines, counts as pills, the current page on the same
 *   fill. It is an ARIA tree: one Tab stop, ↑ ↓, → opens or steps in, ← closes
 *   or steps out, Home, End, type-ahead and * to open the branches beside you.
 *   Typing in the filter narrows the tree and opens every branch with a match.
 * - It slides away off-canvas (⌘B, the trigger, its edge), out of the
 *   keyboard's reach, focus handed to the top bar's trigger. On phones it's a
 *   glass sheet with nested pages under their parent.
 * `backdrop={false}` keeps your own background behind the glass. */

interface FrameSidebarGlassProps extends FrameSidebarSlots {
  /** The top-level page (one with nested pages) the explorer opens on. Default: the current page's, else the first. */
  defaultExplorer?: string
  /** The explorer's filter field. Default true. */
  search?: boolean
  /** Paint the frame's backdrop from the theme's inks, so the glass has something to frost. Default true. */
  backdrop?: boolean
}

/** The backdrop: the theme's accent and chart inks washed into a dusk gradient, on the frame's paper. */
const BACKDROP =
  '[:has(>[data-slot=sidebar]>&)>[data-slot=app-frame-paper]]:bg-[radial-gradient(90%_70%_at_100%_0%,color-mix(in_oklab,var(--color-chart-2)_35%,transparent),transparent_70%),linear-gradient(165deg,color-mix(in_oklab,var(--color-accent)_40%,var(--color-canvas)),color-mix(in_oklab,var(--color-chart-4)_28%,var(--color-canvas)))]'

/** The page is a frosted card too. */
const GLASS_PAGE = '[:has(>[data-slot=sidebar]>&)>main]:yj-glass [:has(>[data-slot=sidebar]>&)>main]:[--yj-glass:72%]'

/**
 * Off-canvas is out of reach: inert while collapsed (the slide only moves it
 * out of view), and focus that was inside goes to the frame's sidebar
 * trigger, where the keyboard can bring it back.
 */
function useOffCanvas() {
  const { state, isMobile } = useSidebar()
  const away = state === 'collapsed' && !isMobile
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const container = ref.current
    if (!away || !container?.contains(document.activeElement)) return
    // container → the Sidebar → the frame, whose top bar holds the trigger.
    container.parentElement?.parentElement?.querySelector<HTMLElement>('[data-sidebar=trigger]')?.focus()
  }, [away])
  return { ref, inert: away || undefined }
}

function Explorer({ item, search }: { item: FrameNavItem; search: boolean }) {
  const { active, navigate } = useFrame()
  const labels = useLabels()
  const idBase = useId()
  const tree = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const nav = [{ id: item.id, label: item.label, items: item.items ?? [] }]
  const [open, setOpen] = useState(() => new Set(branchesOf(nav, active)))
  const [seenActive, setSeenActive] = useState(active)
  if (seenActive !== active) {
    setSeenActive(active)
    const holding = branchesOf(nav, active)
    if (holding.some((id) => !open.has(id))) setOpen(new Set([...open, ...holding]))
  }
  const filtering = query.trim() !== ''
  const shown = filterNav(nav, query)
  const isOpen = (id: string) => filtering || open.has(id)
  const onOpenChange = (ids: string[], next: boolean) => {
    if (filtering) return
    const set = new Set(open)
    for (const id of ids) {
      if (next) set.add(id)
      else set.delete(id)
    }
    setOpen(set)
  }
  const found = navPages(shown).map((p) => p.item)
  return (
    <section aria-labelledby={`${idBase}-title`} className="flex min-h-0 w-(--explorer) shrink-0 flex-col border-s border-line">
      <SidebarHeader className="gap-3 pb-1">
        <h2 id={`${idBase}-title`} className="flex h-control items-center truncate px-2 text-ui-lg font-semibold tracking-tight text-fg">
          {item.label}
        </h2>
        {search && (
          <FrameFilterField
            query={query}
            onQuery={setQuery}
            onSubmit={() => found[0] && navigate(found[0].id)}
            onEnterList={() => tree.current?.querySelector<HTMLElement>('[data-yj-tree-item][tabindex="0"]')?.focus()}
          />
        )}
      </SidebarHeader>
      <p role="status" className="sr-only">
        {filtering ? (found.length ? labels.pagesFound(found.length) : labels.pagesNoMatch(query.trim())) : ''}
      </p>
      <SidebarContent indicator="none">
        <div ref={tree} className="p-2">
          {filtering && !found.length ? (
            <p className="px-2 py-6 text-center text-ui text-fg-muted">{labels.pagesNoMatch(query.trim())}</p>
          ) : (
            <FrameTree nav={shown} query={query} isOpen={isOpen} onOpenChange={onOpenChange} here={shownRow(shown, active, isOpen)} idBase={idBase} current="fill" headings={false} />
          )}
        </div>
      </SidebarContent>
    </section>
  )
}

function FrameSidebarGlass({ header, footer, defaultExplorer, search = true, backdrop = true, className }: FrameSidebarGlassProps) {
  const { nav, trail } = useFrame()
  const { isMobile } = useSidebar()
  const labels = useLabels()
  const offCanvas = useOffCanvas()
  const groups = nav.flatMap((s) => s.items).filter((item) => item.items?.length)
  const [explorer, setExplorer] = useState(() => (trail?.child ? trail.item.id : undefined) ?? defaultExplorer ?? groups[0]?.id)
  // A page reached in another group (the palette, a tab) brings that group's explorer.
  const holder = trail?.child ? trail.item.id : undefined
  const [seenHolder, setSeenHolder] = useState(holder)
  if (seenHolder !== holder) {
    setSeenHolder(holder)
    if (holder) setExplorer(holder)
  }
  const shown = groups.find((g) => g.id === explorer) ?? groups[0]
  const wide = Boolean(shown) && !isMobile
  return (
    <FrameSidebarBase
      collapsible="offcanvas"
      variant="inset"
      surface="glass"
      paper="none"
      data-frame-sidebar="glass"
      {...offCanvas}
      style={{ '--sidebar-width': wide ? 'calc(var(--spacing) * 128)' : 'calc(var(--spacing) * 64)', '--explorer': 'calc(var(--spacing) * 64)' } as CSSProperties}
      className={cn(
        // The glass is the panel itself: a rounded card inset on the backdrop.
        '*:data-[slot=sidebar-inner]:rounded-surface *:data-[slot=sidebar-inner]:shadow-sm *:data-[slot=sidebar-inner]:ring-1 *:data-[slot=sidebar-inner]:ring-line',
        backdrop && BACKDROP,
        GLASS_PAGE,
        className,
      )}
    >
      <div className="flex size-full min-h-0">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {header && <SidebarHeader className="pb-0">{header}</SidebarHeader>}
          <SidebarContent indicator="fill">
            {wide ? (
              <nav aria-label={labels.pages} className="flex min-w-0 flex-col">
                {nav.map((section) => (
                  <SidebarGroup key={section.id}>
                    {section.label && <FrameSectionLabel>{section.label}</FrameSectionLabel>}
                    <GlassRows items={section.items} explorer={shown?.id} onExplore={setExplorer} />
                  </SidebarGroup>
                ))}
              </nav>
            ) : (
              <FrameNavList />
            )}
          </SidebarContent>
          {footer && <SidebarFooter>{footer}</SidebarFooter>}
        </div>
        {wide && shown && <Explorer key={shown.id} item={shown} search={search} />}
      </div>
      <SidebarRail />
    </FrameSidebarBase>
  )
}

/** The nav column's rows: pages link; a group shows its pages in the explorer, pressed while it's shown there. */
function GlassRows({ items, explorer, onExplore }: { items: FrameNavItem[]; explorer: string | undefined; onExplore: (id: string) => void }) {
  const { active, trail, link, Link } = useFrame()
  return (
    <SidebarMenu>
      {items.map((item) => {
        const group = Boolean(item.items?.length)
        const current = group ? trail?.item.id === item.id : active === item.id
        const badge = item.badge !== undefined
        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              isActive={current}
              data-yj-trigger=""
              {...(group ? { 'aria-pressed': explorer === item.id, onClick: () => onExplore(item.id) } : { render: <Link {...link(item)} /> })}
              className={cn('h-control gap-2.5 aria-pressed:text-fg', ROW_INK, ROW_MOTION, badge && 'pe-10')}
            >
              {item.icon && <FrameNavIcon icon={item.icon} current={current} />}
              <span>{item.label}</span>
              {badge && <span className="sr-only">, {badgeText(item)}</span>}
            </SidebarMenuButton>
            {badge && (
              <SidebarMenuBadge aria-hidden tone={item.badgeTone}>
                {item.badge}
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}


export { FrameSidebarGlass }
export type { FrameSidebarGlassProps }
