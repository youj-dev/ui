'use client'

import { useEffect, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { animate, type AnimationPlaybackControls } from 'motion/react'
import { useSoundCue, type Size } from '@youj/core'
import { useDirection, useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels, wheelPickerLabels } from '@youj/core/labels'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'

/* A drum of values you spin: one or more columns side by side, the chosen row
 * of each in one band across the middle, the rows above and below curving
 * away in 3D and fading. Drag (touch, pen or mouse) moves a column 1:1; on
 * release it carries on with the flick's momentum and comes to rest on a row,
 * the momentum decaying over the `slow` duration and a release past either
 * end springing back on the `smooth` spring. The wheel and trackpad scroll it
 * and it settles on a row once they stop; a click on a row springs it to the
 * band. Each column is a spinbutton: ArrowUp turns to the next row,
 * ArrowDown to the one before, Page Up and Down by five, Home and End to the
 * ends, and typing jumps to the row that starts with what was typed. The value
 * is committed when the column is let go, not when it stops. With `loop` a
 * column wraps around. Reduced motion: no momentum, every move lands at once.
 * Every row passed ticks (`sound`). */

interface WheelPickerOption {
  value: string
  /** What the row shows; also the value read out and what type-ahead matches. */
  label: string
  /** Shown, but skipped: the wheel never rests on it. */
  disabled?: boolean
}

interface WheelPickerColumn {
  /** The key of this column's value in `value`. */
  id: string
  /** The column's accessible name, such as "Hours". */
  label: string
  options: WheelPickerOption[]
}

type WheelPickerSize = Extract<Size, 'sm' | 'default' | 'lg'>

interface WheelPickerBaseProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  /** Every column wraps around: past the last row comes the first. */
  loop?: boolean
  /** The row height and type size. Default `default`. */
  size?: WheelPickerSize
  /** Blocks dragging, scrolling and keys, and takes the columns out of the tab order. */
  disabled?: boolean
  /** With sound on (`YoujProvider`’s `sound`), every row that passes the band ticks. `false` keeps it silent. Default true. */
  sound?: boolean
}

interface WheelPickerColumnsProps extends WheelPickerBaseProps {
  /** The wheels, start to end. */
  columns: WheelPickerColumn[]
  /** The chosen value of each column, by column id. Controlled. */
  value?: Record<string, string>
  /** The starting values when uncontrolled. A column left out starts on its first row it can rest on. */
  defaultValue?: Record<string, string>
  onValueChange?: (value: Record<string, string>) => void
  options?: never
  label?: never
}

interface WheelPickerSingleProps extends WheelPickerBaseProps {
  /** One wheel's rows: the shorthand for a single column. */
  options: WheelPickerOption[]
  /** The wheel's accessible name. Default "Value" (translated). */
  label?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  columns?: never
}

type WheelPickerProps = WheelPickerColumnsProps | WheelPickerSingleProps

/** Degrees between neighbouring rows on the drum. */
const ANGLE = 20
/** Rows drawn either side of the band; past them a row has turned out of sight. */
const REACH = 4
/** The drum's radius in rows, so neighbouring rows sit a row apart at the band. */
const RADIUS = 1 / (2 * Math.tan(((ANGLE / 2) * Math.PI) / 180))
/** The rows a Page key turns. */
const PAGE = 5
/** How long the wheel must be still before the column settles, in ms. */
const WHEEL_IDLE = 140
/** How long typed letters keep adding to one search, in ms. */
const TYPE_AHEAD = 700
/** A drag shorter than this many pixels is a click. */
const CLICK_SLOP = 4
/** How far past either end a drag can pull, in rows, and how hard it pulls. */
const STRETCH = 1.5

