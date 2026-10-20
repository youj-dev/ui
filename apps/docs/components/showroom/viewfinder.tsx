'use client'

import { memo, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useDirection, useYouj } from '@youj/core'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from '@youj/icons'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@youj/react'
import { ActionIsland, ActionIslandTile } from '@youj/react/components/ui/action-island'
import { cn } from '@/lib/cn'
import { hasThumb, Thumbs, type ShowroomItem } from './thumb'

/** A row (under the stage, or in the explorer's bar), a column (beside the stage, from lg) or an island (a row of larger
 * thumbnails in a glass pill, floating on the stage's lower edge, from lg). */
export type ViewfinderOrientation = 'horizontal' | 'vertical' | 'island'

export interface ViewfinderProps {
  items: ShowroomItem[]
  /** The id of the item on show, held under the frame. */
  current: string
  onSelect: (id: string) => void
  /** The row's accessible name: `Objects`. */
  label: string
  /**
   * Default horizontal: a row of square thumbnails. Vertical: a column of larger 4:3 ones, about eight in view. Island:
   * the row, its squares larger (the strip's own `--strip-thumb`).
   */
  orientation?: ViewfinderOrientation
}

export interface ViewfinderBarProps extends ViewfinderProps {
  /** Where Previous and Next go (useShowroomSelection's, round and round); none disables them. */
  prev: ShowroomItem | undefined
  next: ShowroomItem | undefined
  /** One item, for Previous and Next's tooltips when there's nowhere to go: `object` → `The first object`. */
  noun: string
}

/**
 * The explorer's bar: sticky under the site's header, across the hero's full width (from the stage's start to the
 * placard's end), with Previous at its start, Next at its end and the viewfinder between them.
 */
export function ViewfinderBar(props: ViewfinderBarProps) {
  return (
    <div data-yj-tone="chrome" className="sticky top-(--header-height) z-20 border-b border-line yj-glass">
      <ViewfinderStrip {...props} orientation="horizontal" className="gutter mx-auto max-w-[110rem] py-[5px]" />
    </div>
  )
}

/**
 * The viewfinder between its step buttons: a row (Previous · strip · Next) to set under a stage, a column (Up · strip ·
 * Down) to stand beside it, filling the height it's given, or an island: the row in a frosted pill (the site's floating
 * islands' glass, hairline and shadow) to float over the stage, its thumbnails 64px, its step buttons quiet and as tall
 * as the frame, at the pill's ends.
 */
export function ViewfinderStrip({ prev, next, noun, orientation = 'horizontal', className, ...strip }: ViewfinderBarProps & { className?: string }) {
  const vertical = orientation === 'vertical'
  const island = orientation === 'island'
  const steps = (
    <>
      <StepButton side="start" to={prev} noun={noun} onSelect={strip.onSelect} vertical={vertical} island={island} />
      <Viewfinder {...strip} orientation={orientation} />
      <StepButton side="end" to={next} noun={noun} onSelect={strip.onSelect} vertical={vertical} island={island} />
    </>
  )
  // The island is the docs examples' own: the kit's ActionIsland at its large size, its step buttons and thumbnails the size of its tiles.
  if (island)
    return (
      <ActionIsland size="lg" aria-label={strip.label} data-showroom-strip="" data-orientation={orientation} className={cn('w-full min-w-0 [--gap:0.375rem] [--strip-thumb-r:var(--radius-control-sm)] [--strip-thumb:2.75rem]', className)}>
        {steps}
      </ActionIsland>
    )
  return (
    <div data-showroom-strip="" data-orientation={orientation} className={cn('flex min-h-0 min-w-0 items-center gap-2', vertical && 'h-full flex-col items-stretch', className)}>
      {steps}
    </div>
  )
}

/** Items either side of the frame drawn before the strip has measured itself: more than an island shows. */
const REACH = 14

/** The row's three copies of the items: the real one in the middle, a copy before and after it for the wrap. */
const SETS = [-1, 0, 1] as const

/** The viewport x (a row) or y (a column) of an element's centre. */
const middleOf = (vertical: boolean) => (el: Element) => {
  const r = el.getBoundingClientRect()
  return vertical ? r.top + r.height / 2 : r.left + r.width / 2
}

