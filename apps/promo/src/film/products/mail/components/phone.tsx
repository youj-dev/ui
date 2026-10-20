'use client'

import type { ReactNode } from 'react'
import { PageTransition } from '@youj/motion/interactions'
import { ArchiveIcon, ArrowLeftIcon, ClockIcon, ReplyIcon, TrashIcon } from '@youj/icons'
import { Button } from '@youj/react/components/ui/button'
import { STACK_NAMES } from '../styles'
import type { Folio } from '../use-folio'
import { DeskClear } from './desk-clear'
import { LaterMenu } from './later-menu'
import { LetterIndex } from './letter-index'
import { Margin } from './margin'
import { Sheet } from './sheet'
import { SearchField, StackNav } from './top-bar'

const ACTION = 'flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg text-ui-xs text-fg-muted transition-colors yj-duration-fast ease-standard focus-ring active:bg-hover disabled:opacity-45'

function Action({ icon, label, onPress, disabled }: { icon: ReactNode; label: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onPress} disabled={disabled} className={ACTION}>
      {icon}
      {label}
    </button>
  )
}

/** On a phone: the index first, with the stacks and search above it; a letter slides over it, with its actions at the foot. */
export function Phone({ folio }: { folio: Folio }) {
  const { current, reading, stack, order, query } = folio
  const letter = reading && current
  const live = !!current && current.stack !== 'sent' && current.stack !== 'drafts'
  return (
    <PageTransition routeKey={letter ? 'letter' : 'index'} variant="slide" direction={letter ? 'forward' : 'back'} className="h-full grid-rows-1">
      {letter ? (
        <section aria-label="Desk" className="flex h-full flex-col bg-transparent">
          <div className="flex h-12 shrink-0 items-center gap-1 border-b border-line bg-canvas px-2">
            <Button variant="ghost" size="sm" onClick={() => folio.setReading(false)}>
              <ArrowLeftIcon size={16} className="rtl:-scale-x-100" /> {STACK_NAMES[stack]}
            </Button>
          </div>
          <div ref={folio.refs.desk} className="min-h-0 flex-1 overflow-y-auto p-3 pb-6">
            <div className="rounded-xl border border-line bg-surface shadow-sm">
              <Sheet
                letter={letter}
                now={folio.now}
                query={query}
                replying={folio.replying}
                onReply={() => folio.setReplying(true)}
                onCancelReply={() => folio.setReplying(false)}
                onSend={(body) => folio.reply(letter, body)}
                onStar={(starred) => folio.star(letter, starred)}
                position={`${folio.position} of ${order.length}`}
              />
            </div>
            <Margin letter={letter} className="px-2 pt-6" />
          </div>
          <div role="toolbar" aria-label="Triage" className="grid shrink-0 grid-cols-4 border-t border-line bg-canvas px-2 pt-1.5 pb-2">
            <Action icon={<ArchiveIcon size={18} />} label="Done" onPress={() => folio.done(letter)} disabled={letter.stack === 'done'} />
            <LaterMenu
              folio={folio}
              trigger={
                <button type="button" disabled={!live} className={ACTION}>
                  <ClockIcon size={18} />
                  Later
                </button>
              }
            />
            <Action icon={<ReplyIcon size={18} />} label="Reply" onPress={() => folio.setReplying(true)} disabled={!live} />
            <Action icon={<TrashIcon size={18} />} label="Delete" onPress={() => folio.remove(letter)} disabled={letter.stack === 'trash'} />
          </div>
        </section>
      ) : (
        <section aria-label="Letters" className="flex h-full flex-col">
          <div className="flex flex-col gap-3 border-b border-line px-4 pt-3 pb-3">
            <StackNav folio={folio} />
            <SearchField folio={folio} className="w-full" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {stack === 'inbox' && !order.length && !query ? (
              <div className="px-5">
                <DeskClear folio={folio} />
              </div>
            ) : (
              <LetterIndex folio={folio} />
            )}
          </div>
        </section>
      )}
    </PageTransition>
  )
}
