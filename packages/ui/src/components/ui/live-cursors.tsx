'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, type ComponentProps, type CSSProperties, type RefObject } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { liveCursorsLabels, useComponentLabels } from '@youj/core/labels'
import { observeOnScreen } from '@youj/core/lib/youj/on-screen'
import { useLocale, useYouj } from '@youj/core/lib/youj/provider'
import { useLiveRegion } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { clamp, cn, initials, listFormat } from '../../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

/* Multiplayer presence for a collaborative surface. Transport-agnostic: the
 * app sends its own pointer (useLiveCursorsInput) and feeds everyone else's
 * back in as `users`; nothing here opens a socket.
 * - LiveCursors wraps the surface and draws each remote cursor over it: an
 *   arrow and a name tag in the person's color (the theme's chart palette,
 *   picked by id so everyone sees the same color), an optional chat bubble
 *   under the name, and their selection as tinted rectangles. Positions are
 *   fractions of the surface, so screens of any size agree.
 * - Motion: one rAF loop moves every cursor on the snappy spring between
 *   sparse updates (transforms only), and stops when they all rest or the
 *   surface is off screen. A cursor that hasn't moved for `idleAfter` fades
 *   out; one whose person leaves shrinks away. Reduced motion: cursors jump
 *   to each update and appear, idle and leave without fades.
 * - Access: the cursors are decorative (aria-hidden); a polite live region
 *   says who joined and who left. PresenceAvatars lists who is here as
 *   labeled buttons that follow a person's cursor. */

type LiveCursorStatus = 'viewing' | 'editing'

/** A rectangle on the surface, in fractions of its width and height. */
interface LiveCursorRect {
  x: number
  y: number
  width: number
  height: number
}

interface LiveCursorUser {
  /** Stable across updates: it keys the cursor and picks the color. */
  id: string
  name: string
  /** Where their pointer is, as a fraction of the surface's width: 0 the left edge, 1 the right. Leave `x` and `y` out while their pointer is elsewhere and the cursor goes. */
  x?: number
  /** Where their pointer is, as a fraction of the surface's height: 0 the top, 1 the bottom. */
  y?: number
  /** Any CSS color. Default: one of the theme's chart colors, chosen by `id`. */
  color?: string
  /** A chat bubble under the name: what they're typing or just said. */
  message?: string
  /** What they have selected, drawn as tinted rectangles. */
  selection?: readonly LiveCursorRect[]
  /** Shown in PresenceAvatars' tooltip. */
  status?: LiveCursorStatus
  /** An avatar image for PresenceAvatars. */
  src?: string
}

interface LiveCursorsProps extends ComponentProps<'div'> {
  /** Everyone else on the surface. Leave the local person out. */
  users: readonly LiveCursorUser[]
  /** The id of a person to follow: their cursor is scrolled into view as it moves. Pair it with PresenceAvatars' `following`. */
  following?: string | null
  /** Milliseconds without a move (or a new message) before a cursor fades out. `0` keeps every cursor. Default 10000. */
  idleAfter?: number
  /** Announce joins and leaves in a polite live region. Default true. */
  announce?: boolean
  /** Formats the announced lists of names. Default: the YoujProvider locale. */
  locale?: string
}

interface LiveCursorPosition {
  x: number
  y: number
}

interface LiveCursorsInputOptions {
  /** Milliseconds between two reports while the pointer moves: the last move always lands. Default 50. */
  throttle?: number
}

const PALETTE = 5
const DEFAULT_IDLE = 10_000
const DEFAULT_THROTTLE = 50
/** The integration step, in seconds, and the longest frame the loop accepts (a stall resumes from there, not from a jump). */
const STEP = 1 / 240
const MAX_FRAME = 1 / 20

/** The person's color: theirs, or a chart color chosen by id, so every screen agrees. */
function cursorColor(user: Pick<LiveCursorUser, 'id' | 'color'>) {
  if (user.color) return user.color
  // FNV-1a, then mixed, so ids that differ by a letter land apart.
  let hash = 0x811c9dc5
  for (const char of user.id) hash = Math.imul(hash ^ char.charCodeAt(0), 0x01000193)
  hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d)
  hash ^= hash >>> 12
  return `var(--color-chart-${((hash >>> 0) % PALETTE) + 1})`
}

