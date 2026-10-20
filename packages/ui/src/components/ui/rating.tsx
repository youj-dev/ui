'use client'

import { useState, type ComponentType, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'
import { stagger, useAnimate } from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { ratingLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'

/* A rating: stars (or any icon), whole or half steps.
 * - One focusable slider (role="slider", "3.5 of 5 stars"): arrows step,
 *   Home/End go to none/full, a digit jumps there, Backspace clears. RTL
 *   flips the arrows and the fill.
 * - Each icon sits in its own small key, a row of them like a segmented
 *   control's segments: empty, the key role on a control-line hairline with a
 *   muted outline; filled, the accent with the icon solid in its contrast
 *   colour, clipped to its share (half a key at a half step). The default star
 *   is drawn here: plump points rounded by its own stroke.
 * - Hovering previews the value under the pointer (half a key at a time with
 *   `allowHalf`): the fill sweeps there one tight stagger step per key, the
 *   key under the pointer lifts, and keys of the committed value that the
 *   preview has emptied keep a faint accent tint and edge. Leaving restores it.
 *   `onPreviewChange` reports the previewed value so a readout beside it can
 *   say what a click would set.
 * - Clicking commits; clicking the current value again clears it. The key
 *   committed to presses in and springs back (settle), the filled ones before
 *   it ripple up a stagger step apart, and a glint of five short rays opens
 *   around it and fades.
 * - `readOnly` is a labeled image ("Rated 4.5 out of 5"), no interaction.
 * Reduced motion: the fill snaps, nothing lifts, presses or glints; the
 * preview and the committed value still read the same. */

/** Any icon that takes a class and a stroke width: a Youj icon (held still with `trigger="none"`) or a lucide-style one. */
type RatingIcon = ComponentType<{ className?: string; strokeWidth?: number; trigger?: 'none' }>

interface RatingProps {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** The value under the pointer while it hovers, or null when it leaves: what a click would set. */
  onPreviewChange?: (value: number | null) => void
  /** Number of icons. Default 5. */
  max?: number
  /** Half steps. Default false. */
  allowHalf?: boolean
  readOnly?: boolean
  disabled?: boolean
  /** The icon, filled with currentColor: a Youj icon or a lucide-style one. Default: Rating's own star. */
  icon?: RatingIcon
  /** What one icon is, for the value text ("stars", "hearts"). Default 'stars'. */
  unit?: string
  size?: 'sm' | 'default' | 'lg'
  /** Submits the value in a hidden input. */
  name?: string
  className?: string
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
}

/** A key, and the icon inside it. */
const SIZES = { sm: 'size-6 own:rounded-sm', default: 'size-7 own:rounded-md', lg: 'size-8 own:rounded-md' } as const
const ICONS = { sm: 'size-3.5', default: 'size-4', lg: 'size-5' } as const
const GAPS = { sm: 'gap-0.5', default: 'gap-1', lg: 'gap-1.5' } as const

/** Ten points around (12, 12.5): tips at 9.8, valleys at 4.65, a little plumper than a geometric star. */
const STAR = 'M12 2.7 L14.73 8.74 L21.32 9.47 L16.42 13.94 L17.76 20.43 L12 17.15 L6.24 20.43 L7.58 13.94 L2.68 9.47 L9.27 8.74 Z'

/** The default icon: one path, its stroke rounding the points. */
function Star({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round" className={className}>
      <path d={STAR} />
    </svg>
  )
}

/** The glint's rays, between the star's points, in a box twice the key's size, so they open just outside it. */
const RAYS = [-54, 18, 90, 162, 234].map((deg) => {
  const [c, s] = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)]
  const at = (r: number) => `${(c * r).toFixed(2)} ${(s * r).toFixed(2)}`
  return `M${at(7.2)} L${at(9.6)}`
}).join(' ')

