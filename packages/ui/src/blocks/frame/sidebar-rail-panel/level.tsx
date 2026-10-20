'use client'

import { Fragment } from 'react'
import { m, useIsPresent } from 'motion/react'
import { ChevronLeftIcon, ChevronRightIcon } from '@youj/icons'
import { useYouj, useLabels } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../../components/ui/sidebar'
import { cn } from '../../../lib/utils'
import { badgeText, useFrame, type FrameIcon, type FrameNavItem } from '../shell'
import { FrameNavIcon } from '../shell/nav-icon'
import { ROW_INK, ROW_MOTION } from '../shell/signature'

/* One level of the drill-down: the path that leads to it (each step a way
 * straight back up to it), the level's title set large, and its rows. A row
 * is a page (a link) or a way deeper (a button with a chevron). The level
 * slides in from the side it's reached from, and the one it replaces slips a
 * third of the way out the other way as it fades, as in iOS. Each level
 * carries its own mark on the rail, so the mark travels with its level. Down
 * to icons, the path folds to one back button and the title folds away. */

export type Row =
  | { kind: 'page'; item: FrameNavItem }
  | { kind: 'deeper'; id: string; label: string; icon?: FrameIcon; count: number; here?: FrameNavItem }

export interface LevelModel {
  key: string
  title: string
  /** The levels above this one, the top first: each step's name. Empty at the top. */
  steps: { id: string; label: string }[]
  rows: Row[]
}

interface LevelCopy {
  path: string
  back: (level: string) => string
}

/** The raised key under the current page, or the way in that holds it. */
const markClass = 'rounded-md bg-key shadow-xs ring-1 ring-line'

/** Sized from the control token, so density themes scale the list; collapsed, a square of the same size. */
const rowClass = cn(
  'h-control gap-2.5 group-data-[collapsible=icon]:size-control!',
  ROW_INK,
  ROW_MOTION,
  '[&>:first-child]:text-fg-subtle hover:[&>:first-child]:text-fg data-active:[&>:first-child]:text-accent-text',
)

/* Folds away down to icons, the rows rising into its place. */
const foldsOnRail =
  '[transition:height_calc(var(--yj-duration-slow)*var(--yj-motion,1))_var(--ease-standard),padding_calc(var(--yj-duration-slow)*var(--yj-motion,1))_var(--ease-standard),opacity_calc(var(--yj-duration-fast)*var(--yj-motion,1))_var(--ease-standard)] group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:py-0 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none'

/** A row's icon, when it has one. */
function Glyph({ icon, current }: { icon?: FrameIcon; label: string; current: boolean }) {
  return icon ? <FrameNavIcon icon={icon} current={current} /> : null
}

/** A count or tag as a pill on a well, loud in danger: the panel's tree's look. */
function Badge({ item }: { item: FrameNavItem }) {
  return (
    <span
      className={cn(
        'flex h-5 min-w-5 items-center justify-center rounded-chip px-1.5 text-ui-xs font-medium',
        item.badgeTone === 'danger' ? 'bg-danger-subtle text-danger-text' : 'bg-well text-fg-muted',
      )}
    >
      {item.badge}
    </span>
  )
}

