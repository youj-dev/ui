'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from '../../components/ui/sidebar'
import { cn } from '../../lib/utils'
import { useFrame, type FrameNavItem, type FrameSidebarSlots } from './shell'
import { INSET_ON_CHROME } from './shell/inset'
import { FrameNavItems, FrameNavList } from './shell/nav-list'
import { FrameSidebarBase } from './shell/sidebar-base'
import { liveOptions } from './sidebar-workspace/activity'
import { SAMPLE_ACTIONS, useCommand } from './sidebar-workspace/command'
import { DEFAULT_COPY as COMMAND_COPY, type FrameCommandAction } from './sidebar-workspace/command-model'
import { PinnedTiles } from './sidebar-workspace/pinned'
import { PULSE_COPY, type FramePageActivity, type FrameSignal } from './sidebar-workspace/pulse-data'
import { SetupCard, SETUP_COPY, type FrameSetup } from './sidebar-workspace/setup'
import { Signals } from './sidebar-workspace/signals'

export type { FrameCommandAction } from './sidebar-workspace/command-model'
export type { FramePageActivity, FramePerson, FrameSignal } from './sidebar-workspace/pulse-data'
export type { FrameSetup } from './sidebar-workspace/setup'

/* The workspace sidebar, for products people run their day in: on the
 * theme's gray chrome, with the page beside it as a white card and the
 * current page on a raised white key that glides from row to row.
 * - Under the header, the command field: typing ranks the pages and your
 *   actions in place of the list (↑↓, ↵, Escape), ↓ in the empty field lists
 *   where you've been, / reaches it from anywhere, and G then a page's key
 *   goes straight there.
 * - The sections under small labels; a section marked `collapsible` is a
 *   space that folds under its label and shows its total while folded, its
 *   pages without an icon each wearing a dot of the theme's chart colors.
 *   Counts sit on one column; a `badgeTone: 'danger'` count is loud.
 * - Optional live state: `pinned` pages as tiles on top, `signals` (what
 *   needs you, inbox-style, cleared by following them or with their ×), and
 *   `activity` on the rows (who's there, what's running, what's new), each
 *   read after the page's name.
 * - At the foot, a `setup` card (the next step of getting started, with Skip
 *   and Next), pages for the foot (`links`: Settings, Help), then the footer.
 * - It folds to icons (⌘B, the trigger): labels fade before the width goes,
 *   names move to tooltips, every space opens so its pages stay in reach, and
 *   a page with nested pages opens them in a menu to its side. On phones
 *   it's a sheet, and the page is flat again. */

interface FrameSidebarWorkspaceProps extends FrameSidebarSlots {
  /** The command field under the header. Default true. */
  search?: boolean
  /** What the field can run besides going to a page. Default: two samples to wire to your app. */
  actions?: FrameCommandAction[]
  /** Top-level pages pinned as tiles above the list, by id, three to a row. */
  pinned?: string[]
  /** What needs you, above the list. */
  signals?: FrameSignal[]
  /** A signal was cleared (followed, or its ×). */
  onSignalClear?: (id: string) => void
  /** Who's where, what's running, what's new, by page id. */
  activity?: Record<string, FramePageActivity>
  /** The setup card at the foot. */
  setup?: FrameSetup
  onSetupNext?: () => void
  onSetupSkip?: () => void
  /** Pages at the foot, above the footer: Settings, Help. Give them an `href` to leave the frame. */
  links?: FrameNavItem[]
  /** The field's, the live state's and the setup card's strings, to rewrite or translate. */
  copy?: Partial<FrameSidebarWorkspaceCopy>
}

const DEFAULT_COPY = { ...COMMAND_COPY, ...PULSE_COPY, ...SETUP_COPY, pinned: 'Pinned' }
type FrameSidebarWorkspaceCopy = typeof DEFAULT_COPY

function FrameSidebarWorkspace({
  header,
  footer,
  search = true,
  actions = SAMPLE_ACTIONS,
  pinned,
  signals,
  onSignalClear,
  activity,
  setup,
  onSetupNext,
  onSetupSkip,
  links,
  copy: copyProp,
  className,
}: FrameSidebarWorkspaceProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const { nav } = useFrame()
  const command = useCommand({ actions, copy })
  const [cleared, setCleared] = useState<string[]>([])
  const clear = (id: string) => {
    setCleared((c) => [...c, id])
    onSignalClear?.(id)
  }
  // Pinned pages leave the list, so each page is listed once.
  const tiles = useMemo(() => (pinned ?? []).flatMap((id) => nav.flatMap((s) => s.items).filter((item) => item.id === id && !item.items?.length)), [nav, pinned])
  const listed = useMemo(
    () => (tiles.length ? nav.map((s) => ({ ...s, items: s.items.filter((item) => !tiles.includes(item)) })).filter((s) => s.items.length) : nav),
    [nav, tiles],
  )
  const options = { dots: true, ...liveOptions({ activity, copy, keys: command.keys, armed: command.armed }) }
  return (
    <FrameSidebarBase
      collapsible="icon"
      variant="inset"
      paper="chrome"
      data-frame-sidebar="workspace"
      data-yj-ground="chrome"
      style={{ '--sidebar-width': 'calc(var(--spacing) * 66)', '--sidebar-width-icon': 'calc(var(--spacing-control) + var(--spacing) * 3.5)' } as CSSProperties}
      className={cn(INSET_ON_CHROME, className)}
    >
      {(header || search) && (
        <SidebarHeader className="gap-3 pb-1">
          {header}
          {search && command.fieldNode}
        </SidebarHeader>
      )}
      <SidebarContent>
        {command.resultsNode ?? (
          <>
            {signals && <Signals signals={signals.filter((s) => !cleared.includes(s.id))} copy={copy} onClear={clear} />}
            {tiles.length > 0 && <PinnedTiles items={tiles} label={copy.pinned} />}
            <FrameNavList nav={listed} options={options} />
          </>
        )}
      </SidebarContent>
      {(setup || links?.length || footer) && (
        <SidebarFooter className="gap-3">
          {setup && <SetupCard setup={setup} copy={copy} onNext={onSetupNext} onSkip={onSetupSkip} />}
          {links?.length ? (
            <SidebarGroup className="p-0">
              <FrameNavItems items={links} options={options} />
            </SidebarGroup>
          ) : null}
          {footer}
        </SidebarFooter>
      )}
    </FrameSidebarBase>
  )
}

export { FrameSidebarWorkspace }
export type { FrameSidebarWorkspaceProps, FrameSidebarWorkspaceCopy }
