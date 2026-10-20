'use client'

import { chatMessageListLabels } from '@youj/core/labels'
import {
  Children,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { AnimatePresence, animate, m, useIsPresent, useMotionValue, type AnimationPlaybackControls } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { ArrowDownIcon } from '@youj/icons/components/youj/icons/arrow-down'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useLiveRegion } from '../../../hooks/use-announcer'
import { cn } from '../../../lib/utils'
import { Button } from '../button'
import { ScrollArea } from '../scroll-area'
import { ChatListContext, ChatScrollContext, type ChatListContextValue, type ChatMessageListHandle } from './chat-context'

/* The conversation's scroll container.
 * - Sticks to the bottom while an answer streams: as the content grows, the
 *   view glides after it on the smooth spring (retargeting with its velocity
 *   as each line lands), and a resize (the prompt growing) keeps the bottom
 *   in place. Scroll up, by wheel, touch, keys or the scrollbar, and it lets
 *   go at once; scroll back to the bottom and it holds again. Sending a
 *   message brings you back down.
 * - Scrolled up, a "Jump to latest" button rises in above the input, with a
 *   dot when something new arrived below. It glides you down and hands focus
 *   to the conversation, so a keyboard user isn't dropped when it goes.
 * - Groups consecutive messages by author: the list marks each message's
 *   place in its group (data-group, data-continued) and the latest message
 *   (data-latest); ChatMessage styles itself from those.
 * - New messages enter through motion's PresenceList (fade down a few px,
 *   the rest glide), removed ones fade in place. `animate={false}` renders
 *   children as they are, for a virtualizer, which positions rows itself;
 *   useChatMessageList().viewport is its scroll element.
 * - Live regions done right: the log itself is aria-live="off", because a
 *   streaming answer would otherwise be read token by token. Messages speak
 *   through the list instead: "Youj is responding…" once, the whole answer
 *   when it's complete, and failures assertively.
 * Reduced motion: following, jumping and entering are instant. */

/** How close to the bottom still counts as at the bottom, in px. */
const AT_BOTTOM = 48

export interface ChatMessageListProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** ChatMessages (keyed), and anything else in the flow: a typing indicator, suggestions. */
  children?: ReactNode
  /** Names the conversation for assistive tech. Default "Conversation". */
  'aria-label'?: string
  /** Animate messages in and out. Turn it off for a virtualizer. Default true. */
  animate?: boolean
  /** Classes for the column the messages sit in (width, padding). */
  contentClassName?: string
  /** The jump button's label. Default "Jump to latest". */
  jumpLabel?: string
}

/** The surrounding ChatMessageList's scrolling: `scrollToBottom()`, and its `viewport` once mounted. */
export function useChatMessageList(): ChatMessageListHandle {
  const handle = useContext(ChatScrollContext)
  if (!handle) throw new Error('useChatMessageList must be used inside a ChatMessageList.')
  return handle
}

