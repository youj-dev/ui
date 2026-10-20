'use client'

import type { ReactNode } from 'react'
import { Kbd, KbdGroup } from '@youj/react/components/ui/kbd'
import type { Folio } from '../use-folio'
import { LaterMenu } from './later-menu'

/* The keys at the foot of the desk, each a button too. When a key is used,
 * from the keyboard or a click, its cap presses in. */

const BUTTON =
  'flex h-control-sm items-center gap-2 rounded-lg px-2.5 text-ui whitespace-nowrap text-fg-muted transition-colors yj-duration-fast ease-standard focus-ring hover:bg-hover hover:text-fg aria-expanded:bg-hover aria-expanded:text-fg disabled:pointer-events-none disabled:opacity-45'

function Caps({ keys, label, pressed }: { keys: string[]; label: string; pressed: boolean }) {
  return (
    <>
      <KbdGroup>
        {keys.map((key) => (
          <Kbd
            key={key}
            data-pressed={pressed || undefined}
            className="min-w-5.5 transition-[translate,box-shadow,background-color,color] yj-duration-instant ease-standard data-pressed:translate-y-px data-pressed:bg-selected data-pressed:text-fg data-pressed:shadow-none"
          >
            {key}
          </Kbd>
        ))}
      </KbdGroup>
      <span>{label}</span>
    </>
  )
}

export function KeyLegend({ folio }: { folio: Folio }) {
  const { current, order, pressed } = folio
  const live = !!current && current.stack !== 'sent' && current.stack !== 'drafts'
  const key = (id: string, keys: string[], label: string, onPress: () => void, disabled: boolean): ReactNode => (
    <button key={id} type="button" aria-keyshortcuts={keys.join('+')} disabled={disabled} onClick={() => (folio.flash(id), onPress())} className={BUTTON}>
      <Caps keys={keys} label={label} pressed={pressed === id} />
    </button>
  )
  return (
    <div role="toolbar" aria-label="Triage" className="flex flex-wrap items-center justify-center gap-0.5">
      {key('move', ['J', 'K'], 'Move', () => folio.step(1), order.length < 2)}
      {key('done', ['E'], 'Done', () => current && folio.done(current), !current || current.stack === 'done' || current.stack === 'sent')}
      <LaterMenu
        folio={folio}
        trigger={
          <button type="button" aria-keyshortcuts="H" disabled={!live} className={BUTTON}>
            <Caps keys={['H']} label="Later" pressed={pressed === 'later'} />
          </button>
        }
      />
      {key('reply', ['R'], 'Reply', () => folio.setReplying(true), !live)}
      {key('delete', ['#'], 'Delete', () => current && folio.remove(current), !current || current.stack === 'trash')}
      <span aria-hidden className="mx-1 h-4 w-px bg-line" />
      {key('palette', ['⌘', 'K'], 'Commands', () => folio.setPalette(true), false)}
    </div>
  )
}