const placed = (user: LiveCursorUser): user is LiveCursorUser & LiveCursorPosition => Number.isFinite(user.x) && Number.isFinite(user.y)

/** Black or white, whichever reads on the person's color (a fallback to the page's canvas where relative colors aren't supported). */
const INK = 'oklch(from var(--ui--live-cursor) calc((0.72 - l) * 100) 0 0)' // youj-allow: a relative color of the person's color, not a raw one
// The pills keep the person's hue but pull their lightness off the middle, so INK reads on them at 4.5:1: down to 0.54 under white, up to 0.72 under black.
const PILL = 'oklch(from var(--ui--live-cursor) calc(min(l, 0.54) + (max(l, 0.72) - min(l, 0.54)) * clamp(0, (l - 0.715) * 1000, 1)) c h)' // youj-allow: a relative color of the person's color, not a raw one
const TINT = 'color-mix(in oklab, var(--ui--live-cursor) 14%, transparent)'

interface Track {
  /** The target, in fractions of the surface. */
  tx: number
  ty: number
  /** Where the cursor is drawn, in px, and how fast it's going. */
  x: number
  y: number
  vx: number
  vy: number
  /** When the target or the message last changed (performance.now). */
  moved: number
  message?: string
  idle: boolean
}

/** One loop for every cursor: each spring follows its target, written straight to the element's transform. */
function useCursorEngine(users: readonly LiveCursorUser[], idleAfter: number) {
  const k = useYouj()
  const overlay = useRef<HTMLDivElement>(null)
  const elements = useRef(new Map<string, HTMLDivElement>())
  const tracks = useRef(new Map<string, Track>())
  const size = useRef({ width: 0, height: 0 })
  const live = useRef({ reduced: k.reduced, spring: k.spring('snappy'), onScreen: true, raf: 0, last: 0 })
  live.current.reduced = k.reduced
  live.current.spring = k.spring('snappy')

  const write = useCallback((id: string, track: Track) => {
    const el = elements.current.get(id)
    if (el) el.style.transform = `translate3d(${track.x}px, ${track.y}px, 0)`
  }, [])

  const frame = useCallback(
    (now: number) => {
      const L = live.current
      L.raf = 0
      const dt = Math.min((now - L.last) / 1000, MAX_FRAME)
      L.last = now
      const { width, height } = size.current
      const { stiffness, damping } = L.spring
      let moving = false
      for (const [id, t] of tracks.current) {
        const gx = t.tx * width
        const gy = t.ty * height
        if (L.reduced) {
          t.x = gx
          t.y = gy
          t.vx = t.vy = 0
        } else {
          for (let left = dt; left > 0; left -= STEP) {
            const h = Math.min(left, STEP)
            t.vx += (stiffness * (gx - t.x) - damping * t.vx) * h
            t.vy += (stiffness * (gy - t.y) - damping * t.vy) * h
            t.x += t.vx * h
            t.y += t.vy * h
          }
          if (Math.abs(gx - t.x) < 0.25 && Math.abs(gy - t.y) < 0.25 && Math.hypot(t.vx, t.vy) < 4) {
            t.x = gx
            t.y = gy
            t.vx = t.vy = 0
          } else moving = true
        }
        write(id, t)
      }
      if (moving && L.onScreen) {
        L.raf = requestAnimationFrame(frame)
      }
    },
    [write],
  )

  const kick = useCallback(() => {
    const L = live.current
    if (L.raf || !L.onScreen) return
    L.last = performance.now()
    L.raf = requestAnimationFrame(frame)
  }, [frame])

  /** Puts every cursor on its target at once: on a resize, off screen, or with reduced motion. */
  const snap = useCallback(() => {
    const { width, height } = size.current
    for (const [id, t] of tracks.current) {
      t.x = t.tx * width
      t.y = t.ty * height
      t.vx = t.vy = 0
      write(id, t)
    }
  }, [write])

  // Measure the surface, and pause while it's off screen or the tab is hidden.
  useEffect(() => {
    const el = overlay.current
    if (!el) return
    const L = live.current
    const measure = () => {
      size.current = { width: el.clientWidth, height: el.clientHeight }
      snap()
    }
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(measure)
    resize?.observe(el)
    const stopScreen = observeOnScreen(el, (onScreen) => {
      L.onScreen = onScreen
      if (onScreen) snap()
      else if (L.raf) {
        cancelAnimationFrame(L.raf)
        L.raf = 0
      }
    })
    return () => {
      resize?.disconnect()
      stopScreen()
      cancelAnimationFrame(L.raf)
      L.raf = 0
    }
  }, [snap])

  // New targets: a new cursor starts on its spot, a known one springs there.
  useLayoutEffect(() => {
    const el = overlay.current
    if (el && !size.current.width) size.current = { width: el.clientWidth, height: el.clientHeight }
    const { width, height } = size.current
    const now = performance.now()
    const seen = new Set<string>()
    let changed = false
    for (const user of users) {
      if (!placed(user)) continue
      seen.add(user.id)
      const tx = clamp(user.x, 0, 1)
      const ty = clamp(user.y, 0, 1)
      const t = tracks.current.get(user.id)
      if (!t) {
        const track: Track = { tx, ty, x: tx * width, y: ty * height, vx: 0, vy: 0, moved: now, message: user.message, idle: false }
        tracks.current.set(user.id, track)
        write(user.id, track)
        continue
      }
      if (t.tx !== tx || t.ty !== ty || t.message !== user.message) {
        t.moved = now
        t.message = user.message
        if (t.idle) {
          t.idle = false
          elements.current.get(user.id)?.removeAttribute('data-yj-idle')
        }
      }
      if (t.tx !== tx || t.ty !== ty) {
        t.tx = tx
        t.ty = ty
        changed = true
      }
    }
    for (const id of tracks.current.keys()) if (!seen.has(id)) tracks.current.delete(id)
    if (!changed) return
    if (live.current.reduced) snap()
    else kick()
  }, [users, kick, snap, write])

  // Fade the cursors that stopped moving: one timer, set for the next to go idle.
  // biome-ignore lint/correctness/useExhaustiveDependencies: new users mean new moves, so the timer is set again
  useEffect(() => {
    if (!idleAfter) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const check = () => {
      const now = performance.now()
      let next = Number.POSITIVE_INFINITY
      for (const [id, t] of tracks.current) {
        if (t.idle) continue
        const due = t.moved + idleAfter
        if (due <= now) {
          t.idle = true
          elements.current.get(id)?.setAttribute('data-yj-idle', '')
        } else next = Math.min(next, due)
      }
      if (next < Number.POSITIVE_INFINITY) timer = setTimeout(check, next - now)
    }
    check()
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- new users mean new moves, so the timer is set again
  }, [users, idleAfter])

  const register = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (!el) {
        elements.current.delete(id)
        return
      }
      elements.current.set(id, el)
      const t = tracks.current.get(id)
      if (t) write(id, t)
    },
    [write],
  )

  return { overlay, register }
}

