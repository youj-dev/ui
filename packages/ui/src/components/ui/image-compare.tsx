'use client'

import {
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { animate, type AnimationPlaybackControls } from 'motion/react'
import { ChevronsLeftRightIcon } from '@youj/icons/components/youj/icons/chevrons-left-right'
import { ChevronsUpDownIcon } from '@youj/icons/components/youj/icons/chevrons-up-down'
import { useSoundCue } from '@youj/core'
import { useDirection, useLocale, useYouj } from '@youj/core/lib/youj/provider'
import { imageCompareLabels, useComponentLabels } from '@youj/core/labels'
import { useControllableState } from '../../hooks/use-controllable-state'
import { clamp, cn, numberFormat } from '../../lib/utils'

/* Two pictures stacked, with a divider between them: `before` shows on the
 * start side (or the top) up to the divider, `after` past it. The divider's
 * handle is a slider (0–100, the share of `before` shown). Dragging follows
 * the pointer 1:1; a press elsewhere springs the divider there, a key steps
 * it on a tween, and a value set from outside springs too, all on the
 * provider's tokens so Speed and reduced motion reach them. With `hover` the
 * divider follows a mouse without a press; touch still drags. */

/** An image to show on one side: rendered as a cover-fit <img>. */
interface ImageCompareImage {
  src: string
  alt: string
}

type ImageCompareSide = ReactNode | ImageCompareImage

type Move = 'instant' | 'spring' | 'step'

interface ImageCompareProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  /** Shown on the start side (or the top), up to the divider. A node, or `{ src, alt }` for an image. */
  before: ImageCompareSide
  /** Shown past the divider. A node, or `{ src, alt }` for an image. It sets the component's size. */
  after: ImageCompareSide
  /** The divider's position, 0–100: how much of `before` shows. Controlled. */
  value?: number
  /** The starting position when uncontrolled. Default 50. */
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** `horizontal` (side by side, the default) or `vertical` (stacked, the divider runs across). */
  orientation?: 'horizontal' | 'vertical'
  /** A tag on the `before` side, such as "Before" or "Original". Also names that side in the divider's value text. */
  beforeLabel?: ReactNode
  /** A tag on the `after` side. */
  afterLabel?: ReactNode
  /** The divider follows a mouse without a press. Touch and pen still drag. */
  hover?: boolean
  /** Blocks dragging, hovering and keys, and takes the handle out of the tab order. */
  disabled?: boolean
  /** With sound on (`YoujProvider`’s `sound`), pressing the handle taps and each key step ticks. `false` keeps it silent. Default true. */
  sound?: boolean
}

/** One arrow key's step, and one Page key's. */
const STEP = 5
const PAGE = 20
/** How close to an edge (in percent) the divider must come before it hides that side's tag. */
const TAG_ROOM = 18

const isImage = (side: ImageCompareSide): side is ImageCompareImage =>
  typeof side === 'object' && side !== null && !isValidElement(side) && 'src' in side

function Side({ side }: { side: ImageCompareSide }) {
  if (isImage(side)) return <img src={side.src} alt={side.alt} draggable={false} className="block size-full object-cover" />
  return side
}

