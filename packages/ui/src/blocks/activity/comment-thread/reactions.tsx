'use client'

import { useState, type ReactElement } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { Counter } from '@youj/motion'
import { SmilePlusIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn, listFormat } from '../../../lib/utils'
import { useDiscussionContext, type DiscussionContextValue } from './context'
import type { CommentThreadReaction } from './data'

/* Reactions: a pill per emoji with its count, pressed when it's yours. Turning
 * one on pops its emoji (the `settle` spring, the one allowed overshoot) and
 * rolls the count; a new emoji's pill pops in. Hover or focus names who
 * reacted. Reduced motion: the count changes in place. */

/** "you, Mara Okafor and Theo Lindqvist"; past three, "you, Mara Okafor and 3 others". */
export function whoReacted(by: readonly string[], ctx: Pick<DiscussionContextValue, 'user' | 'byId' | 'copy' | 'locale'>) {
  const others = by.filter((id) => id !== ctx.user.id).map((id) => ctx.byId.get(id)?.name ?? id)
  const names = by.includes(ctx.user.id) ? [ctx.copy.you, ...others] : others
  const shown = names.length > 3 ? [names[0]!, names[1]!, ctx.copy.others(names.length - 2)] : names
  return listFormat(ctx.locale, { type: 'conjunction' }).format(shown)
}

const pill =
  'inline-flex h-6 items-center gap-1 rounded-full border px-2 text-ui-sm tabular-nums transition-[background-color,border-color,color] yj-duration-fast ease-standard focus-ring'

function Pill({ reaction, onToggle }: { reaction: CommentThreadReaction; onToggle: (on: boolean) => void }) {
  const ctx = useDiscussionContext()
  const k = useYouj()
  const mine = reaction.by.includes(ctx.user.id)
  const [from] = useState(reaction.by.length)
  // Counts the times it was turned on here, so each one pops (and the first render doesn't).
  const [was, setWas] = useState(mine)
  const [pops, setPops] = useState(0)
  if (was !== mine) {
    setWas(mine)
    if (mine) setPops((n) => n + 1)
  }
  const name = ctx.copy.emojiNames[reaction.emoji] ?? reaction.emoji
  const who = whoReacted(reaction.by, ctx)
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            data-slot="reaction"
            aria-pressed={mine}
            aria-label={`${ctx.copy.reactionLabel(name, reaction.by.length)}: ${who}`}
            onClick={() => onToggle(!mine)}
            className={cn(
              pill,
              mine
                ? 'border-accent-line bg-accent-subtle text-accent-text'
                : 'border-line bg-surface text-fg-muted hover:border-line-strong hover:text-fg',
            )}
          />
        }
      >
        <m.span
          key={pops}
          aria-hidden
          className="text-ui leading-none"
          initial={pops && !k.reduced ? { scale: 1.5 } : false}
          animate={{ scale: 1 }}
          transition={k.spring('settle')}
        >
          {reaction.emoji}
        </m.span>
        <Counter aria-hidden mode="roll" value={reaction.by.length} from={from} inView={false} />
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{ctx.copy.reactedWith(who, name)}</TooltipContent>
    </Tooltip>
  )
}

/** The palette: one press reacts (or takes yours away) and closes it. */
export function ReactionPicker({
  mine,
  onPick,
  trigger,
}: {
  mine: readonly string[]
  onPick: (emoji: string, on: boolean) => void
  trigger?: ReactElement
}) {
  const { copy, palette } = useDiscussionContext()
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger ?? <Button variant="ghost" size="icon-xs" aria-label={copy.react} />}>
        <SmilePlusIcon size={14} />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={4} aria-label={copy.react} className="w-auto flex-row flex-wrap gap-0.5 own:p-1">
        {palette.map((emoji) => {
          const on = mine.includes(emoji)
          const name = copy.emojiNames[emoji] ?? emoji
          return (
            <Button
              key={emoji}
              variant="ghost"
              size="icon-sm"
              title={name}
              aria-label={name}
              aria-pressed={on}
              className="text-ui-lg aria-pressed:bg-accent-subtle"
              onClick={() => {
                onPick(emoji, !on)
                setOpen(false)
              }}
            >
              {emoji}
            </Button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

/** A comment's reactions, with a way to add one at the end. */
export function Reactions({ reactions, onReact }: { reactions: readonly CommentThreadReaction[]; onReact: (emoji: string, on: boolean) => void }) {
  const ctx = useDiscussionContext()
  const k = useYouj()
  // Emoji that were there from the start appear in place; one added later pops in.
  const [known] = useState(() => new Set(reactions.map((r) => r.emoji)))
  if (!reactions.length) return null
  const mine = reactions.filter((r) => r.by.includes(ctx.user.id)).map((r) => r.emoji)
  return (
    <MotionFeatures>
      <ul aria-label={ctx.copy.reactions} data-slot="reactions" className="mt-1.5 flex flex-wrap items-center gap-1">
        {reactions.map((reaction) => (
          <m.li
            key={reaction.emoji}
            className="flex"
            initial={known.has(reaction.emoji) || k.reduced ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={k.spring('settle')}
          >
            <Pill reaction={reaction} onToggle={(on) => onReact(reaction.emoji, on)} />
          </m.li>
        ))}
        <li className="flex">
          <ReactionPicker
            mine={mine}
            onPick={onReact}
            trigger={
              <button
                type="button"
                aria-label={ctx.copy.react}
                className={cn(pill, 'border-line-subtle text-fg-subtle hover:border-line hover:text-fg')}
              />
            }
          />
        </li>
      </ul>
    </MotionFeatures>
  )
}