/**
 * Every item as a square thumbnail in a row with no start or end (after the last item comes the first again), under
 * a viewfinder: a frame held at the row's middle, where the item on show always sits. When it changes the row
 * springs under the frame to put the new one there, the short way round (jumps under reduced motion, and on the first
 * paint). The row is three copies of the items; whenever it drifts half a copy from the middle one it's moved back by
 * a whole copy, which looks the same, so it can scroll either way forever. It scrolls on its own too (wheel, trackpad, a
 * mouse's drag, touch): the frame dims, and a moment after the row comes to rest it glides back to the item on show,
 * unless a thumbnail was clicked, which puts its own item on show. A listbox of the middle copy (the others are
 * hidden from assistive tech), one tab stop: ← and → (mirrored right to left) step round, Home and End go to the first
 * and the last, and focus follows the item on show. A column (`orientation="vertical"`) is the same turned upright,
 * with the frame at its middle height: ↑ and ↓ step round (← and → still do), and the wheel scrolls it as it is.
 */
export function Viewfinder({ items, current, onSelect, label, orientation = 'horizontal' }: ViewfinderProps) {
  const k = useYouj()
  const rtl = useDirection() === 'rtl'
  const vertical = orientation === 'vertical'
  const middle = middleOf(vertical)
  /** How far it's scrolled along its own axis, and scrolling it there. */
  const pos = (box: HTMLElement) => (vertical ? box.scrollTop : box.scrollLeft)
  const scrollTo = (box: HTMLElement, at: number) => {
    if (vertical) box.scrollTop = at
    else box.scrollLeft = at
  }
  const scroller = useRef<HTMLDivElement>(null)
  const centred = useRef(false)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null) // x and left: along its axis
  // Scrolled by hand: the frame dims until the row is back on the item on show.
  const [browsing, setBrowsing] = useState(false)
  // The keyboard's focus is in the row: the frame wears the focus ring. Kept here rather than as a `:has(:focus-visible)`
  // rule, which re-styled every tile each time the row's content changed.
  const [ringed, setRinged] = useState(false)
  const byHand = useRef(false)
  const held = useRef(false)
  const rest = useRef<ReturnType<typeof setTimeout>>(undefined)
  const spring = useRef<{ raf: number; x: number; v: number; to: number; t: number } | null>(null)
  // The item at the frame and how many either side carry their picture and tooltip: about a view's width each way, the
  // same items in every copy (so a wrap changes nothing). The rest are bare tiles: a strip is hundreds of them.
  const [view, setView] = useState(() => ({ at: Math.max(0, items.findIndex((o) => o.id === current)), reach: REACH }))
  const look = () => {
    const box = scroller.current
    const a = box?.children[0]
    const b = box?.children[1]
    if (!box || !a || !b) return
    const pitch = middle(b) - middle(a)
    // Not laid out (a test): it keeps the guess it started with.
    if (!pitch) return
    const n = items.length
    const at = (((Math.round((middle(box) - middle(a)) / pitch) % n) + n) % n)
    const reach = Math.ceil((vertical ? box.clientHeight : box.clientWidth) / Math.abs(pitch)) + 2
    setView((v) => (v.at === at && v.reach === reach ? v : { at, reach }))
  }

  /** Back by a whole copy when the middle has drifted half a copy from the real one; returns how far it moved. */
  const wrap = () => {
    const box = scroller.current
    const first = box?.querySelector('[data-set="0"]')
    const next = box?.querySelector('[data-set="1"]')
    if (!box || !first || !next) return 0
    const copy = middle(next) - middle(first)
    // The real copy's last tile is the one just before the next copy's first.
    const off = middle(box) - (middle(first) + middle(next.previousElementSibling!)) / 2
    const by = -copy * Math.round(off / copy)
    if (by) scrollTo(box, pos(box) + by)
    return by
  }

  const stop = () => {
    if (spring.current) cancelAnimationFrame(spring.current.raf)
    spring.current = null
  }

  /**
   * A critically damped spring to `to`, solved exactly at each frame's time (so a slow frame can't make it jump). A new
   * target while it's under way restarts it from where it is, at the speed it has.
   */
  const springTo = (to: number) => {
    const box = scroller.current!
    const w = 22
    const now = performance.now()
    const at = (s: { x: number; v: number; to: number; t: number }, time: number) => {
      const t = Math.max(0, time - s.t) / 1000 / k.timeScale
      const c1 = s.x - s.to
      const c2 = s.v + w * c1
      const e = Math.exp(-w * t)
      return { x: s.to + (c1 + c2 * t) * e, v: (c2 - w * (c1 + c2 * t)) * e }
    }
    const was = spring.current
    if (was) cancelAnimationFrame(was.raf)
    const s = { raf: 0, ...(was ? at(was, now) : { x: pos(box), v: 0 }), to, t: now }
    const step = (time: number) => {
      const { x, v } = at(s, time)
      if (Math.abs(s.to - x) < 0.5 && Math.abs(v) < 20) {
        scrollTo(box, s.to)
        spring.current = null
        wrap()
        return
      }
      scrollTo(box, x)
      const by = wrap()
      s.x += by
      s.to += by
      s.raf = requestAnimationFrame(step)
    }
    spring.current = s
    s.raf = requestAnimationFrame(step)
  }

  /** Puts the item on show under the frame: the copy of it nearest the middle, so the row takes the short way. */
  const centre = (how: 'spring' | 'instant') => {
    const box = scroller.current
    if (!box) return
    const mid = middle(box)
    const nearest = [...box.querySelectorAll(`[data-id="${current}"]`)].reduce<{ el: Element; d: number } | null>((best, el) => {
      const d = middle(el) - mid
      return best && Math.abs(best.d) <= Math.abs(d) ? best : { el, d }
    }, null)
    if (!nearest) return
    clearTimeout(rest.current)
    byHand.current = false
    setBrowsing(false)
    const to = pos(box) + nearest.d
    if (how === 'spring') return springTo(to)
    stop()
    scrollTo(box, to)
    wrap()
  }
  const glide = () => centre(k.reduced ? 'instant' : 'spring')

  useLayoutEffect(() => {
    centre(centred.current && !k.reduced ? 'spring' : 'instant')
    centred.current = true
    look()
    // Focus follows the item on show while it's in here (the arrows moved it).
    const box = scroller.current
    const option = box?.querySelector<HTMLElement>(`[role="option"][data-id="${current}"]`)
    if (option && box!.contains(document.activeElement) && document.activeElement !== option) option.focus({ preventScroll: true })
  }, [current, k.reduced, vertical])

  // A new width (a resized window, a font that came in) puts the item on show back under the frame at once.
  const recentre = useRef(centre)
  recentre.current = centre
  const looks = useRef(look)
  looks.current = look
  useEffect(() => {
    const box = scroller.current
    if (!box) return
    const observer = new ResizeObserver(() => {
      if (!byHand.current) recentre.current('instant')
      looks.current()
    })
    observer.observe(box)
    return () => {
      observer.disconnect()
      clearTimeout(rest.current)
      if (spring.current) cancelAnimationFrame(spring.current.raf)
    }
  }, [])

  /** Taken by hand: the spring lets go, and a moment after the row rests (and isn't held) it glides back. */
  const take = () => {
    byHand.current = true
    stop()
  }
  const restSoon = () => {
    clearTimeout(rest.current)
    rest.current = setTimeout(() => !held.current && glide(), 900)
  }

  // A vertical wheel scrolls the row sideways (a column, as it is).
  useEffect(() => {
    const box = scroller.current
    if (!box) return
    const onWheel = (e: WheelEvent) => {
      take()
      if (vertical || Math.abs(e.deltaX) >= Math.abs(e.deltaY) || e.ctrlKey) return
      e.preventDefault()
      box.scrollLeft += rtl ? -e.deltaY : e.deltaY
    }
    box.addEventListener('wheel', onWheel, { passive: false })
    return () => box.removeEventListener('wheel', onWheel)
  }, [rtl, vertical])

  const onScroll = () => {
    look()
    if (spring.current) return
    const by = wrap()
    if (drag.current) drag.current.left += by
    if (!byHand.current) return
    setBrowsing(true)
    restSoon()
  }

  // A thumbnail's click, through a ref so the tiles keep one callback and only the two whose `on` changed re-render.
  const onPickRef = useRef<(id: string) => void>(null!)
  onPickRef.current = (id) => (id === current ? glide() : onSelect(id))
  const [pick] = useState(() => (id: string) => onPickRef.current(id))

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = items.findIndex((o) => o.id === current)
    const n = items.length
    const step = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1, ...(vertical && { ArrowUp: -1, ArrowDown: 1 }) }[e.key]
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : step === undefined ? -1 : (at + step + n) % n
    if (to < 0 || e.altKey || e.metaKey || e.ctrlKey) return
    e.preventDefault()
    // Not the island's toolbar's: it would rove its tiles with the same arrows.
    e.stopPropagation()
    if (to !== at) onSelect(items[to]!.id)
  }

  // A mouse drags the row; a drag isn't a click on the thumbnail it ends on. Touch scrolls it natively.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    take()
    const mouse = e.pointerType === 'mouse' && e.button === 0
    held.current = mouse
    drag.current = mouse ? { x: vertical ? e.clientY : e.clientX, left: pos(e.currentTarget), moved: false } : null
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || !e.buttons) return
    const at = vertical ? e.clientY : e.clientX
    if (!d.moved && Math.abs(at - d.x) < 4) return
    if (!d.moved) e.currentTarget.setPointerCapture(e.pointerId)
    d.moved = true
    scrollTo(e.currentTarget, d.left - (at - d.x))
  }
  const letGo = () => {
    held.current = false
    if (byHand.current) restSoon()
  }

  return (
    <div
      className={cn(
        'group/strip relative flex min-w-0 flex-1 [--gap:0.5rem]',
        // A column's tiles fill its width at 4:3, the thumbnails' own shape, so each shows its whole picture.
        vertical ? '@container min-h-0 flex-col [--tile-h:calc((100cqw-12px)*3/4)] [--tile-w:calc(100cqw-12px)]' : '[--thumb:var(--strip-thumb,var(--spacing-control-lg))]',
      )}
    >
      <div
        ref={scroller}
        role="listbox"
        aria-label={label}
        aria-orientation={vertical ? 'vertical' : 'horizontal'}
        onKeyDown={onKeyDown}
        onScroll={onScroll}
        // Tabbing back in while it's scrolled away brings the item on show (and its focus) back under the frame.
        onFocus={(e) => {
          const keyboard = e.target.matches(':focus-visible')
          setRinged(keyboard)
          if (byHand.current && keyboard) glide()
        }}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setRinged(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => {
          letGo()
          // The click that follows a drag's release reads this, then it's dropped.
          if (drag.current && !drag.current.moved) drag.current = null
        }}
        onPointerCancel={() => {
          if (drag.current) held.current = false
          drag.current = null
        }}
        onTouchStart={() => {
          take()
          held.current = true
        }}
        onTouchEnd={letGo}
        onTouchCancel={letGo}
        onClickCapture={(e) => {
          if (drag.current?.moved) e.stopPropagation()
          drag.current = null
        }}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-(--gap) [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          // The row fades out under its ends, so a thumbnail cut by them reads as more to come.
          vertical
            ? 'min-h-0 flex-col overflow-y-auto overscroll-y-contain px-[6px] [mask-image:linear-gradient(to_bottom,transparent,black_2rem,black_calc(100%-2rem),transparent)]'
            : 'overflow-x-auto overscroll-x-contain py-[6px] [--fade:1.5rem] [mask-image:linear-gradient(to_right,transparent,black_var(--fade),black_calc(100%-var(--fade)),transparent)]',
          // The row's own padding gives the frame room; the island's padding already does, so it takes the same back.
          orientation === 'island' && '-my-1.5 [--fade:1.5rem]',
        )}
      >
        {SETS.map((set) =>
          items.map((o, i) => {
            const d = Math.abs(i - view.at)
            const near = Math.min(d, items.length - d) <= view.reach
            return <Tile key={`${set}:${o.id}`} item={o} set={set} on={o.id === current} near={near} vertical={vertical} onPick={pick} />
          }),
        )}
      </div>
      {/* The viewfinder: the accent's frame, held at the middle while the row slides under it; the site's focus ring
          with the keyboard's focus in the row; dimmed while the row is off the item on show. */}
      <div
        aria-hidden
        data-showroom-frame=""
        data-browsing={browsing || undefined}
        data-ringed={ringed || undefined}
        className={cn(
          'pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 border-2 border-accent',
          vertical ? 'h-[calc(var(--tile-h)+8px)] w-[calc(var(--tile-w)+8px)] rounded-[14px]' : 'size-[calc(var(--thumb)+8px)] rounded-[calc(var(--strip-thumb-r,8px)+4px)]',
          'transition-[border-color,opacity] duration-(--yj-duration-fast) ease-standard motion-reduce:transition-none',
          'data-browsing:opacity-40 data-ringed:border-(--color-focus)',
        )}
      />
    </div>
  )
}

