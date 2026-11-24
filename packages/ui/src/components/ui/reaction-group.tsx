'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useSoundCue, type Size } from '@youj/core'
import { useDirection, useLocale, useYouj } from '@youj/core/lib/youj/provider'
import { reactionGroupLabels, useComponentLabels } from '@youj/core/labels'
import { Collapse, Counter, PresenceItem, PresenceList } from '@youj/motion'
import { SmilePlusIcon } from '@youj/icons/components/youj/icons/smile-plus'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, listFormat } from '../../lib/utils'
import { Button } from './button'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Separator } from './separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

/* Emoji reactions under a comment, a message or a post: a pill per emoji with
 * how many reacted, pressed when you're one of them, and a button at the end
 * that offers emoji to react with. A press adds yours or takes it away at once:
 * a reaction nobody holds any more leaves, and a new one joins at the end.
 * `onReact` can return a promise, and if it rejects the press is undone and
 * the reason shows under the row. Hover, focus or a long press on touch names
 * the emoji and who reacted: you first, then the names the app gives, then
 * how many others.
 *
 * Motion: turning one on pops its emoji (the `settle` spring, the one allowed
 * overshoot) and rolls its count (Counter); pills join, leave and make room
 * through PresenceList. A press that fails shakes the pill back (a decaying
 * 4/3/2 px on the slow token, a plain Web Animation) while the reason grows
 * in under the row (Collapse). Reduced motion: the count changes in place,
 * with no pop, glide or shake, and the reason appears at once. */

/** One emoji's reactions. */
interface ReactionGroupItem {
  /** The emoji ("👍"). There's one item per emoji: it's the reaction's key. */
  emoji: string
  /** How many reacted with it, you included. */
  count: number
  /** Whether you're one of them: the pill shows pressed, and pressing it takes yours away. */
  reacted?: boolean
  /**
   * Who else reacted, by name, for the tooltip and screen readers ("You,
   * Mara and 3 others"). A few names are enough: the rest are counted from
   * `count`. Leave yourself out, since `reacted` says you're there.
   */
  by?: readonly string[]
  /** The emoji's name, spoken and shown in its tooltip. Default: the name of the choice with the same emoji, else the emoji itself. */
  label?: string
}

/** An emoji the add button offers, with the name it's spoken by. */
interface ReactionGroupChoice {
  emoji: string
  label: string
}

interface ReactionGroupProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onToggle'> {
  /** The reactions, controlled, in the order they show. */
  value?: readonly ReactionGroupItem[]
  /** The reactions to start from, uncontrolled. Default none. */
  defaultValue?: readonly ReactionGroupItem[]
  /** Fires with the reactions as each press changes them, and again when a press that failed is undone. */
  onValueChange?: (value: ReactionGroupItem[]) => void
  /**
   * Called as you react with an emoji (`reacted` true) or take yours away.
   * The change shows at once. Return a promise to keep it only if it
   * resolves: when it rejects (or this throws) the press is undone and the
   * reason shows. The emoji ignores presses while its promise runs.
   */
  onReact?: (emoji: string, reacted: boolean) => unknown
  /**
   * The emoji the add button offers, each a string or `{ emoji, label }` to
   * name it. Default 👍 👎 😄 🎉 😕 ❤️ 🚀 👀, named in the app's language
   * (core labels). `[]` leaves only `renderPicker`.
   */
  choices?: readonly (string | ReactionGroupChoice)[]
  /**
   * Your app's own emoji picker, under the choices. Call `pick` with an emoji
   * (and its name) to react with it, as a choice does; the panel closes.
   */
  renderPicker?: (pick: (emoji: string, label?: string) => void) => ReactNode
  /** The list's name for screen readers. Default "Reactions". */
  label?: string
  /**
   * Shown under the row, and announced, when `onReact` fails. Default
   * "Couldn’t save your reaction". A function gets what it rejected with:
   * `errorLabel={(error) => describe(error)}`.
   */
  errorLabel?: string | ((error: unknown) => string)
  /** `sm` for a dense row such as a chat message; the default sits under a comment or a post. */
  size?: Extract<Size, 'sm' | 'default'>
  /** The reactions still show and name who reacted, but can't be changed, and the add button goes. */
  disabled?: boolean
  /** With sound on (`YoujProvider`’s `sound`), reacting plays `toggleOn`, taking yours away `toggleOff`, and a failure `error`. `false` keeps it silent. Default true. */
  sound?: boolean
}