function Rating({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  onPreviewChange,
  max = 5,
  allowHalf = false,
  readOnly = false,
  disabled = false,
  icon: Icon = Star,
  unit,
  size = 'default',
  name,
  className,
  ...aria
}: RatingProps) {
  const k = useYouj()
  const labels = useComponentLabels(ratingLabels)
  unit ??= labels.stars
  const step = allowHalf ? 0.5 : 1
  const snap = (n: number) => Math.min(max, Math.max(0, Math.round(n / step) * step))
  const [uncontrolled, setUncontrolled] = useState(() => snap(defaultValue))
  const value = valueProp !== undefined ? snap(valueProp) : uncontrolled
  const [preview, setPreviewState] = useState<number | null>(null)
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const shown = preview ?? value
  const interactive = !readOnly && !disabled

  // Where the fill last came from, so it sweeps icon by icon from that edge.
  const [sweep, setSweep] = useState({ from: shown, to: shown })
  if (sweep.to !== shown) setSweep({ from: sweep.to, to: shown })
  const delay = (i: number) => {
    if (k.reduced) return 0
    const { from, to } = sweep
    const steps = to > from ? i - Math.floor(from) : Math.ceil(from) - 1 - i
    return Math.max(0, steps) * k.stagger('tight')
  }

  const setPreview = (next: number | null) => {
    if (next === preview) return
    setPreviewState(next)
    onPreviewChange?.(next)
  }

  const commit = (next: number) => {
    const snapped = snap(next)
    if (valueProp === undefined) setUncontrolled(snapped)
    if (snapped !== value) onValueChange?.(snapped)
    if (k.reduced || snapped === 0 || !scope.current) return
    const items = [...scope.current.querySelectorAll('[data-slot=rating-item]')]
    const target = items[Math.ceil(snapped) - 1]!
    const before = items.slice(0, Math.ceil(snapped) - 1).map((item) => item.querySelector('[data-slot=rating-glyph]')!)
    // Once the fill has swept to it (a jump from the keyboard), it presses in and springs back, a glint
    // opens around it, and the ones before it ripple up in turn.
    const swept = Math.max(0, Math.ceil(snapped) - 1 - Math.floor(shown)) * k.stagger('tight')
    if (before.length) animate(before, { scale: [1, 1.06, 1] }, { ...k.tween('base', 'emphasized'), delay: stagger(k.stagger('tight'), { startDelay: swept }) })
    animate(target.querySelector('[data-slot=rating-glyph]')!, { scale: [0.86, 1] }, { ...k.spring('settle'), delay: swept })
    animate(
      target.querySelector('[data-slot=rating-glint]')!,
      { opacity: [0, 1, 0], scale: [0.7, 1.15] },
      { opacity: { ...k.tween('slow', 'standard'), times: [0, 0.3, 1], delay: swept }, scale: { ...k.tween('slow', 'enter'), delay: swept } },
    )
  }

  /** The value under the pointer: which icon, and which half of it. */
  const valueAt = (event: MouseEvent<HTMLDivElement>) => {
    const el = event.currentTarget
    const items = el.querySelectorAll('[data-slot=rating-item]')
    const first = items[0]!.getBoundingClientRect()
    const last = items[items.length - 1]!.getBoundingClientRect()
    const rtl = getComputedStyle(el).direction === 'rtl'
    // Measured across the keys, not the padded hit area around them.
    const left = Math.min(first.left, last.left)
    const width = Math.max(first.right, last.right) - left
    const x = event.clientX - left
    // Unlaid out (a zero width), it reads as the first icon rather than NaN.
    const fraction = width > 0 ? Math.min(0.9999, Math.max(0, (rtl ? width - x : x) / width)) : 0
    const raw = fraction * max
    return allowHalf ? Math.floor(raw * 2) / 2 + 0.5 : Math.floor(raw) + 1
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const forward = event.key === 'ArrowUp' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')
    const back = event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')
    let next: number | null = null
    if (forward) next = value + step
    else if (back) next = value - step
    else if (event.key === 'Home' || event.key === 'Backspace' || event.key === 'Delete') next = 0
    else if (event.key === 'End') next = max
    else if (/^[0-9]$/.test(event.key) && Number(event.key) <= max) next = Number(event.key)
    if (next === null) return
    event.preventDefault()
    commit(next)
  }

  const valueText = (n: number) => (n === 0 ? labels.noRating : labels.ratingValue(n, max, unit))
  const clip = '[clip-path:inset(0_calc(100%-var(--share)*100%)_0_0)] rtl:[clip-path:inset(0_0_0_calc(100%-var(--share)*100%))]'
  const lifted = preview !== null && !k.reduced ? Math.ceil(preview) - 1 : -1

  const icons = Array.from({ length: max }, (_, i) => {
    const share = Math.min(1, Math.max(0, shown - i))
    const kept = preview !== null && value > i && share < Math.min(1, value - i)
    return (
      <span
        key={i}
        data-slot="rating-item"
        className={cn(
          'relative own:block shrink-0 transition-[scale,translate] yj-duration-fast ease-standard',
          SIZES[size],
          i === lifted && '-translate-y-0.5 scale-105',
        )}
      >
        {/* The key. A preview below the committed value tints the keys it empties a faint accent. */}
        <span
          data-slot="rating-glyph"
          className={cn(
            'absolute inset-0 own:grid place-items-center own:rounded-[inherit] border own:shadow-xs transition-[border-color,background-color] yj-duration-fast ease-standard',
            kept ? 'own:border-accent-line own:bg-accent-subtle' : 'own:border-line-control own:bg-key',
          )}
        >
          <Icon className={cn('fill-transparent own:text-fg-subtle', ICONS[size])} strokeWidth={1.5} trigger="none" />
          {/* The fill covers the hairline too, so a filled key is one plane of the accent. */}
          <span
            aria-hidden
            data-slot="rating-fill"
            className={cn('absolute -inset-px own:grid place-items-center own:rounded-[inherit] own:bg-current own:text-accent transition-[clip-path] yj-duration-fast ease-standard', clip)}
            style={{ '--share': share, transitionDelay: `${delay(i)}s` } as CSSProperties}
          >
            <Icon className={cn('fill-current own:text-on-accent', ICONS[size])} strokeWidth={1.5} trigger="none" />
          </span>
        </span>
        {interactive && !k.reduced && (
          <span aria-hidden data-slot="rating-glint" className="pointer-events-none absolute -inset-1/2 opacity-0 own:text-accent">
            <svg viewBox="-12 -12 24 24" fill="none" stroke="currentColor" strokeWidth={0.75} strokeLinecap="round" className="size-full">
              <path d={RAYS} />
            </svg>
          </span>
        )}
      </span>
    )
  })

  if (readOnly) {
    return (
      <div
        ref={scope}
        role="img"
        aria-label={aria['aria-label'] ?? (value === 0 ? labels.notRated : labels.ratedOutOf(value, max))}
        data-slot="rating"
        data-readonly=""
        className={cn('own:inline-flex items-center', GAPS[size], className)}
        id={aria.id}
      >
        {icons}
      </div>
    )
  }

  return (
    <div
      ref={scope}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      data-slot="rating"
      data-disabled={disabled || undefined}
      data-reduced-motion={k.reduced || undefined}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText(value)}
      aria-disabled={disabled || undefined}
      {...aria}
      onKeyDown={interactive ? onKeyDown : undefined}
      onPointerMove={interactive ? (event) => event.pointerType !== 'touch' && setPreview(valueAt(event)) : undefined}
      onPointerLeave={() => setPreview(null)}
      onClick={
        interactive
          ? (event) => {
              const next = valueAt(event)
              setPreview(null)
              commit(next === value ? 0 : next)
            }
          : undefined
      }
      className={cn(
        // Padding extends the hit area past the keys; the ring hugs it.
        'own:inline-flex w-fit cursor-pointer items-center own:rounded-lg p-1 own:-m-1 focus-ring',
        GAPS[size],
        'data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className,
      )}
    >
      {icons}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  )
}

export { Rating, type RatingProps, type RatingIcon }
