'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useLabels } from '@youj/core'
import { AccountMenu } from '../../components/ui/account-menu'
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { CollapsibleChevron } from '../../components/ui/collapsible'
import { DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator } from '../../components/ui/dropdown-menu'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, FrameAccountItems, type FrameAccountCopy, type FrameAccountRow } from './account-menu'
import type { FrameUser } from './shell'

/* Your presence in a frame's top bar: a pill with your avatar, a status dot
 * and, on wide screens, the status's name. It opens the account menu with a
 * status choice above the standard rows. Each status has its color and a
 * mark cut into the dot (a crescent for Away, a bar for Do not disturb, a
 * hole for Invisible), so it never rests on color alone. Choosing one
 * recolors the dot and morphs its mark on the base token, the name
 * crossfades while the pill eases to its new width (the bar beside it slides
 * over rather than jumping), and the change is announced. Reduced motion:
 * the same states, at once. */

type FrameStatus = 'online' | 'away' | 'dnd' | 'invisible'

interface FrameAccountStatusProps {
  user: FrameUser
  /** Your presence, when you keep it. */
  status?: FrameStatus
  /** Default 'online'. */
  defaultStatus?: FrameStatus
  onStatusChange?: (status: FrameStatus) => void
  onSignOut?: () => void
  /** A standard row was chosen (not used with `children`). */
  onSelect?: (row: FrameAccountRow) => void
  /** The standard rows' names, to rewrite or translate. */
  copy?: Partial<FrameAccountCopy>
  /** Your rows under the status (DropdownMenuItem, groups). Default: Profile, Settings, Keyboard shortcuts and Help. */
  children?: ReactNode
  className?: string
}

const STATUSES: FrameStatus[] = ['online', 'away', 'dnd', 'invisible']

const DOT: Record<FrameStatus, string> = {
  online: 'bg-success',
  away: 'bg-warning',
  dnd: 'bg-danger',
  invisible: 'bg-fg-muted',
}

function useStatusNames(): Record<FrameStatus, string> {
  const labels = useLabels()
  return { online: labels.presenceOnline, away: labels.presenceAway, dnd: labels.presenceDoNotDisturb, invisible: labels.presenceInvisible }
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

/** A mark cut into the dot, in the surface color (--frame-status-cut), grown in or out from its center. */
function Mark({ on, className, off = 'scale-0' }: { on: boolean; className: string; off?: string }) {
  return (
    <span
      className={cn(
        'absolute bg-(--frame-status-cut) transition-[scale,opacity,background-color] yj-duration-base ease-standard',
        on ? 'scale-100 opacity-100' : cn(off, 'opacity-0'),
        className,
      )}
    />
  )
}

function StatusMarks({ status }: { status: FrameStatus }) {
  return (
    <>
      <Mark on={status === 'away'} className="-start-[30%] -top-[30%] size-[80%] rounded-full" />
      <Mark on={status === 'dnd'} off="scale-x-0" className="inset-x-[20%] top-[40%] h-[20%] rounded-full" />
      <Mark on={status === 'invisible'} className="inset-[30%] rounded-full" />
    </>
  )
}

/** The status's name. Its box eases to each name's width while the new name fades in. */
function StatusName({ name }: { name: string }) {
  const inner = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState<number>()
  useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const measure = () => setWidth(el.offsetWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [name])
  return (
    <span style={{ width }} className="overflow-hidden transition-[width] yj-duration-base ease-standard max-lg:hidden">
      <span
        ref={inner}
        key={name}
        className="inline-block whitespace-nowrap transition-opacity yj-duration-base ease-standard starting:opacity-0"
      >
        {name}
      </span>
    </span>
  )
}

function FrameAccountStatus({
  user,
  status: statusProp,
  defaultStatus = 'online',
  onStatusChange,
  onSignOut = () => {},
  onSelect,
  copy,
  children,
  className,
}: FrameAccountStatusProps) {
  const labels = useLabels()
  const names = useStatusNames()
  const [status, setStatus] = useControllableState(statusProp, defaultStatus)
  const { announce, announcer } = useAnnouncer()
  const change = (next: FrameStatus) => {
    if (next === status) return
    setStatus(next)
    onStatusChange?.(next)
    announce(labels.presenceSetTo(names[next]))
  }

  const pill = (
    <button
      type="button"
      // Its own name, so it says the status it shows (the menu's name alone wouldn't).
      aria-label={`${labels.accountMenu(user.name)}, ${names[status]}`}
      data-status={status}
      className={cn(
        'inline-flex h-control shrink-0 items-center gap-2 rounded-2xl border border-line ps-1 pe-2 text-ui font-medium text-fg select-none focus-ring',
        'transition-[background-color,border-color] yj-duration-fast ease-standard hover:bg-hover data-popup-open:bg-hover',
        // The dot's ring and marks are cut in the color under them, so they follow the pill's hover.
        '[--frame-status-cut:var(--color-canvas)] hover:[--frame-status-cut:color-mix(in_oklab,var(--color-fg)_6%,var(--color-canvas))]',
        'data-popup-open:[--frame-status-cut:color-mix(in_oklab,var(--color-fg)_6%,var(--color-canvas))]',
      )}
    >
      <Avatar aria-hidden size="sm" className="size-[calc(var(--spacing-control)-var(--spacing)*2)]">
        {user.avatar && <AvatarImage src={user.avatar} alt="" />}
        {/* Centred on the part of the disc the dot leaves clear. */}
        <AvatarFallback className="bg-accent-subtle pe-0.5 pb-0.5 text-accent-text">{initials(user.name)}</AvatarFallback>
        <AvatarBadge
          className={cn(
            'overflow-hidden ring-(--frame-status-cut) group-data-[size=sm]/avatar:size-2.5 -end-0.5 -bottom-0.5',
            'transition-[background-color,box-shadow] yj-duration-base ease-standard',
            DOT[status],
          )}
        >
          <StatusMarks status={status} />
        </AvatarBadge>
      </Avatar>
      <StatusName name={names[status]} />
      <CollapsibleChevron size={14} className="-ms-0.5 text-fg-muted" />
    </button>
  )

  return (
    <>
      <AccountMenu user={user} onSignOut={onSignOut} trigger={pill} className={className}>
        <DropdownMenuRadioGroup
          value={status}
          onValueChange={(value) => change(value as FrameStatus)}
          className="[--frame-status-cut:var(--color-overlay)]"
        >
          <DropdownMenuLabel>{labels.presenceStatus}</DropdownMenuLabel>
          {STATUSES.map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              <span aria-hidden className="grid size-4 shrink-0 place-items-center">
                <span className={cn('relative size-2.5 overflow-hidden rounded-full', DOT[s])}>
                  <StatusMarks status={s} />
                </span>
              </span>
              {names[s]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        {children ?? <FrameAccountItems copy={{ ...DEFAULT_COPY, ...copy }} onSelect={onSelect} />}
      </AccountMenu>
      {announcer}
    </>
  )
}

export { FrameAccountStatus }
export type { FrameAccountStatusProps, FrameStatus }