const ROW: Record<WheelPickerSize, string> = {
  sm: 'var(--spacing-control-sm)',
  default: 'var(--spacing-control)',
  lg: 'var(--spacing-control-lg)',
}
/** The row height in pixels where layout can't be read (tests). */
const ROW_FALLBACK: Record<WheelPickerSize, number> = { sm: 28, default: 32, lg: 40 }
const TEXT: Record<WheelPickerSize, string> = { sm: 'own:text-ui-sm', default: 'own:text-ui', lg: 'own:text-ui-lg' }

const SINGLE = 'value'

const wrap = (i: number, n: number) => ((i % n) + n) % n

/** A pull past the end that gives less the further it goes. */
const stretch = (over: number) => STRETCH * (1 - 1 / (1 + over / STRETCH))

interface WheelProps {
  column: WheelPickerColumn
  value: string | undefined
  onPick: (value: string) => void
  loop: boolean
  size: WheelPickerSize
  disabled: boolean
  sound: boolean
  onSibling: (from: HTMLElement, by: 1 | -1) => void
}

function Wheel({ column, value, onPick, loop, size, disabled, sound, onSibling }: WheelProps) {
  const k = useYouj()
  const cue = useSoundCue()
  const { options } = column
  const n = options.length
  const enabled = (p: number) => n > 0 && !options[wrap(p, n)]?.disabled

  /** The nearest row from `start` in direction `dir` that the wheel can rest on, or null. */
  const restFrom = (start: number, dir: 1 | -1): number | null => {
    for (let i = 0; i < n; i++) {
      const p = start + dir * i
      if (!loop && (p < 0 || p > n - 1)) return null
      if (enabled(p)) return p
    }
    return null
  }
  /** The restable row nearest `p`, looking both ways. */
  const nearest = (p: number) => {
    const at = loop ? Math.round(p) : Math.min(n - 1, Math.max(0, Math.round(p)))
    const down = restFrom(at, 1)
    const up = restFrom(at, -1)
    if (down === null) return up ?? at
    if (up === null) return down
    return Math.abs(down - p) <= Math.abs(up - p) ? down : up
  }

  const found = options.findIndex((o) => o.value === value)
  const index = found >= 0 ? found : (restFrom(0, 1) ?? 0)

  const [pos, setPosState] = useState(index)
  const [dragging, setDragging] = useState(false)
  const posRef = useRef(index)
  /** The row the column is heading for (or resting on). */
  const aim = useRef(index)
  const lastRow = useRef(index)
  const motion = useRef<AnimationPlaybackControls>(undefined)
  const el = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; y: number; from: number; moved: boolean; samples: { y: number; t: number }[] } | null>(null)
  const wheelIdle = useRef<ReturnType<typeof setTimeout>>(undefined)
  const typed = useRef({ text: '', at: 0 })

  const setPos = (v: number) => {
    posRef.current = v
    const row = Math.round(v)
    if (row !== lastRow.current) {
      lastRow.current = row
      if (sound) cue('tick')
    }
    setPosState(v)
  }

  const rowHeight = () => el.current?.querySelector<HTMLElement>('[data-slot=wheel-picker-item]')?.offsetHeight || ROW_FALLBACK[size]

  /** The position of row `i` nearest to `from`: in a loop, the copy of it the shorter way round. */
  const toward = (from: number, i: number) => {
    if (!loop) return i
    const delta = wrap(i - wrap(from, n), n)
    return from + (delta > n / 2 ? delta - n : delta)
  }

  /** Heads for row `target` (a position: in a loop it may lie outside 0…n−1) and commits its value. */
  const aimAt = (target: number) => {
    motion.current?.stop()
    aim.current = target
    const next = options[wrap(target, n)]
    if (next && next.value !== value) onPick(next.value)
  }

  /** Turns to row `target` on the smooth spring, or at once under reduced motion. */
  const settle = (target: number, velocity = 0) => {
    aimAt(target)
    if (k.reduced) return setPos(target)
    motion.current = animate(posRef.current, target, { ...k.spring('smooth'), velocity, restDelta: 0.001, onUpdate: setPos })
  }

  /** A flick: carry on with its momentum, decaying onto the restable row it would reach. */
  const coast = (velocity: number) => {
    const from = posRef.current
    const outside = !loop && (from < 0 || from > n - 1)
    if (k.reduced || outside || Math.abs(velocity) < 0.5) return settle(nearest(outside || k.reduced ? from : from + velocity * 0.1), outside ? velocity : 0)
    const target = nearest(from + velocity * 0.8)
    aimAt(target)
    motion.current = animate(from, target, {
      type: 'inertia',
      velocity,
      power: 0.8,
      timeConstant: k.ms('slow'),
      modifyTarget: () => target,
      restDelta: 0.001,
      onUpdate: setPos,
    })
  }

  // A value from outside turns the wheel there; one this wheel picked is already its aim.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only a new index moves the wheel; settle reads the rest when it runs
  useEffect(() => {
    if (n === 0 || wrap(aim.current, n) === index) return
    settle(toward(aim.current, index))
  }, [index]) // eslint-disable-line react-hooks/exhaustive-deps -- only a new index moves the wheel; settle reads the rest when it runs

  useEffect(
    () => () => {
      motion.current?.stop()
      clearTimeout(wheelIdle.current)
    },
    [],
  )

  // The wheel needs a listener that can cancel the page's scroll, which React's onWheel can't; it reads the latest props through a ref.
  const onWheelRef = useRef((_: WheelEvent) => {})
  useEffect(() => {
    const node = el.current
    if (!node) return
    const onWheel = (event: WheelEvent) => onWheelRef.current(event)
    node.addEventListener('wheel', onWheel, { passive: false })
    return () => node.removeEventListener('wheel', onWheel)
  }, [])
  onWheelRef.current = (event: WheelEvent) => {
    if (disabled || n === 0 || event.deltaY === 0) return
    event.preventDefault()
    motion.current?.stop()
    const rows = event.deltaMode === 1 ? event.deltaY : event.deltaY / rowHeight()
    const next = posRef.current + rows
    setPos(loop ? next : Math.min(n - 1, Math.max(0, next)))
    clearTimeout(wheelIdle.current)
    wheelIdle.current = setTimeout(() => settle(nearest(posRef.current)), WHEEL_IDLE)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || n === 0 || (event.pointerType === 'mouse' && event.button !== 0)) return
    motion.current?.stop()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    drag.current = { id: event.pointerId, y: event.clientY, from: posRef.current, moved: false, samples: [{ y: event.clientY, t: event.timeStamp }] }
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    const dy = event.clientY - d.y
    if (!d.moved && Math.abs(dy) < CLICK_SLOP) return
    if (!d.moved) setDragging(true)
    d.moved = true
    d.samples = [...d.samples.filter((s) => event.timeStamp - s.t < 100), { y: event.clientY, t: event.timeStamp }]
    let next = d.from - dy / rowHeight()
    if (!loop && next < 0) next = -stretch(-next)
    if (!loop && next > n - 1) next = n - 1 + stretch(next - (n - 1))
    setPos(next)
  }
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== event.pointerId) return
    drag.current = null
    setDragging(false)
    if (!d.moved) {
      // A click: the row under the pointer comes to the band.
      const row = (event.target as Element).closest<HTMLElement>('[data-slot=wheel-picker-item]')
      const at = row ? Number(row.dataset.index) : Number.NaN
      return settle(Number.isNaN(at) || !enabled(at) ? nearest(posRef.current) : at)
    }
    // Only the last tenth of a second counts: a drag that stopped before letting go has no momentum.
    const recent = [...d.samples.filter((s) => event.timeStamp - s.t < 100), { y: event.clientY, t: event.timeStamp }]
    const first = recent[0]
    const last = recent[recent.length - 1]
    const span = (last?.t ?? 0) - (first?.t ?? 0)
    // Rows per second, positive towards the later rows (dragging up).
    const velocity = first && last && span > 0 ? -((last.y - first.y) / rowHeight()) / (span / 1000) : 0
    coast(velocity)
  }
  const onPointerCancel = () => {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    settle(nearest(posRef.current))
  }

  const go = (target: number, dir: 1 | -1) => {
    const p = restFrom(target, dir) ?? restFrom(target, dir === 1 ? -1 : 1)
    if (p !== null && p !== aim.current) settle(p)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled || n === 0) return
    const at = aim.current
    switch (event.key) {
      case 'ArrowUp':
        go(at + 1, 1)
        break
      case 'ArrowDown':
        go(at - 1, -1)
        break
      case 'PageUp':
        go(loop ? at + PAGE : Math.min(n - 1, at + PAGE), 1)
        break
      case 'PageDown':
        go(loop ? at - PAGE : Math.max(0, at - PAGE), -1)
        break
      case 'Home':
        go(toward(at, 0), 1)
        break
      case 'End':
        go(toward(at, n - 1), -1)
        break
      case 'ArrowLeft':
      case 'ArrowRight':
        onSibling(event.currentTarget, event.key === 'ArrowRight' ? 1 : -1)
        break
      default: {
        if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return
        const now = event.timeStamp
        const fresh = now - typed.current.at > TYPE_AHEAD
        const text = (fresh ? '' : typed.current.text) + event.key.toLocaleLowerCase()
        typed.current = { text, at: now }
        // A fresh letter looks past the current row, so pressing it again moves on to the next match.
        const start = wrap(at, n) + (text.length === 1 ? 1 : 0)
        for (let i = 0; i < n; i++) {
          const j = wrap(start + i, n)
          const o = options[j]
          if (o && !o.disabled && o.label.toLocaleLowerCase().startsWith(text)) {
            if (j !== wrap(at, n)) settle(toward(at, j))
            event.preventDefault()
            return
          }
        }
        return
      }
    }
    event.preventDefault()
  }

  const rows = []
  for (let r = Math.ceil(pos - REACH); r <= Math.floor(pos + REACH); r++) {
    if (n === 0 || (!loop && (r < 0 || r > n - 1))) continue
    const o = options[wrap(r, n)]
    if (!o) continue
    const angle = (r - pos) * ANGLE
    const facing = Math.max(0, Math.cos((angle * Math.PI) / 180))
    rows.push(
      <div
        key={r}
        data-slot="wheel-picker-item"
        data-index={r}
        data-selected={Math.abs(r - pos) < 0.5 || undefined}
        data-disabled={o.disabled || undefined}
        aria-disabled={o.disabled || undefined}
        className={cn(
          'absolute inset-x-0 top-[calc(50%-var(--ui--wheel-row)/2)] own:flex h-(--ui--wheel-row) items-center justify-center own:px-3 whitespace-nowrap backface-hidden',
          'own:text-fg data-selected:font-medium data-disabled:own:text-fg-muted',
        )}
        style={{
          transform: `translateZ(calc(var(--ui--wheel-radius) * -1)) rotateX(${-angle}deg) translateZ(var(--ui--wheel-radius))`,
          // Rows turn away and fade; the ones too faint to read at 4.5:1 (under 0.7 on a light page) drop out instead of lingering.
          opacity: facing * facing < 0.7 ? 0 : facing * facing * (o.disabled ? 0.7 : 1),
        }}
      >
        {o.label}
      </div>,
    )
  }

  const current = options[index]
  return (
    <div
      ref={el}
      role="spinbutton"
      tabIndex={disabled || n === 0 ? -1 : 0}
      aria-label={column.label}
      aria-valuemin={0}
      aria-valuemax={Math.max(0, n - 1)}
      aria-valuenow={index}
      aria-valuetext={current?.label}
      aria-disabled={disabled || undefined}
      data-slot="wheel-picker-column"
      data-id={column.id}
      data-dragging={dragging || undefined}
      className={cn(
        'relative own:h-[calc(var(--ui--wheel-row)*5)] min-w-0 flex-1 touch-none overflow-hidden own:rounded-lg outline-none focus-ring',
        disabled ? 'cursor-default' : 'cursor-grab data-dragging:cursor-grabbing',
      )}
      style={{ perspective: 'calc(var(--ui--wheel-row) * 12)' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
    >
      {/* Every label, unseen, so the widest sets the column's width and spinning never changes it. */}
      <div aria-hidden className="invisible own:grid h-0 overflow-hidden">
        {options.map((o) => (
          <span key={o.value} className="col-start-1 row-start-1 own:px-3 whitespace-nowrap own:font-medium">
            {o.label}
          </span>
        ))}
      </div>
      <div aria-hidden className="absolute inset-0 transform-3d">
        {rows}
      </div>
    </div>
  )
}

function WheelPicker(props: WheelPickerProps) {
  const {
    columns: columnsProp,
    options,
    label,
    value: valueProp,
    defaultValue,
    onValueChange,
    loop = false,
    size = 'default',
    disabled = false,
    sound = true,
    className,
    style,
    ...rest
  } = props as WheelPickerBaseProps & {
    columns?: WheelPickerColumn[]
    options?: WheelPickerOption[]
    label?: string
    value?: string | Record<string, string>
    defaultValue?: string | Record<string, string>
    onValueChange?: (value: never) => void
  }
  const labels = useComponentLabels(wheelPickerLabels)
  const rtl = useDirection() === 'rtl'
  const single = !columnsProp
  const columns = useMemo(
    () => columnsProp ?? [{ id: SINGLE, label: label ?? labels.wheelPicker, options: options ?? [] }],
    [columnsProp, options, label, labels.wheelPicker],
  )
  const asRecord = (v: string | Record<string, string> | undefined) => (typeof v === 'string' ? { [SINGLE]: v } : v)
  const [value, setValue] = useControllableState(asRecord(valueProp), asRecord(defaultValue) ?? {})

  const pick = (id: string, next: string) => {
    const record = { ...value, [id]: next }
    setValue(record)
    ;(onValueChange as ((v: string | Record<string, string>) => void) | undefined)?.(single ? next : record)
  }

  const onSibling = (from: HTMLElement, by: 1 | -1) => {
    const all = [...(from.parentElement?.querySelectorAll<HTMLElement>('[data-slot=wheel-picker-column]') ?? [])]
    all[all.indexOf(from) + (rtl ? -by : by)]?.focus()
  }

  return (
    <div
      role={single ? undefined : 'group'}
      {...rest}
      data-slot="wheel-picker"
      data-size={size}
      data-disabled={disabled || undefined}
      data-yj-loop={loop || undefined}
      className={cn('relative isolate own:inline-flex own:gap-1 own:px-1 select-none own:tabular-nums', TEXT[size], 'data-disabled:opacity-50', className)}
      style={{ ...style, '--ui--wheel-row': ROW[size], '--ui--wheel-radius': `calc(var(--ui--wheel-row) * ${RADIUS.toFixed(4)})` } as CSSProperties}
    >
      <div aria-hidden data-slot="wheel-picker-band" className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-(--ui--wheel-row) -translate-y-1/2 own:rounded-control own:bg-selected" />
      {columns.map((column) => (
        <Wheel
          key={column.id}
          column={column}
          value={value[column.id]}
          onPick={(next) => pick(column.id, next)}
          loop={loop}
          size={size}
          disabled={disabled}
          sound={sound}
          onSibling={onSibling}
        />
      ))}
    </div>
  )
}

export { WheelPicker, type WheelPickerProps, type WheelPickerColumnsProps, type WheelPickerSingleProps, type WheelPickerColumn, type WheelPickerOption, type WheelPickerSize }
