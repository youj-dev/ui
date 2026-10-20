'use client'

import { useId, useRef, useState, type ReactNode } from 'react'
import { useLabels } from '@youj/core'
import { Collapsible, CollapsibleChevron, CollapsibleContent } from '../../../components/ui/collapsible'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from '../../../components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '../../../components/ui/sidebar'
import { cn } from '../../../lib/utils'
import { useFrame } from './context'
import { badgeText, type FrameNavItem, type FrameNavSection } from './model'
import { FrameNavIcon } from './nav-icon'
import { FrameSectionLabel, SECTION_LABEL } from './section-label'
import { BREATH, ROW_INK, ROW_MOTION } from './signature'

/* The frame's standard list of pages, shared by Classic and Workspace (and
 * the phone's sheet of the rails): the sections under the theme's eyebrow,
 * each page an icon, a name and its count, a page with nested pages a
 * disclosure, a section marked `collapsible` a heading that folds it away.
 * Names rest in muted ink and icons a step quieter; pointing at a row lifts
 * it to ink on a wash that comes at once and goes slowly, and plays its icon.
 * The current page is set in ink, its icon in the accent (played once as it
 * becomes current), and the content's key glides to it (and waits on a
 * closed group that holds the page). Counts sit on one column at the row's
 * end. Down to icons, each icon shows its name in a tooltip, every folded
 * section opens so its pages stay in reach, and a group's icon opens its
 * pages in a menu to the side rather than unfolding the sidebar. */

/** What a sidebar adds to the shared list. */
export interface FrameNavListOptions {
  /** Counts as plain numbers (default) or pills on a well. */
  counts?: 'plain' | 'pill'
  /** A page without an icon wears a dot in one of the theme's chart colors (a region, a team). */
  dots?: boolean
  /** More state after a page's name (faces, a running dot, a key): drawn before its count, hidden from assistive tech. */
  extra?: (item: FrameNavItem) => ReactNode
  /** What that state says, read after the name and the count. */
  said?: (item: FrameNavItem) => string | undefined
  /** A page's keyboard shortcut, as `aria-keyshortcuts` ("G I"). */
  shortcut?: (item: FrameNavItem) => string | undefined
}

/** Sized from the control token, so density themes scale the list; collapsed, a square of the same size. */
const itemSize = 'h-control gap-2.5 group-data-[collapsible=icon]:size-control!'

/** A nested page: muted, in ink when pointed at or current. */
const subInk = cn('text-fg-muted hover:text-fg data-active:text-fg', ROW_MOTION)

/** The dots' colors, in nav order: spelled out so Tailwind finds them. */
const DOTS = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']

/** A tag ("New") reads as a small accent label; a count is the number. */
function Tag({ value }: { value: number | string }) {
  if (typeof value === 'number') return value
  return <span className="text-accent-text">{value}</span>
}

const spoken = (item: FrameNavItem, options: FrameNavListOptions) =>
  [item.badge !== undefined && badgeText(item), options.said?.(item)].filter(Boolean).join(', ')

/** A count or tag after a nested page's name, read after it by assistive tech. */
function Trailing({ item, options }: { item: FrameNavItem; options: FrameNavListOptions }) {
  const said = spoken(item, options)
  const extra = options.extra?.(item)
  if (!said && !extra) return null
  return (
    <span className="ms-auto flex items-center gap-2">
      {said && <span className="sr-only">, {said}</span>}
      {extra && <span aria-hidden>{extra}</span>}
      {item.badge !== undefined && (
        <span aria-hidden className="text-ui-sm text-fg-subtle tabular-nums">
          <Tag value={item.badge} />
        </span>
      )}
    </span>
  )
}

function Glyph({ item, current, index, options }: { item: FrameNavItem; current: boolean; index: number; options: FrameNavListOptions }) {
  if (item.icon) return <FrameNavIcon icon={item.icon} current={current} />
  if (!options.dots) return null
  return (
    <span aria-hidden className="grid size-4 shrink-0 place-items-center">
      <span className={cn('size-2 rounded-full', DOTS[index % DOTS.length])} />
    </span>
  )
}