/**
 * One thumbnail in the row: memoized, so a change of item re-renders only the tiles it lights and unlights. Out of
 * `near` it's the bare tile (no picture, no tooltip), as it is until it comes near the view.
 */
const Tile = memo(function Tile({ item, set, on, near, vertical, onPick }: { item: ShowroomItem; set: number; on: boolean; near: boolean; vertical: boolean; onPick: (id: string) => void }) {
  const real = set === 0
  const tile = (
    <div
      data-id={item.id}
      data-set={set}
      {...(real ? { role: 'option', 'aria-selected': on, 'aria-label': item.label, tabIndex: on ? 0 : -1 } : { 'aria-hidden': true })}
      onClick={() => onPick(item.id)}
      className={cn(
        'relative shrink-0 cursor-pointer overflow-hidden border border-line bg-surface outline-none select-none',
        vertical ? 'aspect-[4/3] w-full rounded-[10px]' : 'size-(--thumb) rounded-(--strip-thumb-r,8px)',
        'transition-[border-color,opacity] duration-(--yj-duration-fast) ease-standard motion-reduce:transition-none',
        'opacity-75 hover:border-line-strong hover:opacity-100',
        on && 'opacity-100',
      )}
    />
  )
  if (!near && !on) return tile
  return (
    <Tooltip>
      <TooltipTrigger render={tile}>{hasThumb(item) ? <Thumbs item={item} eager={false} square={!vertical} /> : null}</TooltipTrigger>
      <TooltipContent side={vertical ? 'inline-end' : 'top'}>{item.label}</TooltipContent>
    </Tooltip>
  )
})

