import type { ComponentType, ReactNode } from 'react'
import type { IconProps } from '@youj/icons'

/* The navigation every frame part reads: sections of items, items with an
 * icon, a count or tag, and nested pages. Sidebars draw it, top bars name the
 * current page from it, the phone tab bar and the ⌘K palette list it. */

/** An icon component: any of Youj's icons (they animate on hover), or your own. */
export type FrameIcon = ComponentType<IconProps>

export interface FrameNavItem {
  id: string
  label: string
  /** Where it goes. Default `#<id>`, handled in place by the frame. */
  href?: string
  icon?: FrameIcon
  /** A count (unread, open) or a short tag ("New"). */
  badge?: number | string
  /** How the badge is read after the name, e.g. "4 unread". Default: the badge itself. */
  badgeLabel?: string
  /** `danger` makes a count loud: something failed or is overdue. */
  badgeTone?: 'danger'
  /** Nested pages: an item with them is a group, not a page. Classic and Workspace list one level under the item; the panel's and the explorer's trees go to any depth. */
  items?: FrameNavItem[]
}

export interface FrameNavSection {
  id: string
  /** The group's heading, and the rail's name for it in Rail + panel. */
  label?: string
  /** Rail + panel shows each section as an icon on its rail. */
  icon?: FrameIcon
  /** The heading folds the section away (Favorites, a team's space). It opens again on its own when its page becomes the current one. */
  collapsible?: boolean
  items: FrameNavItem[]
}

/** What every frame sidebar takes, so any header and footer fit any sidebar. */
export interface FrameSidebarSlots {
  /** The top: FrameLogo or FrameWorkspace. */
  header?: ReactNode
  /** The bottom: FrameAccountCard, FrameUpgradeCard, or both. */
  footer?: ReactNode
  className?: string
}

/** What every frame top bar takes, so any search and account fit any top bar. */
export interface FrameTopbarSlots {
  /** FrameSearchField or FrameSearchPalette. */
  search?: ReactNode
  /** Buttons before the account: FrameNotifications, a primary action. */
  actions?: ReactNode
  /** FrameAccountMenu or FrameAccountStatus. */
  account?: ReactNode
  className?: string
}

/** The signed-in person, for the account parts. */
export interface FrameUser {
  name: string
  email: string
  /** Image URL. The initials show until it loads, and if it fails. */
  avatar?: string
}

/** A workspace (team, org) the person can switch to. */
export interface FrameTeam {
  id: string
  name: string
  /** Image URL for the logo. */
  logo?: string
  /** A short line under the name: the plan, the member count. */
  detail?: string
}

/** Where a page sits: its section, its top-level item, and the nested page when it is one. */
export interface FrameTrail {
  section: FrameNavSection
  item: FrameNavItem
  /** The page, when it's nested under `item` (at any depth). */
  child?: FrameNavItem
  /** The groups between `item` and `child`, outermost first, when the page is nested more than one level down. */
  parents?: FrameNavItem[]
}

/** The items from `items` down to the one with `id`, both ends included, or undefined. */
function pathTo(items: readonly FrameNavItem[] | undefined, id: string): FrameNavItem[] | undefined {
  for (const item of items ?? []) {
    if (item.id === id) return [item]
    const deeper = pathTo(item.items, id)
    if (deeper) return [item, ...deeper]
  }
  return undefined
}

export function findTrail(nav: readonly FrameNavSection[], id: string | undefined): FrameTrail | undefined {
  if (!id) return undefined
  for (const section of nav) {
    for (const item of section.items) {
      if (item.id === id) return { section, item }
      const path = pathTo(item.items, id)
      if (!path) continue
      const parents = path.slice(0, -1)
      return parents.length ? { section, item, child: path.at(-1), parents } : { section, item, child: path[0] }
    }
  }
  return undefined
}

/** The first page in the nav: where a frame starts when nothing is active. */
export function firstPage(nav: readonly FrameNavSection[]): string | undefined {
  return nav[0]?.items[0]?.id
}

/** A group's first page, at any depth: where its name in a breadcrumb leads. */
export function firstPageIn(item: FrameNavItem): FrameNavItem {
  const first = item.items?.[0]
  return first ? firstPageIn(first) : item
}

/** A page of the nav and where it sits: its section, and the groups it's nested in, outermost first. */
export interface FrameNavPage {
  item: FrameNavItem
  section: FrameNavSection
  parents: FrameNavItem[]
}

/** Every page in nav order, at any depth: a group (an item with nested pages) isn't a page itself, its pages are. */
export function navPages(nav: readonly FrameNavSection[]): FrameNavPage[] {
  const pages: FrameNavPage[] = []
  const walk = (items: readonly FrameNavItem[], section: FrameNavSection, parents: FrameNavItem[]) => {
    for (const item of items) {
      if (item.items?.length) walk(item.items, section, [...parents, item])
      else pages.push({ item, section, parents })
    }
  }
  for (const section of nav) walk(section.items, section, [])
  return pages
}

export function hrefOf(item: FrameNavItem): string {
  return item.href ?? `#${item.id}`
}

/** How an item's badge reads after its name: its `badgeLabel`, else the badge itself. */
export function badgeText(item: FrameNavItem): string {
  return item.badgeLabel ?? String(item.badge ?? '')
}