/** The nearest ancestor that scrolls, or the page. */
function scrollParent(node: HTMLElement | null): HTMLElement | null {
  for (let el = node?.parentElement ?? null; el; el = el.parentElement) {
    const style = getComputedStyle(el)
    if (/(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY) && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) return el
  }
  return (document.scrollingElement as HTMLElement | null) ?? null
}

/**
 * Keeps the followed person in view like a camera: while they stay inside the middle of the view nothing moves; once
 * they near an edge, the view eases after them each frame (one rect read and one scroll write, no smooth-scroll
 * restarts), so it glides instead of stepping. Reduced motion: the view jumps to keep them inside the calm zone.
 */
function useFollow(anchor: RefObject<HTMLDivElement | null>, following: string | null | undefined, active: boolean) {
  const k = useYouj()
  useEffect(() => {
    if (!following || !active) return
    let raf = 0
    let last = performance.now()
    // The view's ease: a time constant on the slow token, so the camera trails a little and never snaps.
    const tau = Math.max(1, k.ms('slow')) / 2.5
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(64, now - last)
      last = now
      const point = anchor.current
      const scroller = scrollParent(point)
      if (!point || !scroller) return
      const page = scroller === document.scrollingElement
      const view = page ? { left: 0, top: 0, width: innerWidth, height: innerHeight } : scroller.getBoundingClientRect()
      const at = point.getBoundingClientRect()
      // The calm zone: the middle 50% of the view.
      const edge = (start: number, size: number, value: number) => {
        const lo = start + size * 0.25
        const hi = start + size * 0.75
        return value < lo ? value - lo : value > hi ? value - hi : 0
      }
      const dx = edge(view.left, view.width, at.left)
      const dy = edge(view.top, view.height, at.top)
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
      const step = k.reduced ? 1 : 1 - Math.exp(-dt / tau)
      scroller.scrollLeft += dx * step
      scroller.scrollTop += dy * step
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [anchor, following, active, k])
}

/** Who joined and who left since the last render, said once in the live region. */
function usePresenceAnnouncements(users: readonly LiveCursorUser[], enabled: boolean, locale: string | undefined, announce: (message: string, options?: { delay?: number }) => void) {
  const labels = useComponentLabels(liveCursorsLabels)
  const known = useRef<Map<string, string> | null>(null)
  useEffect(() => {
    const now = new Map(users.map((user) => [user.id, user.name]))
    const before = known.current
    known.current = now
    if (!before || !enabled) return
    const names = listFormat(locale, { type: 'conjunction' })
    const joined = [...now].filter(([id]) => !before.has(id)).map(([, name]) => name)
    const left = [...before].filter(([id]) => !now.has(id)).map(([, name]) => name)
    const parts = [joined.length ? labels.liveCursorsJoined(names.format(joined)) : '', left.length ? labels.liveCursorsLeft(names.format(left)) : ''].filter(Boolean)
    if (parts.length) announce(parts.join('. '), { delay: 250 })
  }, [users, enabled, locale, labels, announce])
}

function LiveCursors({ users, following, idleAfter = DEFAULT_IDLE, announce: announces = true, locale: localeProp, className, children, ...props }: LiveCursorsProps) {
  const k = useYouj()
  const locale = useLocale(localeProp)
  const { overlay, register } = useCursorEngine(users, idleAfter)
  const { politeRef, announce } = useLiveRegion()
  usePresenceAnnouncements(users, announces, locale, announce)
  const anchor = useRef<HTMLDivElement>(null)
  const followed = following ? users.find((user) => user.id === following && placed(user)) : undefined
  useFollow(anchor, following, Boolean(followed && placed(followed)))
  const shown = users.filter(placed)
  const pop = k.reduced ? ({ type: false } as const) : k.tween('fast', 'enter')

  return (
    <div data-slot="live-cursors" data-yj-following={followed ? '' : undefined} className={cn('relative', className)} {...props}>
      {children}
      {/* The surface is physical: a position means the same spot on every screen, whatever the reading direction. */}
      <div
        ref={overlay}
        aria-hidden
        dir="ltr"
        data-slot="live-cursors-overlay"
        className="pointer-events-none absolute inset-0 overflow-clip"
      >
        {users.map((user) =>
          user.selection?.map((rect, index) => (
            <div
              key={`${user.id}-${index}`}
              data-slot="live-cursor-selection"
              className="absolute own:rounded-xs border transition-opacity yj-duration-base ease-standard starting:opacity-0"
              style={
                {
                  '--ui--live-cursor': cursorColor(user),
                  insetInlineStart: `${clamp(rect.x, 0, 1) * 100}%`,
                  top: `${clamp(rect.y, 0, 1) * 100}%`,
                  width: `${clamp(rect.width, 0, 1) * 100}%`,
                  height: `${clamp(rect.height, 0, 1) * 100}%`,
                  background: TINT,
                  borderColor: 'var(--ui--live-cursor)',
                } as CSSProperties
              }
            />
          )),
        )}
        {followed && placed(followed) && (
          <div
            ref={anchor}
            data-slot="live-cursors-follow-anchor"
            className="absolute size-0"
            style={{ insetInlineStart: `${clamp(followed.x, 0, 1) * 100}%`, top: `${clamp(followed.y, 0, 1) * 100}%` }}
          />
        )}
        <MotionFeatures>
          <AnimatePresence>
            {shown.map((user) => (
              <div
                key={user.id}
                ref={register(user.id)}
                data-slot="live-cursor"
                data-yj-following={user.id === following ? '' : undefined}
                className="absolute start-0 top-0 transition-opacity yj-duration-slow ease-standard data-[yj-idle]:opacity-0"
                style={{ '--ui--live-cursor': cursorColor(user), '--live-cursor-pill': PILL } as CSSProperties}
              >
                <m.div
                  className="origin-top-left"
                  initial={k.reduced ? false : { opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: k.reduced ? 1 : 0.6 }}
                  transition={pop}
                >
                  <svg viewBox="0 0 16 18" className="block h-4.5 w-4 drop-shadow-sm" aria-hidden>
                    <path
                      d="M1 1 L15 8.6 L8.6 10.2 L5.4 16.4 Z"
                      className="fill-(--ui--live-cursor) stroke-canvas"
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="absolute start-3 top-4 own:flex flex-col items-start gap-1">
                    <span
                      data-slot="live-cursor-name"
                      className="own:rounded-full bg-(--live-cursor-pill) own:px-2 own:py-0.5 own:text-ui-xs own:font-medium whitespace-nowrap own:text-canvas own:shadow-sm"
                      style={{ color: INK }}
                    >
                      {user.name}
                    </span>
                    <AnimatePresence>
                      {user.message && (
                        <m.span
                          key="message"
                          data-slot="live-cursor-message"
                          className="own:block w-max max-w-56 origin-top-left own:rounded-lg own:rounded-ss-xs bg-(--live-cursor-pill) own:px-2.5 own:py-1.5 own:text-ui-sm own:text-canvas own:shadow-md [overflow-wrap:anywhere]"
                          style={{ color: INK }}
                          initial={k.reduced ? false : { opacity: 0, scale: 0.8, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: k.reduced ? 1 : 0.8 }}
                          transition={pop}
                        >
                          {user.message}
                        </m.span>
                      )}
                    </AnimatePresence>
                  </div>
                </m.div>
              </div>
            ))}
          </AnimatePresence>
        </MotionFeatures>
      </div>
      <div ref={politeRef} role="status" aria-live="polite" className="sr-only" />
    </div>
  )
}

/**
 * Reports the local pointer over `containerRef` as fractions of its size, at
 * most once per `throttle` ms (the last move always lands), and `null` when
 * the pointer leaves: send what `onMove` gets to everyone else.
 */
function useLiveCursorsInput(containerRef: RefObject<HTMLElement | null>, onMove: (position: LiveCursorPosition | null) => void, { throttle = DEFAULT_THROTTLE }: LiveCursorsInputOptions = {}) {
  const callback = useRef(onMove)
  callback.current = onMove
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let last = Number.NEGATIVE_INFINITY
    let timer: ReturnType<typeof setTimeout> | undefined
    let pending: LiveCursorPosition | null = null
    const flush = () => {
      timer = undefined
      last = performance.now()
      callback.current(pending)
    }
    const move = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      pending = { x: clamp((event.clientX - rect.left) / rect.width, 0, 1), y: clamp((event.clientY - rect.top) / rect.height, 0, 1) }
      const wait = last + throttle - performance.now()
      if (wait <= 0) {
        clearTimeout(timer)
        flush()
      } else timer ??= setTimeout(flush, wait)
    }
    const leave = () => {
      clearTimeout(timer)
      timer = undefined
      last = Number.NEGATIVE_INFINITY
      callback.current(null)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      clearTimeout(timer)
    }
  }, [containerRef, throttle])
}