/** The add button's emoji unless the app gives its own. */
const CHOICES = ['👍', '👎', '😄', '🎉', '😕', '❤️', '🚀', '👀']

/** The default choices' names in the labels, by the emoji without its variation selector. */
const NAMED = {
  '👍': 'reactionGroupThumbsUp',
  '👎': 'reactionGroupThumbsDown',
  '😄': 'reactionGroupLaugh',
  '🎉': 'reactionGroupHooray',
  '😕': 'reactionGroupConfused',
  '❤': 'reactionGroupHeart',
  '🚀': 'reactionGroupRocket',
  '👀': 'reactionGroupEyes',
} as const
type NamedKey = (typeof NAMED)[keyof typeof NAMED]

const NONE: readonly ReactionGroupItem[] = []
const IDLE: ReadonlySet<string> = new Set()

/** An emoji's identity: without U+FE0F (the variation selector), so ❤ and ❤️ are one reaction. */
const bare = (emoji: string) => emoji.replace(/\uFE0F/g, '')

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as PromiseLike<unknown> | null | undefined)?.then === 'function'

/** `items` with your reaction on `emoji`: one more on its pill, or a new pill at the end. */
function withYours(items: readonly ReactionGroupItem[], emoji: string, label?: string): ReactionGroupItem[] {
  const at = items.findIndex((item) => bare(item.emoji) === bare(emoji))
  if (at === -1) return [...items, { emoji, count: 1, reacted: true, ...(label ? { label } : {}) }]
  return items.map((item, i) => (i === at && !item.reacted ? { ...item, count: item.count + 1, reacted: true } : item))
}

/** `items` without your reaction on `emoji`; a pill nobody holds any more leaves. */
function withoutYours(items: readonly ReactionGroupItem[], emoji: string): ReactionGroupItem[] {
  return items.flatMap((item) => {
    if (bare(item.emoji) !== bare(emoji) || !item.reacted) return [item]
    return item.count > 1 ? [{ ...item, count: item.count - 1, reacted: false }] : []
  })
}

/** A press to undo if `onReact` fails: what it did, and its pill before and after (none when it joined or left), with its place. */
interface Press {
  emoji: string
  reacted: boolean
  before?: ReactionGroupItem
  after?: ReactionGroupItem
  index: number
}

const pillClass =
  'own:inline-flex items-center own:gap-1 own:rounded-chip own:border own:text-ui-sm own:tabular-nums whitespace-nowrap select-none transition-[background-color,border-color,color] yj-duration-fast ease-standard focus-ring'
const sizeClass = { sm: 'own:h-control-xs own:px-1.5', default: 'own:h-control-sm own:px-2' }

/* The emoji's pop, as two labels with the same keyframes: each press that
 * turns it on flips the label, and a changed label plays again. The span
 * stays mounted, since PresenceList starts its first items settled and Motion
 * would skip the first animation of anything mounted under them. */
const POP = { rest: { scale: 1 }, pop: { scale: [1.5, 1] }, popAgain: { scale: [1.5, 1] } }

function ReactionPill({
  item,
  name,
  who,
  spoken,
  pops,
  pending,
  disabled,
  size,
  onPress,
}: {
  item: ReactionGroupItem
  name: string
  who: string
  spoken: string
  pops: number
  pending: boolean
  disabled: boolean
  size: Extract<Size, 'sm' | 'default'>
  onPress: () => void
}) {
  const k = useYouj()
  const whoId = useId()
  // The count it first showed: later changes roll from there, never from 0.
  const [from] = useState(item.count)
  return (
    <>
      <Tooltip longPress>
        <TooltipTrigger
          render={
            <button
              type="button"
              data-slot="reaction-group-item"
              data-yj-emoji={bare(item.emoji)}
              aria-pressed={!!item.reacted}
              aria-label={spoken}
              aria-describedby={who ? whoId : undefined}
              aria-busy={pending || undefined}
              aria-disabled={disabled || undefined}
              onClick={() => {
                if (!disabled) onPress()
              }}
              className={cn(
                pillClass,
                sizeClass[size],
                'own:border-line own:bg-surface own:text-fg-muted',
                'aria-pressed:border-accent-line aria-pressed:bg-accent-subtle aria-pressed:text-accent-text',
                !disabled && 'not-aria-pressed:hover:border-line-strong not-aria-pressed:hover:text-fg',
                'aria-busy:cursor-progress aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
              )}
            />
          }
        >
          {/* `pops` counts the times it was turned on here; one that joins turned on (a pick) pops as it arrives. */}
          <m.span
            aria-hidden
            data-slot="reaction-group-emoji"
            className={cn('own:leading-none', size === 'sm' ? 'own:text-ui' : 'own:text-ui-lg')}
            variants={POP}
            initial={pops && !k.reduced ? { scale: 1.5 } : false}
            animate={!pops || k.reduced ? 'rest' : pops % 2 ? 'pop' : 'popAgain'}
            transition={k.spring('settle')}
          >
            {item.emoji}
          </m.span>
          <Counter aria-hidden mode="roll" value={item.count} from={from} inView={false} data-slot="reaction-group-count" />
        </TooltipTrigger>
        <TooltipContent className="flex-col items-start gap-0.5">
          <span>{name}</span>
          {who && <span className="own:font-normal">{who}</span>}
        </TooltipContent>
      </Tooltip>
      {who && (
        <span id={whoId} hidden>
          {who}
        </span>
      )}
    </>
  )
}

