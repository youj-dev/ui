'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { m, useInView } from 'motion/react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { stageRailLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useNow } from '../../hooks/use-now'
import { cn, numberFormat } from '../../lib/utils'

/* A pipeline run as one segmented rail: each stage is a key in a recessed
 * track, holding its name, its live duration (mono, ticking while it runs),
 * a run of cells that fill as it progresses and its state in words. The
 * cells of every stage sit on one line, so the whole run reads as a single
 * bar: ink where work is done, the accent where it's under way, the danger
 * tone where it broke, hatched where a stage was skipped. Picking a stage
 * raises its key (one toggle group: arrow keys rove, Home and End jump).
 * - Motion: the cells light from the start of the rail when it scrolls into
 *   view, one after another; after that a stage's cells change in order from
 *   its own start, so a stage that finishes washes into its final tone. The
 *   running stage's next cell breathes and its dot throws a ring. The raised
 *   key glides between stages (SlidingIndicator, the smooth spring).
 * - State changes are announced politely ("Test, Passed").
 * - Reduced motion: cells change in place, nothing breathes, the key jumps. */

type StageStatus = 'queued' | 'running' | 'passed' | 'failed' | 'skipped'

interface Stage {
  id: string
  name: string
  status: StageStatus
  /** When it started (ms since the epoch). A running stage's clock ticks from here. */
  startedAt?: number
  /** How long it took, in ms. For a running stage it stands in for the clock. */
  duration?: number
  /** How long it usually takes, in ms: a running stage's cells fill toward it. */
  estimate?: number
  /** Explicit progress, 0–1, for a running stage (or how far a failed one got). Wins over `estimate`. */
  progress?: number
}

interface StageRailProps extends Omit<ToggleGroupPrimitive.Props, 'value' | 'defaultValue' | 'onValueChange' | 'multiple' | 'children'> {
  stages: Stage[]
  /** The selected stage's id (controlled). */
  value?: string
  /** The stage selected at first. Default: the running stage, else the first failed, else the last. */
  defaultValue?: string
  onValueChange?: (id: string) => void
  /** Cells per stage. Default 12. */
  segments?: number
  /** Names the rail. Default: the labels' "Pipeline stages". */
  label?: string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** The id of the panel the selection drives (a log), for `aria-controls`. */
  controls?: string
  /** With sound on, picking a stage plays `select`. Default true. */
  sound?: boolean
}

const CELL_ON: Record<StageStatus, string> = {
  queued: '',
  skipped: '',
  passed: 'own:bg-fg',
  running: 'own:bg-accent',
  failed: 'own:bg-danger',
}
const CELL_OFF = 'own:bg-[color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_9%,transparent))]'
const DOT: Record<StageStatus, string> = {
  queued: 'border border-fg-subtle',
  running: 'bg-accent',
  passed: 'bg-success',
  failed: 'bg-danger',
  skipped: 'h-px w-2 rounded-none bg-fg-subtle',
}
const WORD: Record<StageStatus, string> = {
  queued: 'own:text-fg-muted',
  running: 'own:text-accent-text',
  passed: 'own:text-success-text',
  failed: 'own:text-danger-text',
  skipped: 'own:text-fg-muted',
}
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'

/** The stage selected when nothing is: the one running, else the first that failed, else the last to have started. */
function pickStage(stages: Stage[]) {
  return (
    stages.find((s) => s.status === 'running') ??
    stages.find((s) => s.status === 'failed') ??
    [...stages].reverse().find((s) => s.status !== 'queued' && s.status !== 'skipped') ??
    stages[0]
  )?.id
}

/** A stage's elapsed time in ms, or null while it has none (queued, skipped, or running before the clock is known). */
function elapsedOf(stage: Stage, now: number | null) {
  if (stage.status === 'queued' || stage.status === 'skipped') return null
  if (stage.status === 'running') return stage.startedAt !== undefined && now !== null ? Math.max(0, now - stage.startedAt) : (stage.duration ?? null)
  return stage.duration ?? null
}

/** How far along a stage is, 0–1. A running stage never shows full until it passes. */
function progressOf(stage: Stage, elapsed: number | null) {
  if (stage.status === 'passed') return 1
  if (stage.status === 'queued' || stage.status === 'skipped') return 0
  if (stage.progress !== undefined) return Math.min(1, Math.max(0, stage.progress))
  if (stage.estimate && elapsed !== null) return Math.min(stage.status === 'running' ? 0.94 : 1, elapsed / stage.estimate)
  return stage.status === 'failed' ? 1 : 0
}

