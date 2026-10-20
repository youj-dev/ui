'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useYouj } from '@youj/core'
import { Counter } from '@youj/motion'
import { BrandGithubIcon, CheckIcon, GitPullRequestIcon, MessageIcon, RocketIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { cn } from '../../../lib/utils'
import type { FeatureStepsState } from './data'

/* One small picture per step: the product at that moment of the release,
 * played in beats when the tour reaches the step (a status flips, rows
 * arrive, a count rolls) and held on its last beat once the step is behind.
 * Every beat's row is laid out from the start and only fades in, so a card
 * never changes size. Decorative: the step's own text says what happens. */

/** The beat a step's picture is on: none before the tour reaches it, all of them once it's behind (and under reduced motion). */
function useBeat(state: FeatureStepsState, beats: number) {
  const k = useYouj()
  const [beat, setBeat] = useState(0)
  const [prev, setPrev] = useState(state)
  if (prev !== state) {
    setPrev(state)
    setBeat(0)
  }
  useEffect(() => {
    if (state !== 'active' || k.reduced) return
    const timers: ReturnType<typeof setTimeout>[] = []
    // The first beat lands as the tour's lens arrives at the step, the rest two slow beats apart.
    let t = k.ms('deliberate') * 0.8
    for (let b = 1; b <= beats; b++) {
      timers.push(setTimeout(() => setBeat(b), t))
      t += k.ms('slow') * 2.2
    }
    return () => timers.forEach(clearTimeout)
  }, [state, beats, k])
  if (k.reduced || state === 'done') return beats
  return state === 'idle' ? 0 : beat
}

/** A row that rises in on its beat; `order` staggers the rows that share one. */
function useRise() {
  const k = useYouj()
  return (on: boolean, className?: string, order = 0): { className: string; style: CSSProperties } => ({
    className: cn('transition-[opacity,translate] yj-duration-slow ease-enter', on ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0', className),
    style: { transitionDelay: on && order ? `${Math.round(order * k.stagger('loose') * 1000)}ms` : undefined },
  })
}

// The step in play is lifted onto a deeper shadow (FeatureSteps marks its picture's wrapper `data-state`).
const card =
  'flex h-full min-h-36 flex-col gap-3 rounded-xl border border-line bg-surface p-3.5 text-ui-sm shadow-xs transition-shadow yj-duration-slow ease-standard in-data-[state=active]:shadow-lg'

/** Two states of one slot, laid over each other so the slot keeps the wider one's size. */
function Swap({ on, off, onNode }: { on: boolean; off: ReactNode; onNode: ReactNode }) {
  const fade = 'col-start-1 row-start-1 transition-[opacity,scale] yj-duration-base ease-standard'
  return (
    <span className="grid shrink-0 justify-items-end">
      <span className={cn(fade, on ? 'scale-95 opacity-0' : 'opacity-100')}>{off}</span>
      <span className={cn(fade, on ? 'opacity-100' : 'scale-95 opacity-0')}>{onNode}</span>
    </span>
  )
}

/** A status as a dot and a word: lighter than a badge beside a long name. */
function Status({ on, off, onLabel }: { on: boolean; off: string; onLabel: string }) {
  return (
    <Swap
      on={on}
      off={
        <span className="inline-flex items-center gap-1.5 text-ui-xs text-fg-muted">
          <span className="size-1.5 rounded-full border border-fg-subtle" />
          {off}
        </span>
      }
      onNode={
        <span className="inline-flex items-center gap-1.5 text-ui-xs font-medium text-success-text">
          <span className="size-1.5 rounded-full bg-success" />
          {onLabel}
        </span>
      }
    />
  )
}

export function ConnectVisual({ state }: { state: FeatureStepsState }) {
  const beat = useBeat(state, 3)
  const rise = useRise()
  return (
    <div className={card}>
      <span className="flex items-center gap-2 text-fg">
        <BrandGithubIcon size={16} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate font-medium">acme/storefront</span>
        <Status on={beat >= 1} off="Not linked" onLabel="Linked" />
      </span>
      <span className="flex flex-wrap items-center gap-1.5">
        {['Next.js 16', 'pnpm'].map((chip, i) => (
          <Badge key={chip} variant={i ? 'secondary' : 'success'} {...rise(beat >= 2, undefined, i)}>
            {!i && <CheckIcon size={12} strokeWidth={2.5} />}
            {chip}
          </Badge>
        ))}
      </span>
      <span {...rise(beat >= 3, 'mt-auto text-ui-xs text-fg-muted')}>Build command, output and settings detected.</span>
    </div>
  )
}

export function PushVisual({ state }: { state: FeatureStepsState }) {
  const k = useYouj()
  const beat = useBeat(state, 3)
  const rise = useRise()
  return (
    <div className={cn(card, 'gap-2 font-mono text-ui-xs')}>
      <span className={cn('truncate transition-colors yj-duration-base ease-standard', beat ? 'text-fg' : 'text-fg-muted')}>
        <span className="text-fg-muted select-none">$ </span>git push origin feat/klarna
      </span>
      <span {...rise(beat >= 1, 'flex items-center gap-2 text-fg-muted')}>
        <span className="min-w-0 flex-1 truncate">↳ 1,204 files from cache</span>
        <span className="rounded-sm bg-hover px-1.5 py-px font-sans">cached</span>
      </span>
      <span {...rise(beat >= 2, 'flex flex-col gap-1.5 text-fg-muted')}>
        <span className="truncate">↳ Building 31 routes</span>
        <span className="relative h-1 overflow-hidden rounded-full bg-well">
          <span
            className="absolute inset-0 origin-left rounded-full bg-accent transition-transform ease-standard rtl:origin-right"
            style={{ transform: `scaleX(${beat >= 2 ? 1 : 0})`, transitionDuration: `${Math.round(k.ms('slow') * 1.6)}ms` }}
          />
        </span>
      </span>
      <span {...rise(beat >= 3, 'mt-auto flex items-center gap-1.5 text-success-text')}>
        <CheckIcon size={12} strokeWidth={2.5} /> Built in 14&nbsp;s · 212 routes
      </span>
    </div>
  )
}

const REVIEWERS = ['MO', 'TB', 'PR']

export function ReviewVisual({ state }: { state: FeatureStepsState }) {
  const beat = useBeat(state, 3)
  const rise = useRise()
  const live = beat >= 1
  return (
    <div className={card}>
      <span className="flex items-center gap-2 text-fg">
        <GitPullRequestIcon size={16} className="shrink-0 text-accent" />
        <span className="min-w-0 flex-1 truncate font-medium">PR 482 · Klarna checkout</span>
      </span>
      <span className="flex min-w-0 items-center gap-2 rounded-md bg-band px-2 py-1 text-ui-xs">
        <span className={cn('size-1.5 shrink-0 rounded-full transition-colors yj-duration-base ease-standard', live ? 'bg-success' : 'bg-fg-subtle')} />
        <span className={cn('truncate transition-colors yj-duration-base ease-standard', live ? 'text-fg' : 'text-fg-muted')}>klarna.northwind.app</span>
      </span>
      <span className="mt-auto flex items-center justify-between gap-2">
        <span className="flex items-center">
          {REVIEWERS.map((who, i) => (
            <Avatar key={who} size="sm" {...rise(beat >= 2, cn('ring-2 ring-surface', i > 0 && '-ms-1.5'), i)}>
              <AvatarFallback>{who}</AvatarFallback>
            </Avatar>
          ))}
          <span {...rise(beat >= 2, 'ms-2 inline-flex items-center gap-1 text-ui-xs text-fg-muted tabular-nums', 3)}>
            <MessageIcon size={12} />
            {beat >= 2 ? <Counter value={3} from={0} mode="roll" inView={false} /> : 0}
          </span>
        </span>
        <Swap on={beat >= 3} off={<Badge variant="outline">In review</Badge>} onNode={<Badge variant="success">Approved</Badge>} />
      </span>
    </div>
  )
}

/** The edge regions, as a strip of dots that light up in a wave. */
const REGIONS = 14

export function PromoteVisual({ state }: { state: FeatureStepsState }) {
  const k = useYouj()
  const beat = useBeat(state, 3)
  const rise = useRise()
  return (
    <div className={card}>
      <span className="flex items-center justify-between gap-2">
        <span className="font-mono text-ui-xs text-fg">dpl_8f2c</span>
        <Swap on={beat >= 1} off={<Badge variant="outline">Preview</Badge>} onNode={<Badge variant="solid">Production</Badge>} />
      </span>
      <span className="flex flex-col gap-2">
        <span className="flex justify-between gap-1">
          {Array.from({ length: REGIONS }, (_, i) => (
            <span
              key={i}
              className={cn('size-1.5 rounded-full transition-colors ease-standard', beat >= 2 ? 'bg-accent' : 'bg-well')}
              style={{ transitionDuration: `${Math.round(k.ms('base'))}ms`, transitionDelay: beat >= 2 && i ? `${Math.round(i * k.stagger('base') * 1000)}ms` : undefined }}
            />
          ))}
        </span>
        <span className="flex items-center gap-2 text-fg">
          <RocketIcon size={14} className="shrink-0 text-accent" />
          <span className="min-w-0 flex-1 truncate tabular-nums">
            Live in {beat >= 2 ? <Counter value={38} from={0} mode="tween" duration="deliberate" inView={false} /> : 0} regions
          </span>
        </span>
      </span>
      <span {...rise(beat >= 3, 'mt-auto text-ui-xs text-fg-muted')}>Promoted by Mara Okafor · took 0.4&nbsp;s</span>
    </div>
  )
}
