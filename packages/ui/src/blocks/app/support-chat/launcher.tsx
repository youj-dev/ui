'use client'

import type { Ref } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { useYouj } from '@youj/core'
import { ChevronDownIcon, IconSwap, MessageDotsIcon, XIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { PersonAvatar } from './conversation-parts'
import { useSupportChat } from './context'
import type { SupportMessage } from './data'

/* The way in. A round launcher in the corner whose chat bubble turns into a
 * chevron while the panel is open (IconSwap), with an unread count that pops
 * in on the settle spring. Unread replies also surface as a teaser above it:
 * the latest one, in the sender's name, rising in; open it and you land in
 * that conversation, or dismiss it. Reduced motion: both appear in place. */

interface LauncherProps {
  open: boolean
  unread: number
  controls: string
  onToggle: () => void
  ref?: Ref<HTMLButtonElement>
}

export function Launcher({ open, unread, controls, onToggle, ref }: LauncherProps) {
  const k = useYouj()
  const count = open ? 0 : unread
  const { copy } = useSupportChat()
  return (
    <Button
      ref={ref}
      aria-label={open ? copy.closeChat : copy.openChat(unread)}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls={open ? controls : undefined}
      onClick={onToggle}
      // shape: a chat launcher is a 56px circle, whatever the theme's radius: the shape people look for in a page's corner
      className="relative size-14 rounded-full p-0 shadow-lg [&_svg:not([class*='size-'])]:size-6"
    >
      <IconSwap from={MessageDotsIcon} to={ChevronDownIcon} active={open} transition="rotate" size={24} strokeWidth={1.75} />
      <AnimatePresence>
        {count > 0 && (
          <m.span
            key="badge"
            aria-hidden
            initial={k.reduced ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: k.reduced ? { type: false } : k.spring('settle') }}
            exit={k.reduced ? undefined : { scale: 0.4, opacity: 0, transition: k.tween('fast', 'exit') }}
            className="absolute -end-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-ui-xs font-semibold text-on-accent tabular-nums ring-2 ring-canvas"
          >
            {count}
          </m.span>
        )}
      </AnimatePresence>
    </Button>
  )
}

interface TeaserProps {
  message: SupportMessage
  onOpen: () => void
  onDismiss: () => void
}

/** The latest unread reply, floating above the launcher. */
export function Teaser({ message, onOpen, onDismiss }: TeaserProps) {
  const k = useYouj()
  const agent = message.agent!
  const { copy, brand } = useSupportChat()
  return (
    <m.div
      initial={k.reduced ? false : { opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: k.reduced ? { type: false } : k.spring('smooth') }}
      exit={k.reduced ? undefined : { opacity: 0, y: 8, scale: 0.97, transition: k.tween('fast', 'exit') }}
      className="relative w-72 origin-bottom-right rtl:origin-bottom-left max-w-[calc(100vw-2.5rem)]"
    >
      <button
        type="button"
        onClick={onOpen}
        className="focus-ring flex w-full gap-3 rounded-xl border border-line bg-overlay p-3 text-start shadow-lg transition-colors yj-duration-fast ease-standard hover:bg-[color-mix(in_oklab,var(--color-overlay),var(--color-fg)_3%)]"
      >
        <PersonAvatar agent={agent} className="size-8" />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-ui-sm text-fg-muted">
            <span className="font-medium text-fg">{agent.first}</span>
            {copy.teaserFrom(brand.name)}
          </span>
          <span className="line-clamp-2 text-ui text-fg">{message.text}</span>
        </span>
      </button>
      <Button
        variant="outline"
        size="icon-xs"
        aria-label={copy.dismiss}
        onClick={onDismiss}
        className="absolute -end-2 -top-2 bg-overlay shadow-sm"
      >
        <XIcon size={12} strokeWidth={2} />
      </Button>
    </m.div>
  )
}