/** Splits a duration into number and unit parts ("1", "m", " ", "12", "s") in the locale, and a spoken form. */
function durationParts(ms: number, locale: string, display: 'narrow' | 'long') {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const min = Math.floor((total % 3600) / 60)
  const s = total % 60
  const fields: [number, 'hour' | 'minute' | 'second'][] = h ? [[h, 'hour'], [min, 'minute']] : min ? [[min, 'minute'], [s, 'second']] : [[s, 'second']]
  return fields.map(([value, unit]) =>
    numberFormat(locale, { style: 'unit', unit, unitDisplay: display, minimumIntegerDigits: display === 'narrow' && unit !== fields[0]![1] ? 2 : 1 }).formatToParts(value),
  )
}

function Duration({ ms, locale }: { ms: number; locale: string }) {
  return (
    <>
      {durationParts(ms, locale, 'narrow').map((parts, i) => (
        <span key={i}>
          {i > 0 && ' '}
          {parts.map((part, j) => (
            <span key={j} data-part={part.type === 'unit' ? 'unit' : undefined} className={cn(part.type === 'unit' && 'own:text-fg-muted')}>
              {part.value}
            </span>
          ))}
        </span>
      ))}
    </>
  )
}

const durationText = (ms: number, locale: string, display: 'narrow' | 'long') =>
  durationParts(ms, locale, display)
    .map((parts) => parts.map((p) => p.value).join(''))
    .join(' ')