function ImageCompare({
  before,
  after,
  value: valueProp,
  defaultValue = 50,
  onValueChange,
  orientation = 'horizontal',
  beforeLabel,
  afterLabel,
  hover = false,
  disabled = false,
  sound = true,
  className,
  style,
  ...props
}: ImageCompareProps) {
  const k = useYouj()
  const labels = useComponentLabels(imageCompareLabels)
  const cue = useSoundCue()
  const locale = useLocale()
  const rtl = useDirection() === 'rtl'
  const vertical = orientation === 'vertical'
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const target = clamp(value, 0, 100)
  // What's drawn: it follows `value`, at once or on the motion tokens.
  const [shown, setShown] = useState(target)
  const [dragging, setDragging] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const current = useRef(target)
  const move = useRef<Move>('spring')
  const motion = useRef<AnimationPlaybackControls>(undefined)
  const drag = useRef(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: only a new value moves the divider; how is read from the ref the change set
  useEffect(() => {
    const how = move.current
    move.current = 'spring'
    motion.current?.stop()
    if (how === 'instant' || k.reduced || current.current === target) {
      current.current = target
      setShown(target)
      return
    }
    motion.current = animate(current.current, target, {
      ...(how === 'step' ? k.tween('fast', 'standard') : k.spring('snappy')),
      onUpdate: (v) => {
        current.current = v
        setShown(v)
      },
    })
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps -- only a new value moves the divider; how is read from the ref the change set

  useEffect(() => () => motion.current?.stop(), [])

  const change = (next: number, how: Move) => {
    const v = Math.round(clamp(next, 0, 100) * 10) / 10
    if (v === target) return
    move.current = how
    setValue(v)
    onValueChange?.(v)
  }

  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const along = vertical ? (event.clientY - box.top) / box.height : (event.clientX - box.left) / box.width
    return clamp((rtl && !vertical ? 1 - along : along) * 100, 0, 100)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || event.button !== 0) return
    const onHandle = (event.target as Element).closest('[data-slot=image-compare-handle]')
    event.currentTarget.setPointerCapture?.(event.pointerId)
    drag.current = true
    setDragging(true)
    if (sound) cue('tap')
    // The handle is picked up where it is; a press elsewhere springs the divider to the pointer.
    if (!onHandle) change(fromPointer(event), 'spring')
    // Keep focus on the handle, so keys work after a press anywhere.
    root.current?.querySelector<HTMLElement>('[role=slider]')?.focus({ preventScroll: true })
    event.preventDefault()
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    if (drag.current || (hover && event.pointerType === 'mouse')) change(fromPointer(event), 'instant')
  }
  const onPointerEnd = () => {
    if (!drag.current) return
    drag.current = false
    setDragging(false)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    // Keys move the divider the way it looks: towards the end (or down) is up the scale.
    const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
    const other = vertical ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowUp'
    const otherBack = vertical ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowDown'
    let next: number | undefined
    if (event.key === forward || event.key === other) next = target + STEP
    else if (event.key === back || event.key === otherBack) next = target - STEP
    else if (event.key === 'PageUp') next = target + PAGE
    else if (event.key === 'PageDown') next = target - PAGE
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = 100
    if (next === undefined) return
    event.preventDefault()
    if (sound && clamp(next, 0, 100) !== target) cue('tick')
    change(next, 'step')
  }

  const percent = (n: number) => numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(n / 100)
  const beforeName = typeof beforeLabel === 'string' ? beforeLabel : labels.imageCompareBefore
  const afterName = typeof afterLabel === 'string' ? afterLabel : labels.imageCompareAfter
  const rest = 100 - shown
  // `before` is cut off at the divider: its far side (end, or bottom) is clipped away.
  const clip = vertical ? `inset(0 0 ${rest}% 0)` : rtl ? `inset(0 0 0 ${rest}%)` : `inset(0 ${rest}% 0 0)`
  const tag =
    'pointer-events-none absolute own:rounded-control own:bg-chrome-float own:px-2 own:py-0.5 own:text-ui-sm own:font-medium own:text-fg own:shadow-sm-soft transition-opacity yj-duration-fast ease-standard'

  return (
    <div
      {...props}
      ref={root}
      data-slot="image-compare"
      data-orientation={orientation}
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        'relative isolate own:overflow-hidden own:rounded-xl own:bg-well select-none',
        // Touch drags along the divider's axis and still scrolls the page across it.
        vertical ? 'touch-pan-x' : 'touch-pan-y',
        disabled ? 'cursor-default' : vertical ? 'cursor-row-resize' : 'cursor-col-resize',
        'data-disabled:opacity-50',
        className,
      )}
      style={{ ...style, '--ui--compare': shown } as CSSProperties}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
    >
      <div data-slot="image-compare-after" className="pointer-events-none size-full">
        <Side side={after} />
      </div>
      <div data-slot="image-compare-before" className="pointer-events-none absolute inset-0" style={{ clipPath: clip }}>
        <Side side={before} />
      </div>
      {beforeLabel != null && (
        <span data-slot="image-compare-label" data-side="before" className={cn(tag, k.reduced && 'transition-none', 'top-3 start-3', shown < TAG_ROOM ? 'opacity-0' : 'opacity-100')}>
          {beforeLabel}
        </span>
      )}
      {afterLabel != null && (
        <span
          data-slot="image-compare-label"
          data-side="after"
          className={cn(tag, k.reduced && 'transition-none', vertical ? 'bottom-3 start-3' : 'top-3 end-3', shown > 100 - TAG_ROOM ? 'opacity-0' : 'opacity-100')}
        >
          {afterLabel}
        </span>
      )}
      {/* A zero-size rail at the divider; the line and the handle center on it. */}
      <div
        data-slot="image-compare-divider"
        className={cn('pointer-events-none absolute own:flex items-center justify-center', vertical ? 'inset-x-0 h-0' : 'inset-y-0 w-0')}
        style={vertical ? { top: `${shown}%` } : { insetInlineStart: `${shown}%` }}
      >
        <span aria-hidden className={cn('absolute own:bg-key own:shadow-sm-soft', vertical ? 'inset-x-0 h-0.5' : 'inset-y-0 w-0.5')} />
        <div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={labels.imageCompare}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(target)}
          aria-valuetext={labels.imageCompareValue(beforeName, percent(target), afterName, percent(100 - target))}
          aria-orientation={orientation}
          aria-disabled={disabled || undefined}
          data-slot="image-compare-handle"
          data-dragging={dragging || undefined}
          className={cn(
            'pointer-events-auto relative own:grid size-control shrink-0 place-items-center own:rounded-full own:border own:border-line own:bg-key own:text-fg own:shadow-md-soft focus-ring',
            'transition-[scale,box-shadow] yj-duration-fast ease-standard',
            'data-dragging:scale-90 data-dragging:own:shadow-sm-soft',
            disabled ? 'cursor-default' : 'cursor-grab data-dragging:cursor-grabbing',
            k.reduced && 'transition-none',
          )}
          onKeyDown={onKeyDown}
        >
          {vertical ? <ChevronsUpDownIcon size={18} /> : <ChevronsLeftRightIcon size={18} />}
        </div>
      </div>
    </div>
  )
}

export { ImageCompare, type ImageCompareProps, type ImageCompareImage, type ImageCompareSide }