function ChatMessageList({
  children,
  'aria-label': label,
  animate: animated = true,
  contentClassName,
  jumpLabel,
  className,
  ref,
  ...props
}: ChatMessageListProps) {
  const k = useYouj()
  const labels = useComponentLabels(chatMessageListLabels)
  label ??= labels.chatConversation
  jumpLabel ??= labels.chatJumpToLatest
  const root = useRef<HTMLDivElement | null>(null)
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    },
    [ref],
  )
  const content = useRef<HTMLDivElement>(null)
  const { politeRef, assertiveRef, announce } = useLiveRegion()
  const settled = useRef(false)

  const getViewport = useCallback(() => root.current?.querySelector<HTMLElement>('[data-slot=scroll-area-viewport]') ?? null, [])

  /* ── Sticking to the bottom ───────────────────────────────────────────── */

  const stuck = useRef(true)
  const [atBottom, setAtBottom] = useState(true)
  const [unseen, setUnseen] = useState(false)
  const scrollY = useMotionValue(0)
  const glide = useRef<AnimationPlaybackControls | null>(null)
  /** The last scrollTop we wrote, to tell our scrolls from the reader's. */
  const written = useRef<number | null>(null)
  /* Only the reader lets go of the bottom. A scroll they didn't make (the
   * browser clamping scrollTop as content shrinks, scroll anchoring, a font
   * swap) must not, even when content has grown by the time it's reported.
   * Wheel, touch, pointer and keys mark intent; our next write clears it. */
  const intent = useRef(false)
  const reduced = useRef(k.reduced)
  const spring = useRef(k.spring('smooth'))
  reduced.current = k.reduced
  spring.current = k.spring('smooth')

  const stopGlide = useCallback(() => {
    glide.current?.stop()
    glide.current = null
  }, [])

  const write = useCallback((top: number) => {
    const viewport = getViewport()
    if (!viewport) return
    viewport.scrollTop = top
    written.current = viewport.scrollTop
    intent.current = false
  }, [getViewport])

  useEffect(() => scrollY.on('change', write), [scrollY, write])

  const scrollToBottom = useCallback(
    (behavior: 'smooth' | 'instant' = 'smooth') => {
      const viewport = getViewport()
      if (!viewport) return
      stuck.current = true
      const end = viewport.scrollHeight - viewport.clientHeight
      if (behavior === 'instant' || reduced.current) {
        stopGlide()
        scrollY.jump(end)
        write(end)
        return
      }
      // A glide in flight retargets and keeps its velocity; otherwise it starts from here.
      if (!glide.current) scrollY.jump(viewport.scrollTop)
      glide.current = animate(scrollY, end, { ...spring.current, onComplete: () => (glide.current = null) })
    },
    [getViewport, scrollY, stopGlide, write],
  )

  useLayoutEffect(() => {
    const viewport = getViewport()
    const column = content.current
    if (!viewport || !column) return
    const measure = () => {
      const bottom = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= AT_BOTTOM
      setAtBottom(bottom)
      if (bottom) setUnseen(false)
    }

    // New content: follow it if stuck, otherwise note there's something below.
    let first = true
    const grew = new ResizeObserver(() => {
      if (stuck.current) scrollToBottom(first ? 'instant' : 'smooth')
      else setUnseen(true)
      first = false
      measure()
    })
    grew.observe(column)
    // The viewport resizing (a window, the prompt growing) keeps the bottom where it is.
    const resized = new ResizeObserver(() => {
      if (stuck.current) scrollToBottom('instant')
      measure()
    })
    resized.observe(viewport)

    const onScroll = () => {
      const ours = written.current !== null && Math.abs(viewport.scrollTop - written.current) < 1
      if (!ours) {
        written.current = null
        const bottom = viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= AT_BOTTOM
        if (bottom) stuck.current = true
        else if (intent.current) {
          // The reader moved away from the bottom: let go.
          stuck.current = false
          stopGlide()
        } else if (stuck.current) scrollToBottom('smooth')
      }
      measure()
    }
    const mark = () => {
      intent.current = true
    }
    // Scrolling up lets go at once, before the scroll lands.
    const letGo = () => {
      mark()
      if (viewport.scrollHeight <= viewport.clientHeight) return
      stuck.current = false
      stopGlide()
    }
    const onWheel = (event: WheelEvent) => (event.deltaY < 0 ? letGo() : mark())
    const onKey = (event: KeyboardEvent) => (['ArrowUp', 'PageUp', 'Home'].includes(event.key) ? letGo() : mark())
    const onTouch = () => {
      mark()
      stopGlide()
    }
    // The scrollbar is outside the viewport, in the root: a drag on it is the reader too.
    const scroller = root.current
    viewport.addEventListener('scroll', onScroll, { passive: true })
    viewport.addEventListener('wheel', onWheel, { passive: true })
    viewport.addEventListener('touchmove', onTouch, { passive: true })
    viewport.addEventListener('keydown', onKey)
    scroller?.addEventListener('pointerdown', mark)
    scrollToBottom('instant')
    return () => {
      grew.disconnect()
      resized.disconnect()
      stopGlide()
      viewport.removeEventListener('scroll', onScroll)
      viewport.removeEventListener('wheel', onWheel)
      viewport.removeEventListener('touchmove', onTouch)
      viewport.removeEventListener('keydown', onKey)
      scroller?.removeEventListener('pointerdown', mark)
    }
  }, [getViewport, scrollToBottom, stopGlide])

  const jump = () => {
    scrollToBottom('smooth')
    // The button is about to go: hand focus to the conversation, not to <body>.
    getViewport()?.focus({ preventScroll: true })
  }

  /* ── Grouping ─────────────────────────────────────────────────────────── */

  const lastSent = useRef<Element | null>(null)
  const regroup = useCallback(() => {
    const column = content.current
    if (!column) return
    // Messages on their way out (inert) no longer count.
    const messages = [...column.querySelectorAll<HTMLElement>('[data-slot=chat-message]')].filter((m) => !m.closest('[inert]'))
    let start = 0
    messages.forEach((message, index) => {
      const author = message.dataset.author
      const next = messages[index + 1]
      const continues = index > start
      const ends = !next || !author || next.dataset.author !== author
      const size = index - start + 1
      const position = ends ? (size === 1 ? null : 'end') : continues ? 'middle' : 'start'
      mark(message, 'data-group', position)
      mark(message, 'data-continued', continues ? '' : null)
      mark(message.closest('[data-slot=chat-message-list-item]'), 'data-continued', continues ? '' : null)
      mark(message, 'data-latest', next ? null : '')
      if (ends) start = index + 1
    })
    // You sent something (perhaps with the reply's placeholder right behind it): bring it into view.
    let sent: HTMLElement | null = null
    for (let i = messages.length - 1; i >= 0 && !sent; i--) if (messages[i]!.dataset.role === 'user') sent = messages[i]!
    if (sent !== lastSent.current && settled.current && sent) scrollToBottom('smooth')
    lastSent.current = sent
  }, [scrollToBottom])

  const { keys, slots, structure } = useSlots(children)
  // biome-ignore lint/correctness/useExhaustiveDependencies: regroups when the messages present change (structure), not with their text; structure is a trigger the effect never reads
  useLayoutEffect(regroup, [regroup, structure])

  useEffect(() => {
    const column = content.current
    if (!column) return
    // Messages that arrive, leave or change author without this list re-rendering (a virtualizer, an exit finishing).
    const isMessage = (node: Node) => node instanceof Element && (node.matches('[data-slot=chat-message]') || node.querySelector('[data-slot=chat-message]') !== null)
    const observer = new MutationObserver((records) => {
      if (records.some((r) => r.type === 'attributes' || [...r.addedNodes, ...r.removedNodes].some(isMessage))) regroup()
    })
    observer.observe(column, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-author'] })
    return () => observer.disconnect()
  }, [regroup])

  /* ── Announcements ────────────────────────────────────────────────────── */

  useEffect(() => {
    settled.current = true
  }, [])

  const context = useMemo<ChatListContextValue>(
    () => ({
      announce: (message, politeness = 'polite') => announce(message, { assertive: politeness === 'assertive' }),
      isSettled: () => settled.current,
    }),
    [announce],
  )

  // Children lay out before this list's refs attach, so a virtualizer inside
  // gets the viewport one render later, through its own context: messages,
  // which read only the list context above, don't re-render for it.
  const [viewport, setViewport] = useState<HTMLElement | null>(null)
  useLayoutEffect(() => setViewport(getViewport()), [getViewport])
  const scroll = useMemo<ChatMessageListHandle>(() => ({ scrollToBottom, viewport }), [scrollToBottom, viewport])

  // The animated list renders again only when messages come, go or move.
  // PresenceList re-measures every item each time it renders, so a token
  // arriving as a new `content` string mustn't re-render it: each child
  // renders through its own slot, which updates alone.
  // biome-ignore lint/correctness/useExhaustiveDependencies: structure is the keys, joined; it stands for keys so a token arriving as new content doesn't rebuild the list
  const presence = useMemo(
    () => (
      <PresenceList as="div" className="own:flex flex-col">
        {keys.map((key) => (
          <PresenceItem key={key} as="div" data-slot="chat-message-list-item" className="group/item pt-6 first:pt-0 data-continued:pt-1.5">
            <Slot entry={slots.get(key)!} />
          </PresenceItem>
        ))}
      </PresenceList>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- structure is the keys, joined; it stands for keys so a token arriving as new content doesn't rebuild the list
    [structure, slots],
  )
  const items = animated ? presence : children

  return (
    <MotionFeatures>
      <div
        ref={setRoot}
        data-slot="chat-message-list"
        data-reduced-motion={k.reduced || undefined}
        className={cn('relative own:flex min-h-0 flex-1 flex-col', className)}
        {...props}
      >
        <ScrollArea aria-label={label} className="min-h-0 flex-1">
          <div
            ref={content}
            role="log"
            aria-live="off"
            className={cn('mx-auto own:flex w-full max-w-3xl flex-col px-4 pt-6 pb-10', contentClassName)}
          >
            <ChatListContext.Provider value={context}>
              <ChatScrollContext.Provider value={scroll}>{items}</ChatScrollContext.Provider>
            </ChatListContext.Provider>
          </div>
        </ScrollArea>
        <JumpToLatest visible={!atBottom} unseen={unseen} label={jumpLabel} onJump={jump} />
        <div ref={politeRef} data-slot="chat-message-list-status" role="status" aria-live="polite" className="sr-only" />
        <div ref={assertiveRef} data-slot="chat-message-list-alert" role="alert" aria-live="assertive" className="sr-only" />
      </div>
    </MotionFeatures>
  )
}

/* ── Slots ───────────────────────────────────────────────────────────────── */

interface SlotEntry {
  element: ReactNode
  listeners: Set<() => void>
}

/** Same component with shallowly equal props: re-rendering it would change nothing. */
function sameElement(a: ReactNode, b: ReactNode) {
  if (a === b) return true
  if (!isValidElement(a) || !isValidElement(b) || a.type !== b.type || a.key !== b.key) return false
  const pa = a.props as Record<string, unknown>
  const pb = b.props as Record<string, unknown>
  const names = Object.keys(pa)
  return names.length === Object.keys(pb).length && names.every((name) => Object.is(pa[name], pb[name]))
}

/** The children by key, each with its own subscription, so one changing child re-renders only its slot. */
function useSlots(children: ReactNode) {
  const [slots] = useState(() => new Map<string, SlotEntry>())
  const items = Children.toArray(children)
  const keys = items.map((child, index) => (isValidElement(child) && child.key !== null ? child.key : `.${index}`))
  // A new child is readable from its slot's first render; a changed one is handed over after commit (before paint).
  items.forEach((child, index) => {
    if (!slots.has(keys[index]!)) slots.set(keys[index]!, { element: child, listeners: new Set() })
  })
  useLayoutEffect(() => {
    items.forEach((child, index) => {
      const entry = slots.get(keys[index]!)!
      if (sameElement(entry.element, child)) return
      entry.element = child
      for (const listener of entry.listeners) listener()
    })
    // Forget children that are gone and whose slot has finished leaving.
    const present = new Set(keys)
    for (const [key, entry] of slots) if (!present.has(key) && entry.listeners.size === 0) slots.delete(key)
  })
  return { keys, slots, structure: keys.join('\u0000') }
}

function Slot({ entry }: { entry: SlotEntry }) {
  const subscribe = useCallback(
    (listener: () => void) => {
      entry.listeners.add(listener)
      return () => {
        entry.listeners.delete(listener)
      }
    },
    [entry],
  )
  const read = () => entry.element
  return useSyncExternalStore(subscribe, read, read)
}

/** Sets or removes an attribute the list owns, touching the DOM only when it changes. */
function mark(el: Element | null, name: string, value: string | null) {
  if (!el || el.getAttribute(name) === value) return
  if (value === null) el.removeAttribute(name)
  else el.setAttribute(name, value)
}

function JumpToLatest({ visible, unseen, label, onJump }: { visible: boolean; unseen: boolean; label: string; onJump: () => void }) {
  return (
    <AnimatePresence initial={false}>
      {visible && <JumpButton key="jump" unseen={unseen} label={label} onJump={onJump} />}
    </AnimatePresence>
  )
}

function JumpButton({ unseen, label, onJump }: { unseen: boolean; label: string; onJump: () => void }) {
  const k = useYouj()
  const present = useIsPresent()
  return (
    <m.div
      data-slot="chat-jump-to-latest"
      inert={!present || undefined}
      initial={k.reduced ? false : { opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: k.reduced ? { type: false } : k.tween('fast', 'enter') }}
      exit={k.reduced ? undefined : { opacity: 0, y: 6, scale: 0.96, transition: k.tween('fast', 'exit') }}
      className="pointer-events-none absolute inset-x-0 bottom-3 z-10 own:flex justify-center"
    >
      {/* Opaque over the conversation, hover included: the highlight is mixed into the popover surface. */}
      <Button
        variant="outline"
        size="sm"
        onClick={onJump}
        className="pointer-events-auto own:bg-overlay own:shadow-md own:hover:bg-[color-mix(in_oklab,var(--color-overlay),var(--color-fg)_6%)]"
      >
        <ArrowDownIcon size={14} strokeWidth={1.75} />
        {label}
        {/* Something new arrived below while you were reading. */}
        {unseen && <span aria-hidden className="own:-me-0.5 size-1.5 rounded-full bg-accent" />}
      </Button>
    </m.div>
  )
}

export { ChatMessageList }
