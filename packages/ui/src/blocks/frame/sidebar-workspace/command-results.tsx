'use client'

import { m } from 'motion/react'
import { CornerDownLeftIcon } from '@youj/icons'
import { MotionFeatures, useYouj } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { Kbd } from '../../../components/ui/kbd'
import { cn } from '../../../lib/utils'
import type { FrameIcon } from '../shell'

/* The field's results: a listbox the field drives (it keeps focus and names
 * the highlighted option as its active descendant). ↑↓ glide the highlight,
 * the pointer moves it too, and ↵ or a click picks. */

export interface CommandOption {
  id: string
  label: string
  icon?: FrameIcon
  /** Where a page sits ("Workspace › Projects"), or "Action". */
  detail?: string
  /** Read after the name: "4 unread". */
  note?: string
}

export interface CommandGroup {
  id: string
  label: string
  options: CommandOption[]
}

/** The typed text marked in a name. */
function Marked({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (at < 0) return text
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-xs bg-accent-subtle text-fg">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  )
}

export const optionId = (listId: string, id: string) => `${listId}-${id}`

export function CommandResults({
  id,
  label,
  query,
  groups,
  active,
  empty,
  onActive,
  onPick,
}: {
  id: string
  label: string
  query: string
  groups: CommandGroup[]
  active: string | undefined
  empty: string
  onActive: (id: string) => void
  onPick: (id: string) => void
}) {
  const k = useYouj()
  const count = groups.reduce((n, g) => n + g.options.length, 0)
  return (
    <MotionFeatures>
      <m.div
        data-slot="frame-command-results"
        initial={k.reduced ? false : { opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={k.tween('fast', 'enter')}
        className="flex min-w-0 flex-col px-2 pb-2"
      >
        <div role="listbox" id={id} aria-label={label} className="relative isolate flex flex-col">
          {groups.map((group) => (
            <div key={group.id} role="group" aria-labelledby={`${id}-g-${group.id}`} className="flex flex-col">
              <div id={`${id}-g-${group.id}`} data-slot="eyebrow" className="flex h-7 items-center px-2 pt-1 text-ui-sm font-medium text-fg-muted select-none">
                {group.label}
              </div>
              {group.options.map((option) => {
                const Icon = option.icon
                const selected = option.id === active
                return (
                  <div
                    key={option.id}
                    id={optionId(id, option.id)}
                    role="option"
                    aria-selected={selected}
                    // The field keeps focus: a press here must not take it.
                    onMouseDown={(event) => event.preventDefault()}
                    onPointerMove={() => !selected && onActive(option.id)}
                    onClick={() => onPick(option.id)}
                    className={cn(
                      'group/option flex h-control min-w-0 cursor-pointer items-center gap-2.5 rounded-md px-2 text-ui text-fg select-none',
                      'transition-colors yj-duration-fast ease-standard aria-selected:text-fg',
                    )}
                  >
                    {Icon ? (
                      <Icon size={16} strokeWidth={1.75} className="shrink-0 text-fg-subtle group-aria-selected/option:text-fg" />
                    ) : (
                      <span aria-hidden className="size-4 shrink-0" />
                    )}
                    <span className="min-w-0 truncate">
                      <Marked text={option.label} query={query} />
                      {option.note && <span className="sr-only">, {option.note}</span>}
                    </span>
                    {option.detail && <span className="ms-auto min-w-0 shrink truncate text-ui-xs text-fg-subtle group-aria-selected/option:hidden">{option.detail}</span>}
                    <CornerDownLeftIcon
                      aria-hidden
                      size={14}
                      className="ms-auto hidden shrink-0 text-fg-muted group-aria-selected/option:block rtl:-scale-x-100"
                    />
                  </div>
                )
              })}
            </div>
          ))}
          <SlidingIndicator match='[aria-selected="true"]' className="rounded-md bg-hover ring-1 ring-line-subtle" />
        </div>
        {count === 0 && <p className="px-2 py-3 text-ui text-fg-muted">{empty}</p>}
        <div aria-hidden className="mt-2 flex items-center gap-3 border-t border-line px-2 pt-2.5 text-ui-xs text-fg-subtle select-none">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> move
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd> open
          </span>
          <span className="flex items-center gap-1">
            <Kbd>esc</Kbd> close
          </span>
        </div>
      </m.div>
    </MotionFeatures>
  )
}
