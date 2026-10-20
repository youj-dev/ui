'use client'

import { useState } from 'react'
import { SlidingIndicator } from '@youj/motion'
import { PencilIcon, SearchIcon, SparklesIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../components/ui/input-group'
import { cn } from '../../../lib/utils'
import { COPY, GROUPS, USER, type Chat } from './data'

/* The chat list: the workspace, New chat, a search over titles, and the
 * chats grouped Pinned / Today / Previous 7 days. The groups' rows sit in one
 * container, so the highlight glides from any chat to any other, across the
 * group labels. The open chat is aria-current. */

interface ChatSidebarProps {
  chats: Chat[]
  activeId: string | null
  onOpen: (id: string | null) => void
  className?: string
}

export function ChatSidebar({ chats, activeId, onOpen, className }: ChatSidebarProps) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const shown = chats.filter((c) => c.title.toLowerCase().includes(q))

  return (
    <div className={cn('flex min-h-0 flex-col gap-3 bg-chrome p-3 text-fg', className)}>
      <div className="flex h-control items-center gap-2.5 px-1">
        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-md bg-accent text-on-accent">
          <SparklesIcon size={15} strokeWidth={1.75} />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-ui font-semibold tracking-tight">{COPY.product}</span>
          <span className="truncate text-ui-xs text-fg-muted">{COPY.workspace}</span>
        </span>
      </div>

      <Button variant="outline" className="w-full justify-start" onClick={() => onOpen(null)} aria-current={activeId === null ? 'page' : undefined}>
        <PencilIcon size={15} strokeWidth={1.75} />
        {COPY.newChat}
      </Button>

      <InputGroup>
        <InputGroupAddon>
          <SearchIcon size={15} strokeWidth={1.75} />
        </InputGroupAddon>
        <InputGroupInput type="search" aria-label={COPY.search} placeholder={COPY.search} value={query} onChange={(e) => setQuery(e.target.value)} />
      </InputGroup>

      <nav aria-label={COPY.chats} className="yj-scrollbar -mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        <div className="relative isolate flex flex-col gap-px">
          {GROUPS.map((group) => {
            const items = shown.filter((c) => c.group === group.id)
            if (!items.length) return null
            return [
              <p key={group.id} className="px-2 pt-3 pb-1 text-ui-xs font-medium text-fg-muted first:pt-1">
                {group.label}
              </p>,
              ...items.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-current={c.id === activeId ? 'page' : undefined}
                  onClick={() => onOpen(c.id)}
                  className={cn(
                    'focus-ring flex h-control w-full min-w-0 items-center gap-2 rounded-md px-2 text-start text-ui transition-colors yj-duration-fast ease-standard',
                    c.id === activeId ? 'text-fg' : 'text-fg-muted hover:bg-hover hover:text-fg',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  <span className="shrink-0 font-mono text-ui-xs text-fg-muted tabular-nums">{c.when}</span>
                </button>
              )),
            ]
          })}
          <SlidingIndicator className="rounded-md bg-hover" />
        </div>
        {q && shown.length === 0 && (
          <p role="status" className="px-2 py-3 text-ui-sm text-fg-muted">
            {COPY.noMatch(query.trim())}
          </p>
        )}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-line px-1 pt-3">
        <Avatar className="size-7">
          <AvatarFallback className="text-ui-xs">{USER.initials}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-ui-sm font-medium">{USER.name}</span>
          <span className="truncate text-ui-xs text-fg-muted">{USER.team}</span>
        </span>
      </div>
    </div>
  )
}