function NavItem({ item, index, options }: { item: FrameNavItem; index: number; options: FrameNavListOptions }) {
  const { active, link, Link } = useFrame()
  const current = active === item.id
  const badge = item.badge !== undefined
  const extra = options.extra?.(item)
  const said = spoken(item, options)
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={current}
        tooltip={item.label}
        data-yj-trigger=""
        aria-keyshortcuts={options.shortcut?.(item)}
        render={<Link {...link(item)} />}
        className={cn(itemSize, ROW_INK, ROW_MOTION, badge && 'pe-10')}
      >
        <Glyph item={item} current={current} index={index} options={options} />
        <span>{item.label}</span>
        {said && <span className="sr-only">, {said}</span>}
        {extra && (
          <span aria-hidden className="ms-auto flex shrink-0 items-center gap-2 overflow-visible!">
            {extra}
          </span>
        )}
      </SidebarMenuButton>
      {badge && (
        <SidebarMenuBadge aria-hidden variant={options.counts} tone={item.badgeTone}>
          <Tag value={item.badge!} />
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  )
}

/**
 * A page with nested pages. One button in both states, so ⌘B never drops its
 * focus: expanded it's a disclosure over its pages; down to icons, where they
 * have no room, it opens them in a menu to its side.
 */
function NavGroup({ item, options }: { item: FrameNavItem; options: FrameNavListOptions }) {
  const { active, trail, link, Link } = useFrame()
  const { state, isMobile } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile
  const holdsPage = trail?.item.id === item.id
  const [open, setOpen] = useState(holdsPage)
  const [menu, setMenu] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const listId = useId()
  // Arriving at one of its pages from elsewhere (the palette, a tab) opens the group.
  const [seenHolds, setSeenHolds] = useState(holdsPage)
  if (seenHolds !== holdsPage) {
    setSeenHolds(holdsPage)
    if (holdsPage) setOpen(true)
  }
  // The menu belongs to the icons: unfolding the sidebar closes it.
  const [seenCollapsed, setSeenCollapsed] = useState(collapsed)
  if (seenCollapsed !== collapsed) {
    setSeenCollapsed(collapsed)
    if (!collapsed) setMenu(false)
  }
  // Folded, or closed over its page, the group stands in for the page: the key sits on it, and its icon and name take the page's ink.
  const standsIn = holdsPage && (collapsed || !open)
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        ref={button}
        tooltip={item.label}
        data-yj-trigger=""
        aria-haspopup={collapsed ? 'menu' : undefined}
        aria-expanded={collapsed ? menu : open}
        aria-controls={collapsed ? undefined : listId}
        onClick={() => (collapsed ? setMenu(true) : setOpen(!open))}
        className={cn(itemSize, ROW_INK, ROW_MOTION, standsIn && 'text-fg [&>svg:first-child]:text-accent-text')}
      >
        {item.icon && <FrameNavIcon icon={item.icon} current={holdsPage} />}
        <span>{item.label}</span>
        <CollapsibleChevron size={14} className="ms-auto me-0.5 text-fg-subtle" />
      </SidebarMenuButton>
      {/* Kept mounted, so the key can find the page's group while it's closed. */}
      <Collapsible open={open}>
        <CollapsibleContent id={listId} keepMounted>
          <SidebarMenuSub>
            {item.items!.map((child) => (
              <SidebarMenuSubItem key={child.id}>
                <SidebarMenuSubButton
                  isActive={active === child.id}
                  aria-keyshortcuts={options.shortcut?.(child)}
                  className={cn('h-control-sm', subInk)}
                  render={<Link />}
                  {...link(child)}
                >
                  {child.icon && <FrameNavIcon icon={child.icon} current={active === child.id} />}
                  <span>{child.label}</span>
                  <Trailing item={child} options={options} />
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
      <DropdownMenu open={menu && collapsed} onOpenChange={setMenu}>
        {/* Clear of the icon column and its tooltip's offset, aligned with the icon's top. */}
        <DropdownMenuContent anchor={button} side="inline-end" align="start" sideOffset={14} className="min-w-48">
          <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
          {item.items!.map((child) => (
            <DropdownMenuItem key={child.id} render={<Link {...link(child)} />} className={cn(active === child.id && 'font-medium text-fg')}>
              <span className="min-w-0 flex-1 truncate">{child.label}</span>
              {child.badge !== undefined && (
                <>
                  <span className="sr-only">, {badgeText(child)}</span>
                  <span aria-hidden className="text-ui-sm text-fg-muted tabular-nums">
                    <Tag value={child.badge} />
                  </span>
                </>
              )}
              {/* In a menu, with no key to slide, the current page wears the square of accent. */}
              {active === child.id && <span aria-hidden className="size-1.5 shrink-0 rounded-[1px] bg-accent" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

export function FrameNavItems({ items, options = {} }: { items: FrameNavItem[]; options?: FrameNavListOptions }) {
  return (
    <SidebarMenu>
      {items.map((item, i) => (item.items?.length ? <NavGroup key={item.id} item={item} options={options} /> : <NavItem key={item.id} item={item} index={i} options={options} />))}
    </SidebarMenu>
  )
}

const sum = (items: readonly FrameNavItem[]) => items.reduce((n, item) => n + (typeof item.badge === 'number' ? item.badge : 0), 0)

/** A section whose heading folds it away; it opens by itself when the page it holds becomes the current one, and while the sidebar is down to icons. */
function FoldingSection({ section, options }: { section: FrameNavSection; options: FrameNavListOptions }) {
  const { trail } = useFrame()
  const { state, isMobile } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile
  const holds = trail?.section.id === section.id
  const [open, setOpen] = useState(true)
  const [seenHolds, setSeenHolds] = useState(holds)
  if (seenHolds !== holds) {
    setSeenHolds(holds)
    if (holds) setOpen(true)
  }
  const listId = useId()
  const total = sum(section.items)
  const shown = open || collapsed
  // Folded over the current page, the heading stands in for it: the key sits on it (it comes before the hidden rows).
  const standsIn = holds && !shown
  return (
    <SidebarGroup data-yj-section={section.id}>
      <button
        type="button"
        data-slot="sidebar-group-label"
        data-sidebar={standsIn ? 'menu-button' : 'group-label'}
        data-active={standsIn || undefined}
        aria-expanded={shown}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        className={cn(SECTION_LABEL, 'w-full rounded-md text-start hover:bg-hover hover:text-fg focus-ring data-active:text-fg data-active:hover:bg-transparent', BREATH)}
      >
        <span className="min-w-0 flex-1 truncate">{section.label}</span>
        {!shown && total > 0 && <span className="text-ui-xs text-fg-subtle tabular-nums">{total}</span>}
        <CollapsibleChevron size={14} className="me-0.5 text-fg-subtle" />
      </button>
      {/* Kept mounted, so the key can find a page in it while it's closed. */}
      <Collapsible open={shown}>
        <CollapsibleContent id={listId} keepMounted>
          <SidebarGroupContent>
            <FrameNavItems items={section.items} options={options} />
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  )
}

/** The frame's sections as the list, in a `nav` landmark of its own so assistive tech can jump to the pages. */
export function FrameNavList({ nav: navProp, options = {}, className }: { nav?: FrameNavSection[]; options?: FrameNavListOptions; className?: string }) {
  const frame = useFrame()
  const nav = navProp ?? frame.nav
  const labels = useLabels()
  return (
    <nav aria-label={labels.pages} className={cn('flex min-w-0 flex-col', className)}>
      {nav.map((section) =>
        section.collapsible && section.label ? (
          <FoldingSection key={section.id} section={section} options={options} />
        ) : (
          <SidebarGroup key={section.id}>
            {section.label && <FrameSectionLabel>{section.label}</FrameSectionLabel>}
            <SidebarGroupContent>
              <FrameNavItems items={section.items} options={options} />
            </SidebarGroupContent>
          </SidebarGroup>
        ),
      )}
    </nav>
  )
}
