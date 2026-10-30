'use client'

import { AnimatePresence, m } from 'motion/react'
import { useId, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { allocationMeterLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat, toneColor } from '../../lib/utils'

/* Budget envelopes as a rack of cells, one column each: the cells hold what's
 * left of the envelope and drain from the top as it's spent. Money rolled
 * over from last month sits on top, hatched, and goes first. An envelope
 * spent past empty spills: its base turns the danger tone and cells drip
 * under it, one for each tenth of the envelope it's over, up to three.
 * - Moving money: drag from one envelope onto another, or from the keyboard
 *   pick one up with Space, choose where with the arrows (mirrored in RTL),
 *   change the amount with Up and Down, and Enter to move it (Escape
 *   cancels). While money is in hand the cells it would take dim in the
 *   source and the cells it would add show as a ghost in the target; on the
 *   drop a chip carries the amount across, and both columns relight from
 *   their edges. `onMove` gets the move; the app updates the budgets.
 * - Every step is announced; each envelope is a button named by what it has
 *   left, of what.
 * - Reduced motion: cells light at once and no chip travels. */

type EnvelopeTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface Envelope {
  id: string
  name: string
  /** This period's budget. */
  budget: number
  /** Spent so far. Past `budget` plus `rollover`, the envelope spills. */
  spent: number
  /** Carried over from last period: on top of the budget, hatched. */
  rollover?: number
  /** A glyph beside the name. */
  icon?: ReactNode
  /** Default: the chart colors in turn. */
  tone?: EnvelopeTone
}

interface AllocationMeterProps extends Omit<ComponentProps<'div'>, 'children'> {
  envelopes: Envelope[]
  /** Money moved from one envelope to another; update the budgets. Without it nothing moves. */
  onMove?: (from: string, to: string, amount: number) => void
  /** What one drop or one Up press carries. Default 10. */
  step?: number
  /** Cells per envelope. Default 16. */
  segments?: number
  /** Intl.NumberFormat options for the amounts. Default: US dollars, whole. */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: string
  /** The rack's accessible name. Default "Envelopes". */
  label?: string
  /** With sound on, a drop plays `select`. Default true. */
  sound?: boolean
  /** The row under the rack: a readout of the envelope in focus or under the pointer, and the rollover and overspent swatches. Default true. */
  legend?: boolean
}

interface Carry {
  from: string
  to?: string
  amount: number
  /** Where a pointer drag is, inside the rack. */
  x?: number
  y?: number
}

const TONES: EnvelopeTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
const toneVar = (tone: EnvelopeTone) => toneColor(tone, 'var(--color-fg-muted)')
/** An empty cell: a quiet ink wash, lighter than a meter's well since a column is mostly empty space. */
const OFF = 'bg-[color-mix(in_oklab,var(--color-fg)_calc(9%-2.5%*var(--yj-dark)),transparent)]'
const HATCH =
  '[background-image:repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--envelope-tone)_80%,transparent)_0_1.5px,transparent_1.5px_4.5px)] bg-[color-mix(in_oklab,var(--envelope-tone)_16%,transparent)]'
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'

const leftOf = (e: Envelope) => e.budget + (e.rollover ?? 0) - e.spent

function AllocationMeter({ envelopes, onMove, step = 10, segments = 16, format, locale: localeProp, label, sound = true, legend = true, className, style, ...props }: AllocationMeterProps) {
  const k = useYouj()
  const cue = useSoundCue()
  const labels = useComponentLabels(allocationMeterLabels)
  const locale = useLocale(localeProp)
  const { announce, announcer } = useAnnouncer()
  const hintId = useId()
  const rackRef = useRef<HTMLDivElement>(null)
  const refs = useRef(new Map<string, HTMLButtonElement>())
  const [focused, setFocused] = useState<string>()
  const [pointed, setPointed] = useState<string>()
  const [inside, setInside] = useState(false)
  const [carry, setCarry] = useState<Carry>()
  const [packet, setPacket] = useState<{ key: number; amount: number; from: DOMRect; to: DOMRect; rack: DOMRect }>()
  const press = useRef<{ id: string; x: number; y: number; pointer: number }>(undefined)

  const money = numberFormat(locale, format ?? { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  const byId = new Map(envelopes.map((e, i) => [e.id, { envelope: e, index: i }]))
  const nameOf = (id?: string) => (id ? (byId.get(id)?.envelope.name ?? '') : '')
  const tabStop = focused && byId.has(focused) ? focused : envelopes[0]?.id

  // Each column's lit cells last time, so a change relights from where its edge was.
  const lit = (e: Envelope) => {
    const capacity = e.budget + (e.rollover ?? 0)
    return capacity > 0 ? Math.max(0, Math.min(segments, Math.round((leftOf(e) / capacity) * segments))) : 0
  }
  const before = useRef(new Map(envelopes.map((e) => [e.id, lit(e)])))
  const edges = new Map(envelopes.map((e) => [e.id, before.current.get(e.id) ?? lit(e)]))
  useLayoutEffect(() => {
    before.current = new Map(envelopes.map((e) => [e.id, lit(e)]))
  })

  const pick = (id: string) => {
    const e = byId.get(id)?.envelope
    if (!e || !onMove || leftOf(e) <= 0) return false
    const amount = Math.min(step, leftOf(e))
    const others = envelopes.filter((x) => x.id !== id)
    const i = byId.get(id)!.index
    const to = (envelopes.slice(i + 1).find((x) => x.id !== id) ?? others.at(-1))?.id
    setCarry({ from: id, to, amount })
    announce(labels.envelopePickedUp(money.format(amount), e.name))
    return true
  }
  const drop = () => {
    if (!carry?.to || carry.to === carry.from || !onMove) return cancel()
    const fromEl = refs.current.get(carry.from)
    const toEl = refs.current.get(carry.to)
    if (!k.reduced && fromEl && toEl && rackRef.current)
      setPacket({ key: Date.now(), amount: carry.amount, from: fromEl.getBoundingClientRect(), to: toEl.getBoundingClientRect(), rack: rackRef.current.getBoundingClientRect() })
    onMove(carry.from, carry.to, carry.amount)
    if (sound) cue('select')
    announce(labels.envelopeMoved(money.format(carry.amount), nameOf(carry.from), nameOf(carry.to)))
    setCarry(undefined)
  }
  const cancel = () => {
    if (!carry) return
    announce(labels.envelopeMoveCancelled)
    const from = carry.from
    setCarry(undefined)
    refs.current.get(from)?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).dataset.envelope
    if (!id) return
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
    const dir = e.key === 'ArrowRight' ? (rtl ? -1 : 1) : e.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0
    if (carry) {
      if (dir) {
        const pool = envelopes.filter((x) => x.id !== carry.from)
        const at = pool.findIndex((x) => x.id === carry.to)
        const next = pool[Math.min(pool.length - 1, Math.max(0, at + dir))]
        if (next) {
          setCarry({ ...carry, to: next.id })
          refs.current.get(next.id)?.focus()
          announce(labels.envelopeTarget(money.format(carry.amount), nameOf(carry.from), next.name))
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        const most = Math.max(0, leftOf(byId.get(carry.from)!.envelope))
        const amount = Math.min(most, Math.max(Math.min(step, most), carry.amount + (e.key === 'ArrowUp' ? step : -step)))
        setCarry({ ...carry, amount })
        announce(labels.envelopeTarget(money.format(amount), nameOf(carry.from), nameOf(carry.to)))
      } else if (e.key === 'Enter' || e.key === ' ') drop()
      else if (e.key === 'Escape') cancel()
      else return
      e.preventDefault()
      return
    }
    const i = byId.get(id)!.index
    let next: Envelope | undefined
    if (dir) next = envelopes[i + dir]
    else if (e.key === 'Home') next = envelopes[0]
    else if (e.key === 'End') next = envelopes.at(-1)
    else if ((e.key === ' ' || e.key === 'Enter') && pick(id)) {
      e.preventDefault()
      return
    }
    if (!next) return
    e.preventDefault()
    refs.current.get(next.id)?.focus()
  }

  // A drag: press on an envelope, move past a few pixels, and the envelope under the pointer is the target.
  const targetAt = (x: number) =>
    [...refs.current].find(([, el]) => {
      const r = el.getBoundingClientRect()
      return x >= r.left && x <= r.right
    })?.[0]
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>('[data-envelope]')?.dataset.envelope
    if (!id || e.button !== 0 || !onMove) return
    press.current = { id, x: e.clientX, y: e.clientY, pointer: e.pointerId }
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = press.current
    const rack = rackRef.current?.getBoundingClientRect()
    if (!p || !rack) return
    if (!carry) {
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6 || !pick(p.id)) return
      e.currentTarget.setPointerCapture(p.pointer)
    }
    const over = targetAt(e.clientX)
    setCarry((c) => c && { ...c, to: over && over !== c.from ? over : undefined, x: e.clientX - rack.left, y: e.clientY - rack.top })
  }
  const onPointerUp = () => {
    press.current = undefined
    if (carry) (carry.to ? drop() : cancel())
  }

  return (
    <MotionFeatures>
      <div
        ref={rackRef}
        role="group"
        aria-label={label ?? labels.envelopes}
        aria-describedby={onMove ? hintId : undefined}
        data-slot="allocation-meter"
        data-carrying={carry ? '' : undefined}
        data-reduced-motion={k.reduced || undefined}
        className={cn('relative own:flex touch-pan-y flex-col gap-3 select-none', carry?.x !== undefined && 'cursor-grabbing', className)}
        style={style}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => ((press.current = undefined), cancel())}
        onFocus={() => setInside(true)}
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
          setInside(false)
          if (carry && carry.x === undefined) cancel()
        }}
        {...props}
      >
        {onMove && (
          <span id={hintId} className="sr-only">
            {labels.envelopeHint}
          </span>
        )}
        <div data-slot="allocation-meter-rack" className="own:flex gap-2 sm:gap-3">
        {envelopes.map((e, index) => {
          const tone = toneVar(e.tone ?? TONES[index % TONES.length]!)
          const capacity = e.budget + (e.rollover ?? 0)
          const left = leftOf(e)
          const over = left < 0
          const count = lit(e)
          const edge = edges.get(e.id) ?? count
          const budgetCells = capacity > 0 ? Math.round((e.budget / capacity) * segments) : segments
          const spill = over ? Math.min(3, Math.max(1, Math.ceil((-left / Math.max(1, capacity)) * 10))) : 0
          const cellMs = k.reduced ? 0 : k.ms('deliberate') / segments
          const isSource = carry?.from === e.id
          const isTarget = carry?.to === e.id
          const lifted = isSource && capacity > 0 ? Math.min(count, Math.round((carry!.amount / capacity) * segments) || 1) : 0
          const incoming = isTarget && capacity > 0 ? Math.min(segments - count, Math.max(1, Math.round((carry!.amount / capacity) * segments))) : 0
          const low = !over && capacity > 0 && left / capacity < 0.15
          return (
            <button
              key={e.id}
              type="button"
              ref={(el: HTMLButtonElement | null) => void (el ? refs.current.set(e.id, el) : refs.current.delete(e.id))}
              data-slot="allocation-meter-envelope"
              data-envelope={e.id}
              data-state={over ? 'over' : low ? 'low' : 'ok'}
              data-source={isSource || undefined}
              data-target={isTarget || undefined}
              tabIndex={e.id === tabStop ? 0 : -1}
              // The figure and name as shown, then the sentence.
              aria-label={`${over ? `−${money.format(-left)}` : money.format(left)} ${e.name}, ${over ? labels.envelopeOver(money.format(-left)) : labels.envelopeOf(money.format(left), money.format(capacity))}${e.rollover ? `, ${labels.envelopeRollover(money.format(e.rollover))}` : ''}`}
              onFocus={() => setFocused(e.id)}
              onPointerEnter={() => setPointed(e.id)}
              onPointerLeave={() => setPointed(undefined)}
              className={cn(
                'focus-ring group/envelope relative own:flex min-w-0 flex-1 flex-col items-stretch gap-2 rounded-xl px-1.5 pt-2 pb-2.5 own:text-start transition-[background-color,box-shadow] yj-duration-fast ease-standard sm:px-2',
                onMove ? 'cursor-grab' : 'cursor-default',
                isTarget ? 'bg-hover shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--envelope-tone)_45%,transparent)]' : 'hover:bg-hover',
              )}
              style={{ '--envelope-tone': tone } as CSSProperties}
            >
              <span
                data-slot="allocation-meter-value"
                dir="ltr"
                className={cn('truncate own:text-center own:font-mono own:text-ui-sm own:font-medium own:tabular-nums', over ? 'own:text-danger-text' : low ? 'own:text-warning-text' : 'own:text-fg')}
              >
                {over ? `−${money.format(-left)}` : money.format(left)}
              </span>
              <span data-slot="allocation-meter-track" aria-hidden className="relative own:flex h-36 flex-col-reverse gap-[3px] sm:h-40">
                {Array.from({ length: segments }, (_, i) => {
                  const on = i < count
                  const rolled = i >= budgetCells
                  const dim = on && i >= count - lifted
                  const ghost = !on && i < count + incoming
                  // Relight from the old edge outward, one cell at a time.
                  const delay = count > edge && i >= edge && i < count ? (i - edge) * cellMs : count < edge && i >= count && i < edge ? (edge - 1 - i) * cellMs : 0
                  return (
                    <span
                      key={i}
                      data-slot="allocation-meter-cell"
                      data-state={on ? 'on' : 'off'}
                      data-rollover={rolled || undefined}
                      className={cn(
                        'min-h-0 flex-1 rounded-[2px] transition-[background-color,opacity,box-shadow] yj-duration-fast ease-standard',
                        on ? (rolled ? HATCH : low ? 'bg-warning' : 'bg-(--envelope-tone)') : OFF,
                        on && !rolled && !low && 'opacity-90',
                        dim && 'opacity-35',
                        ghost && 'shadow-[inset_0_0_0_1px_var(--envelope-tone)]',
                        over && 'bg-[color-mix(in_oklab,var(--color-danger)_12%,transparent)]',
                      )}
                      style={delay ? { transitionDelay: `${Math.round(delay)}ms` } : undefined}
                    />
                  )
                })}
              </span>
              <span
                data-slot="allocation-meter-base"
                aria-hidden
                className={cn('h-0.5 rounded-full transition-[background-color] yj-duration-fast ease-standard', over ? 'bg-danger' : 'bg-well')}
              />
              <span data-slot="allocation-meter-spill" aria-hidden className="own:-mt-1 own:flex h-4 flex-col items-center gap-[3px]">
                {Array.from({ length: spill }, (_, i) => (
                  <m.span
                    key={i}
                    className="h-[3px] rounded-full bg-danger"
                    style={{ width: `${70 - i * 22}%`, opacity: 1 - i * 0.25 }}
                    initial={k.reduced ? false : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={k.reduced ? { type: false } : { ...k.tween('base', 'enter'), delay: i * k.stagger('base') }}
                  />
                ))}
              </span>
              {/* A column too narrow for its name shows the icon alone (the button's label still names it) rather than a letter and an ellipsis. */}{' '}
              <span data-slot="allocation-meter-label" className={cn('@container own:flex w-full min-w-0 items-center justify-center gap-1.5 own:text-ui-xs own:text-fg-muted', VOICE)}>
                {e.icon && (
                  <span aria-hidden className="shrink-0 own:text-(--envelope-tone) [&_svg]:size-3.5">
                    {e.icon}
                  </span>
                )}
                <span className={cn('truncate', e.icon && 'own:@max-[4.5rem]:hidden')}>{e.name}</span>
              </span>
              {isTarget && carry && (
                <span
                  aria-hidden
                  data-slot="allocation-meter-ghost"
                  className="absolute inset-x-1 -top-3 z-10 own:mx-auto w-fit rounded-full bg-fg px-2 py-0.5 own:font-mono own:text-ui-xs own:font-medium own:text-canvas own:tabular-nums shadow-sm"
                >
                  +{money.format(carry.amount)}
                </span>
              )}
            </button>
          )
        })}
        </div>

        {legend && <Readout envelope={byId.get(pointed ?? (inside ? (focused ?? '') : ''))?.envelope} money={money} labels={labels} />}

        {/* The drag's chip, under the pointer. */}
        {carry?.x !== undefined && carry.y !== undefined && (
          <span
            aria-hidden
            data-slot="allocation-meter-carry"
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[140%] rounded-full bg-fg px-2.5 py-1 own:font-mono own:text-ui-xs own:font-medium own:text-canvas own:tabular-nums shadow-md"
            style={{ left: carry.x, top: carry.y }}
          >
            {money.format(carry.amount)}
          </span>
        )}

        {/* On the drop, the amount travels from the source to the target. */}
        <AnimatePresence>
          {packet && (
            <m.span
              key={packet.key}
              aria-hidden
              data-slot="allocation-meter-packet"
              className="pointer-events-none absolute z-20 rounded-full bg-fg px-2 py-0.5 own:font-mono own:text-ui-xs font-medium text-canvas own:tabular-nums shadow-md"
              style={{ left: packet.from.left - packet.rack.left + packet.from.width / 2, top: -6, translateX: '-50%' }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.8 }}
              animate={{ x: packet.to.left - packet.from.left, y: [0, -14, 0], opacity: [0, 1, 1, 0], scale: 1 }}
              transition={k.tween('slow', 'emphasized')}
              onAnimationComplete={() => setPacket(undefined)}
            >
              {money.format(packet.amount)}
            </m.span>
          )}
        </AnimatePresence>
        {announcer}
      </div>
    </MotionFeatures>
  )
}

