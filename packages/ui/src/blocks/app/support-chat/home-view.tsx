'use client'

import type { ReactNode, Ref } from 'react'
import { Stagger } from '@youj/motion'
import { MoonIcon, SendIcon } from '@youj/icons'
import { AvatarStack } from '../../../components/ui/avatar-stack'
import { Button } from '../../../components/ui/button'
import { ScrollArea } from '../../../components/ui/scroll-area'
import { cn } from '../../../lib/utils'
import { useSupportChat } from './context'
import type { SupportChatCopy, SupportMessage, SupportThread } from './data'
import { BotAvatar, PersonAvatar } from './conversation-parts'
import { HelpSearch } from './help-search'

/* The widget's front door. A band in the brand color says hello; the cards
 * below it (arriving one after another, Stagger) start a conversation with
 * the team's faces and how soon they reply, reopen a recent one (unread
 * counts included), and search the help center. With the team away, the
 * first card says when they're back. */

export interface Recent {
  id: string
  title: string
  preview: string
  when: string
  unread?: number
  thread: SupportThread | null
  from?: SupportMessage
}

const preview = (thread: SupportThread, copy: SupportChatCopy, product: string) => {
  const last = [...thread.messages].reverse().find((m) => m.from !== 'system')
  if (!last) return ''
  return `${last.from === 'user' ? copy.you : (last.agent?.first ?? product)}: ${last.text}`
}

/** The conversations as the home list shows them. */
export const toRecents = (threads: SupportThread[], copy: SupportChatCopy, product: string): Recent[] =>
  threads.map((t) => ({ id: t.id, title: t.title, preview: preview(t, copy, product), when: t.when, unread: t.unread, thread: t, from: t.messages.at(-1) }))

interface HomeViewProps {
  online: boolean
  recents: Recent[]
  /** Unread counts by conversation. */
  unread: Record<string, number>
  /** A conversation is under way: the main action continues it. */
  ongoing: boolean
  titleId: string
  startRef: Ref<HTMLButtonElement>
  onStart: () => void
  onOpen: (recent: Recent) => void
  onAsk: (question: string) => void
  close: ReactNode
}

export function HomeView({ online, recents, unread, ongoing, titleId, startRef, onStart, onOpen, onAsk, close }: HomeViewProps) {
  const { copy, brand, user, team } = useSupportChat()
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="relative border-b border-line bg-band px-5 pt-4 pb-16 text-fg">
        <div className="flex h-control-sm items-center justify-between">
          <span className="flex items-center gap-2 text-ui font-semibold tracking-tight">
            {brand.logo ?? (
              <span aria-hidden className="grid size-6 place-items-center rounded-md border border-line bg-surface text-ui-sm text-fg">
                {brand.name.charAt(0)}
              </span>
            )}
            {copy.homeTitle(brand.name)}
          </span>
          {close}
        </div>
        <h2 id={titleId} className="mt-8 flex flex-col text-2xl leading-tight font-semibold tracking-tight">
          <span className="text-fg-muted">{copy.hello(user.first)}</span>
          <span>{copy.helpPrompt}</span>
        </h2>
      </div>

      <Stagger inView={false} variant="rise" step="base" className="relative -mt-10 flex flex-col gap-3 px-3 pb-4">
        <section aria-label={copy.messageTeam} className="flex flex-col gap-3 rounded-xl border border-line bg-overlay p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <AvatarStack users={team} label={copy.supportTeam} />
            <div className="flex min-w-0 flex-col">
              <span className="text-ui font-medium text-fg">{online ? copy.teamHere : copy.teamAway}</span>
              <span className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
                {online ? <span aria-hidden className="size-1.5 rounded-full bg-success" /> : <MoonIcon size={12} strokeWidth={1.75} />}
                {online ? copy.replyTime : copy.backAt}
              </span>
            </div>
          </div>
          <Button ref={startRef} onClick={onStart} className="w-full justify-between">
            {ongoing ? copy.continueConversation : online ? copy.sendMessage : copy.leaveMessage}
            <SendIcon size={15} strokeWidth={1.75} className="rtl:-scale-x-100" />
          </Button>
        </section>

        {recents.length > 0 && (
          <section aria-labelledby={`${titleId}-recent`} className="flex flex-col gap-1 rounded-xl border border-line bg-overlay p-3 shadow-xs">
            <h3 id={`${titleId}-recent`} className="px-1 pt-1 pb-1 text-ui font-medium text-fg">
              {copy.recent}
            </h3>
            <ul className="-mx-1 flex flex-col">
              {recents.map((recent) => {
                const count = unread[recent.id] ?? 0
                const agent = recent.thread?.agent
                return (
                  <li key={recent.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(recent)}
                      aria-label={`${recent.title}. ${recent.preview}${count ? `. ${copy.unreadCount(count)}` : ''}`}
                      className="focus-ring flex w-full items-center gap-3 rounded-lg px-2 py-2 text-start transition-colors yj-duration-fast ease-standard hover:bg-hover"
                    >
                      {agent ? <PersonAvatar agent={agent} className="size-8" /> : <BotAvatar className="size-8" />}
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-baseline gap-2">
                          <span className={cn('truncate text-ui text-fg', count > 0 && 'font-semibold')}>{recent.title}</span>
                          <span className="ms-auto shrink-0 text-ui-xs text-fg-muted tabular-nums">{recent.when}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="truncate text-ui-sm text-fg-muted">{recent.preview}</span>
                          {count > 0 && (
                            <span className="ms-auto grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-danger px-1 text-ui-xs font-semibold text-on-accent tabular-nums">
                              {count}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <HelpSearch onAsk={onAsk} />
      </Stagger>
    </ScrollArea>
  )
}
