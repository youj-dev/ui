'use client'

import { useId, type KeyboardEvent } from 'react'
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { cn, initials, listFormat } from '../../../lib/utils'
import type { VersionHistoryCopy, VersionHistoryVersion } from './data'
import { clockTime, dateTime, dayOf, toTime } from './time'

/* The versions, newest first, by day, on a rail: a listbox you walk with
 * ↑ ↓ (Home and End for the ends), where the version you're on is the one
 * shown. Each says when, who, its name if it has one, and how many words it
 * added and removed. Named versions get a larger mark. */

export interface Counts {
  added: number
  removed: number
}

export function VersionList({
  versions,
  current,
  selected,
  counts,
  copy,
  now,
  onSelect,
  className,
}: {
  versions: VersionHistoryVersion[]
  /** The newest version's id. */
  current: string | undefined
  selected: string | undefined
  counts: ReadonlyMap<string, Counts>
  copy: VersionHistoryCopy
  now: number | null
  onSelect: (id: string) => void
  /** Where it scrolls: the card's height holds it. */
  className?: string
}) {
  const id = useId()
  const utc = now === null
  const days: { day: number; label: string; versions: VersionHistoryVersion[] }[] = []
  for (const version of versions) {
    const { day, label } = dayOf(toTime(version.createdAt), now, copy.locale, copy)
    const last = days[days.length - 1]
    if (last?.day === day) last.versions.push(version)
    else days.push({ day, label, versions: [version] })
  }
  const order = days.flatMap((d) => d.versions.map((v) => v.id))

  const onKeyDown = (event: KeyboardEvent) => {
    const at = order.indexOf(selected ?? '')
    const to =
      event.key === 'ArrowDown' ? at + 1 : event.key === 'ArrowUp' ? at - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? order.length - 1 : null
    if (to === null) return
    event.preventDefault()
    const next = order[Math.min(Math.max(to, 0), order.length - 1)]
    if (next && next !== selected) {
      onSelect(next)
      document.getElementById(`${id}-${next}`)?.scrollIntoView?.({ block: 'nearest' })
    }
  }

  return (
    <div
      role="listbox"
      tabIndex={0}
      aria-label={copy.versions}
      aria-activedescendant={selected ? `${id}-${selected}` : undefined}
      onKeyDown={onKeyDown}
      data-slot="version-list"
      className={cn('group/list flex flex-col gap-3 rounded-lg outline-none', className)}
    >
      {days.map((day) => (
        <div key={day.day} role="group" aria-labelledby={`${id}-day-${day.day}`} className="flex flex-col">
          <div id={`${id}-day-${day.day}`} role="presentation" className="px-2 pb-1 text-ui-xs font-medium tracking-wide text-fg-muted uppercase">
            {day.label}
          </div>
          {day.versions.map((version, i) => {
            const on = version.id === selected
            const count = counts.get(version.id)
            const time = toTime(version.createdAt)
            const restored = version.restoredFrom ? versions.find((v) => v.id === version.restoredFrom) : undefined
            const who = listFormat(copy.locale, { type: 'conjunction' }).format(version.authors.map((a) => a.name))
            const last = i === day.versions.length - 1
            return (
              <div
                key={version.id}
                id={`${id}-${version.id}`}
                role="option"
                aria-selected={on}
                data-yj-named={version.name ? '' : undefined}
                onClick={() => onSelect(version.id)}
                className={cn(
                  'relative flex cursor-pointer gap-2.5 rounded-md py-2 ps-2 pe-2.5 transition-colors yj-duration-fast ease-standard',
                  'hover:bg-hover aria-selected:bg-selected',
                  'group-focus-visible/list:aria-selected:outline-2 group-focus-visible/list:aria-selected:-outline-offset-2 group-focus-visible/list:aria-selected:outline-focus',
                )}
              >
                {/* The rail through the day, and this version's mark on it. */}
                {!last && <span aria-hidden className="absolute start-[calc(var(--spacing)*3.25)] top-5 -bottom-2.5 w-px bg-line" />}
                <span aria-hidden className="relative flex w-2.5 shrink-0 justify-center pt-1.5">
                  <span
                    className={cn('rounded-full', version.name ? 'size-2.5 bg-fg' : 'mt-0.5 size-1.5 bg-fg-subtle', on && !version.name && 'bg-fg')}
                  />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-baseline gap-2">
                    <span className={cn('min-w-0 truncate text-ui text-fg', version.name ? 'font-semibold' : 'font-medium')}>
                      {version.name ?? clockTime(time, copy.locale, utc)}
                    </span>
                    {version.id === current && (
                      <Badge variant="outline" size="sm" className="shrink-0">
                        {copy.currentShort}
                      </Badge>
                    )}
                    {count && (count.added > 0 || count.removed > 0) && (
                      <span className="ms-auto shrink-0 font-mono text-ui-xs tabular-nums">
                        <span aria-hidden className="flex gap-1">
                          {count.added > 0 && <span className="text-success-text">+{count.added}</span>}
                          {count.removed > 0 && <span className="text-danger-text">−{count.removed}</span>}
                        </span>
                        <span className="sr-only">{copy.countsLabel(count.added, count.removed)}</span>
                      </span>
                    )}
                  </div>
                  <span className="flex min-w-0 items-center gap-1.5 text-ui-sm text-fg-muted">
                    <AvatarGroup aria-hidden className="-space-x-1">
                      {version.authors.slice(0, 3).map((author) => (
                        <Avatar key={author.id} size="sm" className="size-4 ring-1 ring-band">
                          {author.avatar && <AvatarImage src={author.avatar} alt="" />}
                          <AvatarFallback className="text-ui-xs">{initials(author.name).slice(0, 1)}</AvatarFallback>
                        </Avatar>
                      ))}
                    </AvatarGroup>
                    <span className="truncate">
                      {version.name && `${clockTime(time, copy.locale, utc)} · `}
                      {restored ? copy.restoredFrom(dateTime(toTime(restored.createdAt), copy.locale, utc)) : version.auto ? copy.autosave : who}
                      {version.auto && !restored && ` · ${who}`}
                    </span>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
