'use client'

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { useSidebar } from '../../components/ui/sidebar'
import { cn } from '../../lib/utils'
import { FrameRail, useFrame, type FrameSidebarSlots } from './shell'
import { INSET_ON_CHROME } from './shell/inset'
import { FrameSidebarBase } from './shell/sidebar-base'
import { Panel, type FrameRailPanelView } from './sidebar-rail-panel/panel'
import { Rail } from './sidebar-rail-panel/rail'

export type { FrameRailPanelView } from './sidebar-rail-panel/panel'

/* Rail + panel, for products with many areas: two cards floating on the
 * theme's gray chrome beside the page's card. The rail holds the nav's
 * sections as round keys, named in tooltips (the shown one raised, the one
 * that holds the current page in the accent), the header's mark on top and
 * the footer's parts at the bottom, each in its compact form. The panel
 * holds the chosen section: its title with an add button, an optional toggle
 * of views, a filter, and its pages as a tree on guide lines with counts as
 * pills, the current page on a raised key that glides.
 * - The rail is a toolbar you move through with the arrow keys; pressing the
 *   shown section again folds the panel away, as an editor's activity bar
 *   does. The panel opens on the current page's section and follows the page
 *   when it's reached from elsewhere.
 * - `panel="drill"` shows the section one level at a time instead, sliding
 *   deeper with the way back named above each level.
 * - Folded (⌘B, the trigger, the shown key) only the rail stays: the panel
 *   fades at once, then the width closes over it, and each key flies its
 *   section's pages out beside it on hover or from the keyboard.
 * - On phones it's a sheet with the rail and the panel side by side. */

interface FrameSidebarRailPanelProps extends FrameSidebarSlots {
  /** The panel's pages as a tree (default) or one level at a time. */
  panel?: 'tree' | 'drill'
  /** The panel's filter field. Default true. */
  search?: boolean
  /** A segmented toggle under the panel's title: what the panel shows is yours to change with the view. */
  views?: FrameRailPanelView[]
  view?: string
  defaultView?: string
  onViewChange?: (view: string) => void
  /** Adds a "+" beside the panel's title; called with the shown section's id. */
  onAdd?: (section: string) => void
  /** The rail's, the add button's and the drill-down's strings, to rewrite or translate. */
  copy?: Partial<FrameSidebarRailPanelCopy>
}

const DEFAULT_COPY = {
  /** The rail's name. */
  sections: 'Sections',
  add: (section: string) => `Add to ${section}`,
  views: 'View',
  /** The path above a level's title, for assistive tech. */
  path: 'Path',
  back: (level: string) => `Back to ${level}`,
}
type FrameSidebarRailPanelCopy = typeof DEFAULT_COPY

/* The rail is a 56px column of 40px keys; the panel 264px; 8px between the cards. */
const RAIL = 'calc(var(--spacing) * 14)'
const PANEL = 'calc(var(--spacing) * 66)'

/** A floating card on the chrome, as the page beside it is. */
const CARD = 'rounded-surface bg-surface shadow-sm ring-1 ring-line'

function FrameSidebarRailPanel({
  header,
  footer,
  panel = 'tree',
  search = true,
  views,
  view: viewProp,
  defaultView,
  onViewChange,
  onAdd,
  copy: copyProp,
  className,
}: FrameSidebarRailPanelProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const { nav, trail } = useFrame()
  const { state, isMobile, setOpen } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile
  const here = trail?.section.id
  const [chosen, setChosen] = useState(here ?? nav[0]?.id)
  const [ownView, setOwnView] = useState(defaultView)
  const view = viewProp ?? ownView
  // Which way the last switch went in the rail: new pages come in from that side.
  const [from, setFrom] = useState(0)
  const panelId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const index = (id: string | undefined) => nav.findIndex((s) => s.id === id)
  const choose = (id: string) => {
    setFrom(Math.sign(index(id) - index(chosen)))
    setChosen(id)
  }

  // A page reached from elsewhere (the palette, a tab, a flyout) brings its section's panel.
  const [seenHere, setSeenHere] = useState<typeof here>()
  if (seenHere !== here) {
    setSeenHere(here)
    if (here) choose(here)
  }

  // Folding hides the panel: focus inside it moves to its section's key.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on the fold only; the section is read as it stands then
  useEffect(() => {
    if (collapsed && panelRef.current?.contains(document.activeElement)) railRef.current?.querySelector<HTMLElement>(`[data-yj-section="${chosen}"]`)?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs on the fold only; the section is read as it stands then
  }, [collapsed])

  const section = nav.find((s) => s.id === chosen) ?? nav[0]
  const onToggle = (id: string) => {
    // The shown section's key folds the panel away (not in the phone's sheet).
    if (id === chosen && !isMobile) setOpen(false)
    else choose(id)
  }
  const changeView = (next: string) => {
    setOwnView(next)
    onViewChange?.(next)
  }

  return (
    <FrameSidebarBase
      collapsible="icon"
      variant="inset"
      paper="none"
      data-frame-sidebar="rail-panel"
      data-yj-ground="chrome"
      style={{ '--sidebar-width': `calc(${RAIL} + ${PANEL} + var(--spacing) * 6)`, '--sidebar-width-icon': RAIL } as CSSProperties}
      className={cn(INSET_ON_CHROME, className)}
    >
      <div className={cn('flex size-full min-h-0 gap-2', isMobile && 'p-2')}>
        <div className={cn(CARD, 'flex w-(--rail) shrink-0 flex-col items-center gap-2 py-2')} style={{ '--rail': RAIL } as CSSProperties}>
          {header && (
            <FrameRail>
              <div className="flex justify-center [&_[data-sidebar=menu-item]]:flex [&_[data-sidebar=menu-item]]:justify-center">{header}</div>
            </FrameRail>
          )}
          {/* Scrolls when the sections outgrow it; no bar, a rail this narrow can't spare the width. */}
          <div ref={railRef} className="min-h-0 w-full flex-1 overflow-y-auto [scrollbar-width:none]">
            <Rail nav={nav} shown={collapsed ? undefined : chosen} here={here} collapsed={collapsed} panelId={panelId} label={copy.sections} onChoose={onToggle} />
          </div>
          {footer && (
            <FrameRail>
              <div className="flex flex-col items-center gap-2 [&_[data-sidebar=menu-item]]:flex [&_[data-sidebar=menu-item]]:justify-center">{footer}</div>
            </FrameRail>
          )}
        </div>
        <nav
          ref={panelRef}
          id={panelId}
          aria-label={section?.label}
          inert={collapsed || undefined}
          className={cn(
            CARD,
            // As wide as the width leaves it, like any sidebar's content.
            'flex min-h-0 min-w-0 flex-1 flex-col px-2',
            // Gone at once when collapsing; back a beat after the width starts to return.
            'transition-opacity yj-duration-fast ease-standard [transition-delay:calc(var(--yj-duration-fast)*var(--yj-motion,1))]',
            'group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:yj-duration-instant group-data-[collapsible=icon]:[transition-delay:0s]',
          )}
        >
          {section && (
            <Panel
              section={section}
              from={from}
              mode={panel}
              search={search}
              views={views}
              view={view}
              onViewChange={changeView}
              onAdd={onAdd}
              copy={copy}
            />
          )}
        </nav>
      </div>
    </FrameSidebarBase>
  )
}

export { FrameSidebarRailPanel }
export type { FrameSidebarRailPanelProps, FrameSidebarRailPanelCopy }