function StageRail({
  stages,
  value,
  defaultValue,
  onValueChange,
  segments = 12,
  label,
  locale: localeProp,
  controls,
  sound = true,
  className,
  style,
  ...props
}: StageRailProps) {
  const direction = useDirection()
  const k = useYouj()
  const labels = useComponentLabels(stageRailLabels)
  const locale = useLocale(localeProp)
  const cue = useSoundCue()
  const { announce, announcer } = useAnnouncer()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const shown = k.reduced || inView
  const running = stages.some((s) => s.status === 'running')
  const now = useNow(running ? 1000 : 0)
  const [selected, setSelected] = useControllableState(value, defaultValue ?? pickStage(stages) ?? '')
  const words: Record<StageStatus, string> = {
    queued: labels.stageQueued,
    running: labels.stageRunning,
    passed: labels.stagePassed,
    failed: labels.stageFailed,
    skipped: labels.stageSkipped,
  }

  // The first pass sweeps the whole rail from its start; later changes run from each stage's own start.
  const [intro, setIntro] = useState(!k.reduced)
  useEffect(() => {
    if (!inView || !intro) return
    const timer = setTimeout(() => setIntro(false), k.ms('deliberate') + k.ms('base'))
    return () => clearTimeout(timer)
  }, [inView, intro, k])

  // A stage that changes state is announced once, politely.
  const previous = useRef(new Map(stages.map((s) => [s.id, s.status])))
  useEffect(() => {
    for (const stage of stages) {
      const before = previous.current.get(stage.id)
      if (before !== undefined && before !== stage.status) announce(labels.stageItem(stage.name, words[stage.status], ''))
      previous.current.set(stage.id, stage.status)
    }
  })

  const step = k.reduced ? 0 : k.ms('deliberate') / Math.max(1, stages.length * segments)

  return (
    <MotionFeatures>
      <DirectionProvider direction={direction}>
        <ToggleGroupPrimitive
          ref={ref}
          aria-label={label ?? labels.stageRail}
          value={selected ? [selected] : []}
          onValueChange={(next) => {
            // One stage is always picked: pressing the picked one again keeps it.
            const id = next[0]
            if (id === undefined || id === selected) return
            setSelected(id)
            onValueChange?.(id)
            if (sound) cue('select')
          }}
          data-slot="stage-rail"
          data-reduced-motion={k.reduced || undefined}
          className={cn(
            'relative isolate grid w-full gap-0.5 rounded-xl own:p-0.5',
            'grid-cols-[repeat(auto-fit,minmax(5.25rem,1fr))]',
            'own:bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_4%,transparent))]',
            className,
          )}
          style={{ '--stage-rail-step': `${step}ms`, ...(typeof style === 'object' ? style : undefined) } as CSSProperties}
          {...props}
        >
          {stages.map((stage, s) => {
            const elapsed = elapsedOf(stage, now)
            const progress = progressOf(stage, elapsed)
            const lit = shown ? (stage.status === 'running' && progress > 0 ? Math.max(1, Math.floor(progress * segments)) : Math.round(progress * segments)) : 0
            const word = words[stage.status]
            // What the stage shows ("1m 26s") first, so its name holds the visible text, then the same in words.
            const spoken = elapsed !== null ? `${durationText(elapsed, locale, 'narrow')}, ${durationText(elapsed, locale, 'long')}` : ''
            return (
              <TogglePrimitive
                key={stage.id}
                value={stage.id}
                aria-label={labels.stageItem(stage.name, word, spoken)}
                aria-controls={controls}
                data-slot="stage-rail-stage"
                data-status={stage.status}
                className={cn(
                  'group/stage relative own:flex min-w-0 flex-col gap-2 rounded-[calc(var(--radius-xl)-2px)] own:px-2.5 own:pt-2.5 own:pb-2 own:text-start outline-none own:sm:px-3',
                  'transition-[color,background-color] yj-duration-fast ease-standard own:hover:bg-hover data-pressed:hover:bg-transparent',
                  'focus-ring focus-visible:z-10',
                )}
              >
                <span data-slot="stage-rail-header" className="own:flex min-w-0 items-center gap-2">
                  <span aria-hidden data-slot="stage-rail-dot" className="relative own:grid size-2 shrink-0 place-items-center">
                    <span className={cn('size-2 rounded-full', DOT[stage.status])} />
                    {stage.status === 'running' && !k.reduced && (
                      <m.span
                        className="absolute inset-0 rounded-full border border-accent"
                        initial={{ scale: 1, opacity: 0.7 }}
                        animate={{ scale: 2.6, opacity: 0 }}
                        transition={{ ...k.tween('deliberate', 'exit'), duration: k.duration('deliberate') * 2.4, repeat: Infinity }}
                      />
                    )}
                  </span>
                  <span data-slot="stage-rail-label" className={cn('min-w-0 flex-1 truncate own:text-ui-sm own:text-fg', VOICE)}>
                    {stage.name}
                  </span>
                </span>{' '}
                <span aria-hidden data-slot="stage-rail-track" className="own:flex h-2 gap-0.5">
                  {Array.from({ length: segments }, (_, i) => {
                    const on = i < lit
                    const next = stage.status === 'running' && i === lit && shown
                    return (
                      <span
                        key={i}
                        data-slot="stage-rail-cell"
                        data-state={on ? 'on' : 'off'}
                        className={cn(
                          'relative min-w-0 flex-1 overflow-hidden rounded-[2px] transition-[background-color] yj-duration-fast ease-standard',
                          on ? CELL_ON[stage.status] : CELL_OFF,
                          stage.status === 'skipped' &&
                            'own:bg-[repeating-linear-gradient(135deg,var(--color-line)_0_1.5px,transparent_1.5px_4px)] opacity-80',
                        )}
                        style={{ transitionDelay: `calc(${intro ? s * segments + i : i} * var(--stage-rail-step))` }}
                      >
                        {next && (
                          <m.span
                            className="absolute inset-0 bg-accent"
                            initial={{ opacity: k.reduced ? 0.45 : 0.15 }}
                            animate={{ opacity: k.reduced ? 0.45 : 0.7 }}
                            transition={k.reduced ? { type: false } : { ...k.tween('deliberate', 'standard'), repeat: Infinity, repeatType: 'mirror' }}
                          />
                        )}
                      </span>
                    )
                  })}
                </span>{' '}
                {/* On a narrow stage the duration wraps under the state rather than cutting it short. */}
                <span aria-hidden data-slot="stage-rail-footer" className="own:flex min-w-0 flex-wrap items-baseline gap-x-2">
                  <span data-slot="stage-rail-status" className={cn('own:text-ui-sm whitespace-nowrap', WORD[stage.status])}>
                    {word}
                  </span>{' '}
                  <span
                    data-slot="stage-rail-value"
                    className={cn('own:ms-auto own:font-mono own:text-ui-sm whitespace-nowrap own:text-fg own:tabular-nums', elapsed === null && 'own:text-fg-subtle')}
                  >
                    {elapsed === null ? '—' : <Duration ms={elapsed} locale={locale} />}
                  </span>
                </span>
              </TogglePrimitive>
            )
          })}
          {/* Only the pressed stage: its cells carry data-state of their own. */}
          <SlidingIndicator
            match="[data-pressed]"
            data-slot="stage-rail-indicator"
            className="rounded-[calc(var(--radius-xl)-2px)] own:shadow-sm-soft own:inset-ring-(length:--yj-stroke-width) inset-ring-(--ui--fill-edge) own:bg-key"
          />
        </ToggleGroupPrimitive>
      </DirectionProvider>
      {announcer}
    </MotionFeatures>
  )
}

export { StageRail, type Stage, type StageRailProps, type StageStatus }