function ReactionGroup({
  value: valueProp,
  defaultValue = NONE,
  onValueChange,
  onReact,
  choices = CHOICES,
  renderPicker,
  label,
  errorLabel,
  size = 'default',
  disabled = false,
  sound = true,
  className,
  ...props
}: ReactionGroupProps) {
  const labels = useComponentLabels(reactionGroupLabels)
  const k = useYouj()
  const cue = useSoundCue()
  const locale = useLocale()
  const rtl = useDirection() === 'rtl'
  const [items, setItems] = useControllableState(valueProp, defaultValue)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(IDLE)
  const [pops, setPops] = useState<Readonly<Record<string, number>>>({})
  const { announce, announcer } = useAnnouncer()
  const root = useRef<HTMLDivElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  // The reactions as the last change left them, so an undo that lands later starts from what's there then.
  const latest = useRef(items)
  // Emoji whose `onReact` promise is running; the state copy drives aria-busy.
  const busy = useRef(new Set<string>())
  // Set by a press for the render it causes: where focus goes when the focused pill leaves, and which pill shakes.
  const refocus = useRef<number | null>(null)
  const shake = useRef<string | null>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    latest.current = items
  }, [items])

  const shown = items.filter((item) => item.count > 0)
  const offered = choices.map((choice) => (typeof choice === 'string' ? { emoji: choice, label: undefined } : choice))

  /** An emoji's name: its own label, the choice's, the built-in one, else the emoji. */
  const nameOf = (emoji: string, own?: string) => {
    if (own) return own
    const choice = offered.find((c) => c.label && bare(c.emoji) === bare(emoji))
    if (choice?.label) return choice.label
    const key = (NAMED as Record<string, NamedKey | undefined>)[bare(emoji)]
    return key ? labels[key] : emoji
  }

  /** "You, Mara and 3 others": you first, the names the app gave, then how many more; at most three parts. */
  const whoReacted = (item: ReactionGroupItem) => {
    const known = [...(item.reacted ? [labels.chatYou] : []), ...(item.by ?? [])].slice(0, item.count)
    if (known.length === 0) return ''
    const names = known.length + (item.count > known.length ? 1 : 0) > 3 ? known.slice(0, 2) : known
    const rest = item.count - names.length
    return listFormat(locale, { type: 'conjunction' }).format(rest > 0 ? [...names, labels.reactionGroupOthers(rest)] : names)
  }

  // After the render a press caused: focus moves on from a pill that left, and a failed one shakes.
  useEffect(() => {
    const at = refocus.current
    const failed = shake.current
    refocus.current = null
    shake.current = null
    if (at === null && failed === null) return
    // Pills on their way out are inert: only the ones staying count.
    const pills = [...(root.current?.querySelectorAll<HTMLButtonElement>('li:not([inert]) > [data-slot=reaction-group-item]') ?? [])]
    if (at !== null) (pills[Math.min(at, pills.length - 1)] ?? addButton.current)?.focus()
    if (failed === null || k.reduced) return
    const el = pills.find((pill) => pill.dataset.yjEmoji === failed) ?? addButton.current
    if (!el?.animate) return
    // A plain Web Animation, as AsyncFeedback's error: 4, 3, 2 px and home.
    const easing = `cubic-bezier(${k.ease('standard').join(',')})` // youj-allow: the standard ease token, serialized for WAAPI
    el.animate(
      [0, -4, 4, -3, 3, -2, 0].map((x) => ({ transform: `translateX(${x}px)`, easing })),
      { duration: k.ms('slow') },
    )
  })

  const commit = (next: ReactionGroupItem[]) => {
    latest.current = next
    setItems(next)
    onValueChange?.(next)
  }

  /** Forgets an emoji's pops once its pill has gone, so one that comes back from elsewhere arrives still. */
  const forget = (key: string) =>
    setPops((p) => {
      if (!(key in p)) return p
      const { [key]: _gone, ...rest } = p
      return rest
    })

  /** Puts back what a press changed, if nothing since has changed it again. */
  const undo = (press: Press) => {
    const now = latest.current
    const at = now.findIndex((item) => bare(item.emoji) === bare(press.emoji))
    const item = now[at]
    if (item && item === press.after) {
      // Untouched since: it gets back exactly what it had, or goes if the press brought it.
      commit(press.before ? now.map((other, i) => (i === at ? press.before! : other)) : now.filter((_, i) => i !== at))
      if (!press.before) forget(bare(press.emoji))
    } else if (!item && !press.after && press.before) {
      // It left with the press: back in its place.
      commit([...now.slice(0, press.index), press.before, ...now.slice(press.index)])
    } else if (item && !!item.reacted === press.reacted) {
      // Others' reactions changed it since: only yours is taken back (or put back).
      commit(press.reacted ? withoutYours(now, press.emoji) : withYours(now, press.emoji))
    }
  }

  const fail = (press: Press, thrown: unknown) => {
    undo(press)
    shake.current = bare(press.emoji)
    setError(typeof errorLabel === 'function' ? errorLabel(thrown) : (errorLabel ?? labels.reactionGroupFailed))
    if (sound) cue('error')
  }

  const settle = (key: string) => {
    busy.current.delete(key)
    setPending(new Set(busy.current))
  }

  /** Your reaction on `emoji` on if it's off, off if it's on: at once, then through `onReact`. */
  const toggle = (emoji: string, choiceLabel?: string, fromPanel = false) => {
    const key = bare(emoji)
    if (disabled || busy.current.has(key)) return
    const now = latest.current
    const index = now.findIndex((item) => bare(item.emoji) === key)
    const before = now[index]
    const reacted = !before?.reacted
    const leaves = !reacted && !!before && before.count <= 1
    const next = reacted ? withYours(now, emoji, choiceLabel) : withoutYours(now, emoji)
    const after = next.find((item) => bare(item.emoji) === key)
    const press: Press = { emoji: before?.emoji ?? emoji, reacted, before, after, index }
    setError(null)
    commit(next)
    if (reacted) setPops((p) => ({ ...p, [key]: (p[key] ?? 0) + 1 }))
    else if (leaves) forget(key)
    if (sound) cue(reacted ? 'toggleOn' : 'toggleOff')
    // A pill's own press is heard as its pressed state; a choice in the panel, or a pill that leaves, is announced.
    const name = nameOf(press.emoji, before?.label ?? choiceLabel)
    if (fromPanel || leaves) announce(reacted ? labels.added(name) : labels.removed(name))
    if (leaves && document.activeElement instanceof HTMLElement && document.activeElement.dataset.yjEmoji === key) {
      refocus.current = shown.findIndex((item) => bare(item.emoji) === key)
    }
    let result: unknown
    try {
      result = onReact?.(press.emoji, reacted)
    } catch (thrown) {
      fail(press, thrown)
      return
    }
    if (!isThenable(result)) return
    busy.current.add(key)
    setPending(new Set(busy.current))
    result.then(
      () => {
        if (mounted.current) settle(key)
      },
      (thrown: unknown) => {
        if (!mounted.current) return
        settle(key)
        fail(press, thrown)
      },
    )
  }

  const pick = (emoji: string, pickedLabel?: string) => {
    setOpen(false)
    toggle(emoji, pickedLabel, true)
  }

  // Arrow keys move between the choices (by a row up and down), Home and End to the ends.
  const onChoicesKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[data-slot=reaction-group-choice]')]
    const at = buttons.indexOf(event.target as HTMLButtonElement)
    if (at === -1) return
    const row = buttons.filter((button) => button.offsetTop === buttons[0]!.offsetTop).length
    const [back, forward] = rtl ? ['ArrowRight', 'ArrowLeft'] : ['ArrowLeft', 'ArrowRight']
    const steps: Record<string, number> = { [back]: -1, [forward]: 1, ArrowUp: -row, ArrowDown: row }
    const to = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : steps[event.key] === undefined ? null : at + steps[event.key]!
    if (to === null) return
    event.preventDefault()
    buttons[Math.max(0, Math.min(to, buttons.length - 1))]?.focus()
  }

  return (
    <div
      ref={root}
      {...props}
      data-slot="reaction-group"
      data-size={size}
      data-disabled={disabled ? '' : undefined}
      className={cn('own:flex own:min-w-0 flex-col', className)}
    >
      <MotionFeatures>
        {(shown.length > 0 || !disabled) && (
          <TooltipProvider>
            <PresenceList
              as="ul"
              data-slot="reaction-group-list"
              aria-label={label ?? labels.reactionGroupLabel}
              className="own:flex own:flex-wrap items-center own:gap-1"
            >
              {shown.map((item, index) => {
                const key = bare(item.emoji)
                const name = nameOf(item.emoji, item.label)
                return (
                  <PresenceItem as="li" key={key} aria-setsize={shown.length} aria-posinset={index + 1} className="own:flex">
                    <ReactionPill
                      item={item}
                      name={name}
                      who={whoReacted(item)}
                      spoken={labels.reactionGroupItem(name, item.count)}
                      pops={pops[key] ?? 0}
                      pending={pending.has(key)}
                      disabled={disabled}
                      size={size}
                      onPress={() => toggle(item.emoji)}
                    />
                  </PresenceItem>
                )
              })}
              {/* A list holds only <li>s (axe list), so the add button is its last item; the pills give their own place in the set. */}
              {!disabled && (
                <PresenceItem as="li" key={'\u0000add'} className="own:flex">
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger
                      render={
                        <button
                          ref={addButton}
                          type="button"
                          data-slot="reaction-group-add"
                          aria-label={labels.reactionGroupAdd}
                          className={cn(
                            pillClass,
                            sizeClass[size],
                            'own:border-line-subtle own:bg-transparent own:text-fg-subtle hover:border-line hover:text-fg own:data-popup-open:border-line data-popup-open:text-fg',
                          )}
                        />
                      }
                    >
                      <SmilePlusIcon size={size === 'sm' ? 14 : 16} />
                    </PopoverTrigger>
                    <PopoverContent
                      side="top"
                      align="start"
                      sideOffset={4}
                      aria-label={labels.reactionGroupAdd}
                      data-slot="reaction-group-panel"
                      className="w-auto own:gap-1 own:p-1"
                    >
                      {offered.length > 0 && (
                        <div
                          data-slot="reaction-group-choices"
                          className="own:flex max-w-[calc(var(--spacing-control-sm)*8+--spacing(3.5))] flex-wrap gap-0.5"
                          onKeyDown={onChoicesKeyDown}
                        >
                          {offered.map((choice) => {
                            const name = nameOf(choice.emoji, choice.label)
                            const mine = !!shown.find((item) => bare(item.emoji) === bare(choice.emoji))?.reacted
                            return (
                              <Button
                                key={bare(choice.emoji)}
                                variant="ghost"
                                size="icon-sm"
                                sound={false}
                                data-slot="reaction-group-choice"
                                aria-pressed={mine}
                                aria-label={name}
                                title={name}
                                onClick={() => pick(choice.emoji, choice.label)}
                                className="text-ui-lg own:aria-pressed:bg-accent-subtle"
                              >
                                {choice.emoji}
                              </Button>
                            )
                          })}
                        </div>
                      )}
                      {renderPicker && (
                        <>
                          {offered.length > 0 && <Separator />}
                          {renderPicker(pick)}
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </PresenceItem>
              )}
            </PresenceList>
          </TooltipProvider>
        )}
      </MotionFeatures>
      <Collapse open={!!error}>
        <p role="alert" data-slot="reaction-group-error" className="own:pt-1.5 own:text-ui-sm own:font-medium own:text-danger">
          {error}
        </p>
      </Collapse>
      {announcer}
    </div>
  )
}

export { ReactionGroup, type ReactionGroupChoice, type ReactionGroupItem, type ReactionGroupProps }