/** Under the rack: the envelope in focus or under the pointer, in mono, and the swatches for rollover and overspend. */
function Readout({ envelope, money, labels }: { envelope?: Envelope; money: Intl.NumberFormat; labels: typeof allocationMeterLabels }) {
  const left = envelope ? leftOf(envelope) : 0
  return (
    <div data-slot="allocation-meter-footer" aria-hidden className="own:flex min-h-5 flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <p data-slot="allocation-meter-readout" className="own:flex min-w-0 items-baseline gap-2 own:font-mono own:text-ui-sm own:text-fg-muted own:tabular-nums">
        {envelope && (
          <>
            <span className="truncate own:text-fg">{envelope.name}</span>
            <span className="own:text-fg-subtle">·</span>
            <span className={cn(left < 0 && 'own:text-danger-text')}>{left < 0 ? labels.envelopeOver(money.format(-left)) : labels.envelopeLeft(money.format(left))}</span>
          </>
        )}
      </p>
      <div data-slot="allocation-meter-legend" className={cn('own:flex items-center gap-3 own:text-ui-xs own:text-fg-muted', VOICE)}>
        <span className="own:flex items-center gap-1.5">
          <span className={cn('h-2.5 w-4 rounded-[2px] [--envelope-tone:var(--color-fg-muted)]', HATCH)} />
          {labels.envelopeRolloverTag}
        </span>
        <span className="own:flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-danger" />
          {labels.envelopeOverspentTag}
        </span>
      </div>
    </div>
  )
}

export { AllocationMeter, type Envelope, type AllocationMeterProps, type EnvelopeTone }
