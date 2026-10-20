'use client'

import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { useLabels } from '@youj/core'
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from '../../components/ui/sidebar'
import { cn } from '../../lib/utils'
import { navPages, useFrame, type FrameNavItem, type FrameNavSection, type FrameSidebarSlots } from './shell'
import { filterNav } from './shell/filter'
import { FrameFilterField } from './shell/filter-field'
import { INSET_ON_PAPER } from './shell/inset'
import { FrameNavItems, FrameNavList } from './shell/nav-list'
import { FrameSidebarResize, RESIZE_COPY, useFrameSidebarWidth, type FrameSidebarWidthProps } from './shell/resize'
import { FrameSidebarBase } from './shell/sidebar-base'

/* The classic app sidebar, the one most apps start from, close to shadcn's:
 * on the white paper, a filter field under the header, the sections under
 * small labels, each page an icon, a name and its count, nested pages under
 * a disclosure, a section marked `collapsible` (Favorites) folding under its
 * label, and pages for the foot (Settings, Help) above the footer's meter
 * and account. The current page sits on a quiet gray fill that glides from
 * page to page (and waits on a closed group that holds the page).
 * - Typing in the field narrows the list to the pages that match, nested
 *   ones included, and says how many; Enter goes to the first, ↓ moves into
 *   the list, Escape clears, and / reaches the field from anywhere.
 * - Drag its edge to make it wider or narrower (200 to 420px); pull it well
 *   past the narrowest and it folds to icons. From the keyboard the edge is
 *   a separator: ← →, Home, End, and Enter to fold. Keep the width with
 *   `width` and `onWidthChange`.
 * - It folds to icons (⌘B, the trigger, a click on its edge) on the spring:
 *   labels fade out before the width goes and back in after it returns, each
 *   icon shows its name in a tooltip, and a page with nested pages opens them
 *   in a menu to its side.
 * - `variant="inset"` sets the page beside it as a raised card, the top bar
 *   pinned to the card's top so the page scrolls inside it like a window.
 * - On phones it's a sheet, on the same paper. */

interface FrameSidebarClassicProps extends FrameSidebarSlots, FrameSidebarWidthProps {
  /** `inset` sets the page beside the sidebar as a raised card. Default `sidebar`. */
  variant?: 'sidebar' | 'inset'
  /** The filter field under the header. Default true. */
  search?: boolean
  /** Pages at the foot, above the footer: Settings, Help. Give them an `href` to leave the frame. */
  links?: FrameNavItem[]
  /** The edge's strings for assistive tech, to rewrite or translate. */
  copy?: Partial<FrameSidebarClassicCopy>
}

const DEFAULT_COPY = { ...RESIZE_COPY }
type FrameSidebarClassicCopy = typeof DEFAULT_COPY

/** The pages that match, flat under their sections, each with its group's icon when it has none of its own. */
function results(nav: FrameNavSection[], query: string): FrameNavSection[] {
  return filterNav(nav, query).map((section) => ({
    id: section.id,
    label: section.label,
    items: navPages([section]).map(({ item, parents }) => ({ ...item, icon: item.icon ?? parents.find((p) => p.icon)?.icon })),
  }))
}

function FrameSidebarClassic({
  header,
  footer,
  variant = 'sidebar',
  search = true,
  links,
  width,
  defaultWidth,
  onWidthChange,
  copy,
  className,
}: FrameSidebarClassicProps) {
  const resize = useFrameSidebarWidth({ width, defaultWidth, onWidthChange })
  const { nav, navigate } = useFrame()
  const labels = useLabels()
  const [query, setQuery] = useState('')
  const list = useRef<HTMLDivElement>(null)
  const filtering = query.trim() !== ''
  const shown = useMemo(() => (filtering ? results(nav, query) : undefined), [filtering, nav, query])
  const found = shown?.reduce((n, s) => n + s.items.length, 0) ?? 0
  const inset = variant === 'inset'
  return (
    <FrameSidebarBase
      collapsible="icon"
      variant={inset ? 'inset' : 'sidebar'}
      data-frame-sidebar="classic"
      // The icon column fits the control token: 48px at the default density (46px inset, where the card takes the gutter).
      style={{ ...resize.style, '--sidebar-width-icon': `calc(var(--spacing-control) + var(--spacing) * ${inset ? 3.5 : 4})` } as CSSProperties}
      className={cn(inset && INSET_ON_PAPER, resize.className, className)}
    >
      {(header || search) && (
        <SidebarHeader className="gap-3 pb-1">
          {header}
          {search && (
            <FrameFilterField
              query={query}
              onQuery={setQuery}
              onSubmit={() => shown?.[0]?.items[0] && navigate(shown[0].items[0].id)}
              onEnterList={() => list.current?.querySelector<HTMLElement>('a[href]')?.focus()}
            />
          )}
        </SidebarHeader>
      )}
      <p role="status" className="sr-only">
        {filtering ? (found ? labels.pagesFound(found) : labels.pagesNoMatch(query.trim())) : ''}
      </p>
      <SidebarContent indicator="fill" ref={list}>
        {filtering && !found ? (
          <p className="px-4 py-6 text-center text-ui text-fg-muted">{labels.pagesNoMatch(query.trim())}</p>
        ) : (
          <FrameNavList nav={shown} />
        )}
      </SidebarContent>
      {(links?.length || footer) && (
        <SidebarFooter className="gap-3">
          {links?.length ? (
            <SidebarGroup className="p-0">
              <FrameNavItems items={links} />
            </SidebarGroup>
          ) : null}
          {footer}
        </SidebarFooter>
      )}
      <FrameSidebarResize
        {...resize.edge}
        copy={{ ...DEFAULT_COPY, ...copy }}
        className={cn(inset && 'after:inset-x-0 after:mx-auto after:rounded-full')}
      />
    </FrameSidebarBase>
  )
}

export { FrameSidebarClassic }
export type { FrameSidebarClassicProps, FrameSidebarClassicCopy }