function PageRow({ item }: { item: FrameNavItem }) {
  const { active, link, Link } = useFrame()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={active === item.id} tooltip={item.label} data-row={item.id} data-yj-trigger="" render={<Link {...link(item)} />} className={rowClass}>
        <Glyph icon={item.icon} label={item.label} current={active === item.id} />
        <span>{item.label}</span>
        {item.badge !== undefined && (
          <span className="ms-auto text-ui-sm text-fg-subtle tabular-nums">
            <span className="sr-only">, {badgeText(item)}</span>
            <span aria-hidden>
              <Badge item={item} />
            </span>
          </span>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function DeeperRow({ row, onDeeper }: { row: Extract<Row, { kind: 'deeper' }>; onDeeper: (id: string) => void }) {
  const labels = useLabels()
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        // Holding the current page, the way in wears the mark.
        isActive={Boolean(row.here)}
        tooltip={row.label}
        data-row={row.id}
        data-deeper=""
        data-yj-trigger=""
        onClick={() => onDeeper(row.id)}
        className={rowClass}
      >
        <Glyph icon={row.icon} label={row.label} current={Boolean(row.here)} />
        <span>
          {row.label}
          <span className="sr-only">, {row.here ? row.here.label : labels.pagesFound(row.count)}</span>
        </span>
        <span aria-hidden className="ms-auto flex min-w-0 items-center gap-1.5">
          <span className={cn('min-w-0 truncate text-ui-sm tabular-nums', row.here ? 'text-accent-text' : 'text-fg-subtle')}>{row.here ? row.here.label : row.count}</span>
          <ChevronRightIcon active={false} size={14} className="shrink-0 text-fg-subtle rtl:-scale-x-100" />
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/**
 * The way back above the title: a back chevron to the level above, then the
 * whole path, each step a way straight back to it. Down to icons only the
 * chevron stays, named in its tooltip; it's one element in both states, so
 * ⌘B never drops its focus.
 */
function Path({ steps, onUp, copy }: { steps: LevelModel['steps']; onUp: (depth: number) => void; copy: LevelCopy }) {
  const parent = steps.at(-1)!
  return (
    <div className="flex min-w-0 items-center gap-0.5 pb-0.5">
      <SidebarMenu className="w-auto shrink-0">
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={parent.label}
            aria-label={copy.back(parent.label)}
            data-yj-trigger=""
            onClick={() => onUp(steps.length - 1)}
            className="size-7 justify-center p-0 text-fg-muted"
          >
            {/* Held at rest: its hover pose is a disclosure's, and this one only points back. */}
            <ChevronLeftIcon active={false} size={16} strokeWidth={1.75} className="rtl:-scale-x-100" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <ol aria-label={copy.path} className="flex min-w-0 flex-wrap items-center gap-x-0.5 group-data-[collapsible=icon]:hidden">
        {steps.map((level, depth) => (
          <Fragment key={level.id || 'top'}>
            {depth > 0 && (
              <li aria-hidden className="text-ui-sm text-fg-subtle">
                /
              </li>
            )}
            <li className="flex min-w-0">
              <button
                type="button"
                data-yj-trigger=""
                onClick={() => onUp(depth)}
                className="flex h-7 min-w-0 items-center rounded-md px-1 text-ui-sm text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg focus-ring"
              >
                <span className="truncate">{level.label}</span>
              </button>
            </li>
          </Fragment>
        ))}
      </ol>
    </div>
  )
}

export function Level({
  level,
  direction,
  onUp,
  onDeeper,
  copy,
  labelledBy,
}: {
  level: LevelModel
  /** 1 going deeper, -1 coming back, already flipped for right-to-left. */
  direction: number
  /** Back up to the level at this depth (0 is the top). */
  onUp: (depth: number) => void
  onDeeper: (id: string) => void
  copy: LevelCopy
  /** The top level is named by the panel's own title. */
  labelledBy: string
}) {
  const k = useYouj()
  const present = useIsPresent()
  const top = level.steps.length === 0
  const titleId = top ? labelledBy : `drill-${level.key.replace(/\W+/g, '-')}`
  return (
    <m.div
      custom={direction}
      initial={k.reduced ? false : 'enter'}
      animate="center"
      exit="exit"
      variants={{
        enter: (d: number) => ({ x: `${d * 100}%`, opacity: 0 }),
        center: { x: 0, opacity: 1, transition: { x: k.tween('slow', 'emphasized'), opacity: k.tween('fast', 'enter') } },
        exit: (d: number) => ({ x: `${d * -30}%`, opacity: 0, transition: k.reduced ? k.tween('instant') : { x: k.tween('slow', 'emphasized'), opacity: k.tween('fast', 'exit') } }),
      }}
      // The level on its way out is out of reach.
      inert={!present || undefined}
      data-level={present ? 'current' : 'leaving'}
      className="flex min-w-0 flex-col [grid-area:1/1]"
    >
      {!top && <Path steps={level.steps} onUp={onUp} copy={copy} />}
      {!top && (
        <h3 id={titleId} className={cn('flex h-8 items-center truncate px-2 text-ui font-semibold text-fg', foldsOnRail)}>
          {level.title}
        </h3>
      )}
      <SidebarMenu aria-labelledby={titleId} className="relative isolate">
        {level.rows.map((row) => (row.kind === 'page' ? <PageRow key={row.item.id} item={row.item} /> : <DeeperRow key={row.id} row={row} onDeeper={onDeeper} />))}
        <SlidingIndicator match="[data-active]" className={markClass} />
      </SidebarMenu>
    </m.div>
  )
}