interface PresenceAvatarsProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Everyone here, in the order to show them. */
  users: readonly LiveCursorUser[]
  /** Avatars shown before "+N". Default 5. */
  max?: number
  size?: 'sm' | 'default' | 'lg'
  /** The id of the person being followed, or `null`. Controlled. */
  following?: string | null
  /** The person followed at first. Default `null`. */
  defaultFollowing?: string | null
  /** Called with an id when an avatar is pressed, and `null` when it's pressed again. Leave it out, and `following` too, for avatars that only show who's here. */
  onFollowingChange?: (id: string | null) => void
  /** The group's name. Default: the labels' "People here". */
  label?: string
}

const overlap = { sm: '-space-x-1', default: '-space-x-1.5', lg: '-space-x-2' } as const

function PresenceAvatars({ users, max = 5, size = 'default', following: followingProp, defaultFollowing = null, onFollowingChange, label, className, ...props }: PresenceAvatarsProps) {
  const labels = useComponentLabels(liveCursorsLabels)
  const [followingState, setFollowing] = useControllableState(followingProp, defaultFollowing)
  const following = users.some((user) => user.id === followingState) ? followingState : null
  const followable = followingProp !== undefined || onFollowingChange !== undefined
  const { politeRef, announce } = useLiveRegion()
  // "+1" would hide one face behind a counter the same size: show it instead.
  const shown = users.length === max + 1 ? users : users.slice(0, max)
  const hidden = users.length - shown.length
  const status = { viewing: labels.liveCursorsViewing, editing: labels.liveCursorsEditing }

  const press = (user: LiveCursorUser) => {
    const next = following === user.id ? null : user.id
    setFollowing(next)
    onFollowingChange?.(next)
    if (next) announce(labels.liveCursorsFollowing(user.name))
  }

  return (
    <TooltipProvider delay={200}>
      <div
        role="group"
        aria-label={label ?? labels.liveCursorsPeople}
        data-slot="presence-avatars"
        className={cn('isolate own:flex items-center', overlap[size], className)}
        {...props}
      >
        {shown.map((user, index) => {
          const pressed = following === user.id
          const avatar = (
            <Avatar size={size} className="bg-canvas own:ring-2 ring-(--ui--live-cursor) ring-offset-1 ring-offset-canvas">
              {user.src && <AvatarImage src={user.src} alt="" />}
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
          )
          return (
            <Tooltip key={user.id}>
              <TooltipTrigger
                render={
                  followable ? (
                    <button type="button" aria-pressed={pressed} aria-label={labels.liveCursorsFollow(user.name)} onClick={() => press(user)} />
                  ) : (
                    <span role="img" aria-label={user.status ? `${user.name}, ${status[user.status]}` : user.name} />
                  )
                }
                data-slot="presence-avatar"
                data-status={user.status}
                className={cn(
                  'relative own:rounded-full transition-[translate] yj-duration-fast ease-standard hover:z-20 hover:-translate-y-0.5 focus-ring',
                  'aria-pressed:outline-2 aria-pressed:outline-offset-3 aria-pressed:outline-(--ui--live-cursor)',
                )}
                style={{ '--ui--live-cursor': cursorColor(user), zIndex: shown.length - index } as CSSProperties}
              >
                {avatar}
              </TooltipTrigger>
              <TooltipContent>
                {user.name}
                {user.status && <span className="opacity-70"> · {status[user.status]}</span>}
              </TooltipContent>
            </Tooltip>
          )
        })}
        {hidden > 0 && (
          <span
            role="img"
            aria-label={labels.liveCursorsMore(hidden)}
            data-slot="presence-avatars-more"
            className={cn(
              'relative own:flex shrink-0 items-center justify-center rounded-full bg-canvas own:text-ui-sm own:font-medium own:text-fg-muted own:tabular-nums ring-2 ring-canvas',
              size === 'sm' ? 'size-6 own:text-ui-xs' : size === 'lg' ? 'size-10' : 'size-8',
            )}
          >
            <span aria-hidden className="own:flex size-full items-center justify-center rounded-full bg-band">
              +{hidden}
            </span>
          </span>
        )}
        <div ref={politeRef} role="status" aria-live="polite" className="sr-only" />
      </div>
    </TooltipProvider>
  )
}

export {
  LiveCursors,
  PresenceAvatars,
  useLiveCursorsInput,
  type LiveCursorPosition,
  type LiveCursorRect,
  type LiveCursorStatus,
  type LiveCursorUser,
  type LiveCursorsInputOptions,
  type LiveCursorsProps,
  type PresenceAvatarsProps,
}