/** Previous or Next through the items: ← and → (mirrored right to left) do the same. A column's point up and down. */
function StepButton({ side, to, noun, onSelect, vertical, island }: { side: 'start' | 'end'; to: ShowroomItem | undefined; noun: string; onSelect: (id: string) => void; vertical: boolean; island: boolean }) {
  const rtl = useDirection() === 'rtl'
  const Icon = vertical ? (side === 'start' ? ChevronUpIcon : ChevronDownIcon) : side === 'start' ? ChevronLeftIcon : ChevronRightIcon
  const label = side === 'start' ? 'Previous' : 'Next'
  const icon = <Icon size={16} strokeWidth={1.75} active={false} className={cn('text-fg-muted', !vertical && 'rtl:-scale-x-100')} />
  // The island's step is one of its tiles, as the docs' island carries them.
  if (island)
    return (
      <ActionIslandTile label={to ? `${label}: ${to.label}` : label} disabled={!to} onClick={() => to && onSelect(to.id)}>
        {icon}
      </ActionIslandTile>
    )
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon-lg"
            aria-label={to ? `${label}: ${to.label}` : label}
            disabled={!to}
            onClick={() => to && onSelect(to.id)}
            // shape: in the vertical viewfinder a step key is one of the rail's 36px rows
            className={cn('shrink-0 bg-surface', vertical && 'mx-[6px] h-9 w-auto')}
          />
        }
      >
        {/* Held at rest: the chevron's own hover turns it down, as a tree's disclosure would. */}
        {icon}
      </TooltipTrigger>
      <TooltipContent side={vertical ? 'inline-end' : 'top'}>
        {to ? to.label : side === 'start' ? `The first ${noun}` : `The last ${noun}`}
        {/* The page's own keys for the same step. */}
        <span className="ms-2 text-fg-subtle">{(side === 'start') !== rtl ? '←' : '→'}</span>
      </TooltipContent>
    </Tooltip>
  )
}
