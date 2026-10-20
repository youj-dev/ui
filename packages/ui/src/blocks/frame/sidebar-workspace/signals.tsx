'use client'

import type { MouseEvent } from 'react'
import { BellDotIcon, CheckCircleIcon, XIcon } from '@youj/icons'
import { PresenceItem, PresenceList } from '@youj/motion'
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../../../components/ui/sidebar'
import { cn } from '../../../lib/utils'
import { FrameSectionLabel, useFrame, type FrameNavItem } from '../shell'
import type { FramePulseCopy, FrameSignal } from './pulse-data'

/* What needs you, inbox-style, above the nav: each signal a line with its
 * priority as a bar (red, amber, or quiet ink), the page it's about and when. Following
 * one goes to its page and clears it; the × clears it without going. A
 * cleared signal fades where it stands and the rest glide up. With none
 * left, it says you're caught up. On the rail it's a bell with the count,
 * which opens the sidebar. */

const BAR: Record<FrameSignal['priority'], string> = {
  urgent: 'bg-danger',
  high: 'bg-warning',
  normal: 'bg-fg-subtle',
}

export function Signals({ signals, copy, onClear }: { signals: FrameSignal[]; copy: FramePulseCopy; onClear: (id: string) => void }) {
  const { nav, link, Link } = useFrame()
  const { state, isMobile, setOpen } = useSidebar()
  const collapsed = state === 'collapsed' && !isMobile
  const pages = new Map<string, FrameNavItem>()
  for (const item of nav.flatMap((s) => s.items)) {
    pages.set(item.id, item)
    for (const child of item.items ?? []) pages.set(child.id, child)
  }
  const shown = signals.filter((s) => pages.has(s.page))
  return (
    <SidebarGroup data-slot="frame-signals" className="pb-0">
      <FrameSectionLabel className="gap-2">
        {copy.needsYou}
        {shown.length > 0 && (
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-danger-subtle px-1 text-[length:--spacing(2.5)] leading-none font-semibold text-danger-text tabular-nums">
            {shown.length}
          </span>
        )}
      </FrameSectionLabel>
      {/* On the rail: the bell, counting what's waiting. */}
      <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={copy.needsYouCount(shown.length)}
            aria-label={copy.needsYouCount(shown.length)}
            onClick={() => setOpen(true)}
            className="group-data-[collapsible=icon]:size-control!"
          >
            <BellDotIcon size={16} strokeWidth={1.75} className={cn(shown.length ? 'text-fg' : 'text-fg-subtle')} />
          </SidebarMenuButton>
          {shown.length > 0 && <span aria-hidden className="pointer-events-none absolute end-1 top-1 size-2 rounded-full bg-danger ring-2 ring-chrome" />}
        </SidebarMenuItem>
      </SidebarMenu>
      {/* The list closes its height on the rail, and is out of reach there. */}
      <div
        inert={collapsed || undefined}
        className="grid grid-rows-[1fr] transition-[grid-template-rows,opacity] yj-duration-slow ease-standard group-data-[collapsible=icon]:grid-rows-[0fr] group-data-[collapsible=icon]:opacity-0"
      >
        <div className="min-h-0 overflow-hidden">
          {shown.length ? (
            <PresenceList aria-label={copy.needsYou} className="flex flex-col gap-1 pt-0.5 pb-1">
              {shown.map((signal) => {
                const page = pages.get(signal.page)!
                const { href, onClick } = link(page)
                return (
                  <PresenceItem key={signal.id} className="group/signal relative">
                    <Link
                      href={href}
                      data-yj-trigger=""
                      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
                        onClick(event)
                        onClear(signal.id)
                      }}
                      className={cn(
                        'relative flex min-w-0 flex-col rounded-md py-1.5 ps-3.5 pe-7 focus-ring',
                        'bg-hover transition-colors yj-duration-fast ease-standard hover:bg-hover',
                      )}
                    >
                      <span aria-hidden className={cn('absolute inset-y-2 start-1.5 w-0.5 rounded-full', BAR[signal.priority])} />
                      <span className="truncate text-ui text-fg">{signal.title}</span>
                      <span className="truncate text-ui-xs text-fg-subtle">
                        <span className="sr-only">, </span>
                        {page.label} · {signal.time}
                      </span>
                    </Link>
                    <button
                      type="button"
                      aria-label={copy.clear(signal.title)}
                      onClick={() => onClear(signal.id)}
                      className={cn(
                        'absolute end-1 top-1.5 grid size-5 place-items-center rounded-sm text-fg-muted focus-ring',
                        'opacity-0 transition-opacity yj-duration-fast hover:bg-hover hover:text-fg',
                        'group-hover/signal:opacity-100 group-focus-within/signal:opacity-100 pointer-coarse:opacity-100',
                      )}
                    >
                      <XIcon size={12} strokeWidth={2} />
                    </button>
                  </PresenceItem>
                )
              })}
            </PresenceList>
          ) : (
            <p className="flex items-center gap-2 px-2 py-1.5 text-ui text-fg-muted">
              <CheckCircleIcon size={16} strokeWidth={1.75} className="text-success" />
              {copy.caughtUp}
            </p>
          )}
        </div>
      </div>
    </SidebarGroup>
  )
}
