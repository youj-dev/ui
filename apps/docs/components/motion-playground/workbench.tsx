'use client'

import { useId, type ReactNode } from 'react'
import { useYouj } from '@youj/core'
import { RefreshIcon } from '@youj/icons'
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Slider } from '@youj/react'
import { InlineCode } from '@/components/docs/inline-code'
import { cn } from '@/lib/cn'

/* The parts every view shares: the stage and its strip of plots on the
 * start side, the controls on the end side, and the control rows. Selects
 * pick tokens, sliders set continuous values, and a slider's track is marked
 * where the tokens sit, so a custom value always shows its neighbors. */

export function Workbench({ stage, strip, controls }: { stage: ReactNode; strip?: ReactNode; controls: ReactNode }) {
  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="flex min-w-0 flex-col">
        {stage}
        {strip && <div className="border-t border-line bg-canvas px-3 pt-2 pb-1 sm:px-4">{strip}</div>}
      </div>
      <div className="flex min-w-0 flex-col gap-5 border-t border-line bg-surface p-4 lg:border-t-0 lg:border-s">{controls}</div>
    </div>
  )
}

/** A stage: the blueprint canvas a demo plays on, with Replay and the settings it plays under. */
export function Stage({
  caption,
  onReplay,
  children,
  className,
  minHeight = 300,
}: {
  /** One line on how to drive it, top start. */
  caption?: ReactNode
  onReplay?: () => void
  children: ReactNode
  className?: string
  minHeight?: number
}) {
  const k = useYouj()
  const speed = 1 / k.timeScale
  const chips = [
    speed !== 1 && `${speed < 1 ? (speed === 0.25 ? '¼' : speed === 0.5 ? '½' : speed.toFixed(2)) : speed}× speed`,
    k.reduced && 'reduced motion',
    k.motionPersonality !== 'precise' && `${k.motionPersonality} personality`,
  ].filter(Boolean) as string[]

  return (
    <div className={cn('relative isolate flex flex-col overflow-hidden bg-canvas', className)} style={{ minHeight }}>
      <div aria-hidden className="blueprint blueprint-edge pointer-events-none absolute inset-0 -z-1" />
      <div className="flex min-h-12 items-center justify-between gap-3 px-3 pt-2 sm:px-4">
        <p className="min-w-0 text-[12.5px] leading-snug text-fg-muted">{caption}</p>
        {onReplay && (
          <Button size="sm" variant="outline" onClick={onReplay} className="shrink-0 bg-surface">
            <RefreshIcon size={14} strokeWidth={1.75} />
            Replay
          </Button>
        )}
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pt-2 pb-10 sm:px-8">{children}</div>
      {chips.length > 0 && (
        <div className="pointer-events-none absolute start-3 bottom-3 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <span key={chip} className="stage-chip">
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/** A labeled control row. `value` is the measured readout beside the label. */
export function ControlField({ label, labelId, value, hint, children }: { label: string; labelId?: string; value?: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span id={labelId} className="text-[12.5px] font-medium text-fg">
          {label}
        </span>
        {value !== undefined && <span className="type-small text-fg-muted">{value}</span>}
      </div>
      {children}
      {hint && <p className="text-[12px] leading-snug text-pretty text-fg-muted">{typeof hint === 'string' ? <InlineCode text={hint} /> : hint}</p>}
    </div>
  )
}

export interface TokenOption<T extends string> {
  value: T
  label: string
  /** The resolved value, mono, at the end of the row: "0.36 s". */
  detail?: string
}

export function TokenSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string
  value: T
  options: TokenOption<T>[]
  onChange: (value: T) => void
  hint?: ReactNode
}) {
  const id = useId()
  const items = Object.fromEntries(options.map((o) => [o.value, o.label]))
  const current = options.find((o) => o.value === value)
  return (
    <ControlField label={label} labelId={id} value={current?.detail} hint={hint}>
      <Select items={items} value={value} onValueChange={(next) => next && onChange(next as T)}>
        <SelectTrigger aria-labelledby={id} className="w-full font-mono text-[12.5px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="font-mono text-[12.5px]">
              {o.label}
              {o.detail && (
                <>
                  {' '}
                  <span className="ms-auto ps-4 text-[11px] text-fg-muted">{o.detail}</span>
                </>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ControlField>
  )
}

export interface Detent {
  value: number
  label: string
}

/**
 * A slider value pulled onto a notch it is approaching within `reach`. Only
 * approaching: a step away from a notch always leaves it, so the arrow keys
 * never get stuck on a token.
 */
export function snap(next: number, current: number, detents: number[], reach: number): number {
  const hit = detents.find((d) => Math.abs(next - d) <= reach && Math.abs(next - d) < Math.abs(current - d))
  return hit ?? next
}

/**
 * A continuous value, with the tokens notched under its track. The readout
 * names the token when the value is one; the caller snaps a drag onto a notch
 * it passes close to.
 */
export function ValueSlider({
  label,
  value,
  display,
  min,
  max,
  step,
  detents = [],
  onChange,
  onCommit,
}: {
  label: string
  value: number
  display: string
  min: number
  max: number
  step: number
  detents?: Detent[]
  onChange: (value: number) => void
  /** When a drag ends or a key step lands. */
  onCommit?: (value: number) => void
}) {
  const at = (v: number) => (v - min) / (max - min)
  const on = detents.filter((d) => Math.abs(d.value - value) < step / 2)
  return (
    <ControlField
      label={label}
      value={
        <>
          {display}
          {on.length > 0 && <span className="text-fg"> · {on.map((d) => d.label).join(', ')}</span>}
        </>
      }
    >
      <div className="flex flex-col">
        <Slider
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          onValueChange={(v) => onChange(Array.isArray(v) ? v[0]! : v)}
          onValueCommitted={(v) => onCommit?.(Array.isArray(v) ? v[0]! : v)}
        />
        {detents.length > 0 && (
          // The thumb sits inside the track's ends (edge alignment), so the notches do too.
          <div aria-hidden className="relative mx-2 -mt-1 h-2">
            {detents.map((d) => (
              <span
                key={d.label}
                title={d.label}
                className={cn('absolute top-0 h-1.5 w-px -translate-x-1/2 rtl:translate-x-1/2', on.includes(d) ? 'bg-accent' : 'bg-fg-muted')}
                style={{ insetInlineStart: `${at(d.value) * 100}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </ControlField>
  )
}

/**
 * Where a value stands against the tokens: a quiet confirmation when it is
 * one, and when it's custom, the closest token and a way to use it.
 */
export function TokenNudge({ token, nearest, detail, onUse }: { token: string | null; nearest: string; detail: string; onUse: () => void }) {
  if (token) {
    return (
      <p className="flex items-center gap-2 text-[12px] text-fg-muted">
        <span aria-hidden className="particle size-[5px]" />
        <span>
          The token <code className="code-inline">{token}</code>. It follows the theme’s personality,
          Speed and reduced motion.
        </span>
      </p>
    )
  }
  return (
    <div role="note" className="flex flex-col gap-2 rounded-lg border border-line bg-canvas p-3">
      <p className="text-[12px] leading-snug text-pretty text-fg-muted">
        <span className="font-medium text-fg">Custom, not a token.</span> It stays the same in every theme. Closest:{' '}
        <code className="code-inline">{nearest}</code> ({detail}).
      </p>
      <Button size="xs" variant="secondary" onClick={onUse} className="self-start">
        Use {nearest}
      </Button>
    </div>
  )
}

/** Measured values, two to a row. */
export function Readouts({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-canvas">
      {items.map((item, i) => (
        <div key={item.label} className={cn('flex flex-col gap-0.5 px-3 py-2', i % 2 === 1 && 'border-s border-line', i > 1 && 'border-t border-line')}>
          <dt className="text-[11px] text-fg-muted">{item.label}</dt>
          <dd className="type-small text-fg">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
