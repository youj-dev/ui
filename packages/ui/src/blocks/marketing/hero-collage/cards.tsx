'use client'

import type { CSSProperties, ReactNode } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { Counter } from '@youj/motion'
import { CheckCircleIcon, GitPullRequestIcon, RocketIcon } from '@youj/icons'
import { AvatarStack } from '../../../components/ui/avatar-stack'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { Slider } from '../../../components/ui/slider'
import { cn } from '../../../lib/utils'
import type { HeroCollageCopy } from './data'

/* The collage's cards: real components in a small release-day story. Each
 * reads the stage the tour is on (0 to 3; later stages hold the last state)
 * and the card the stage is about lifts and rings. They are a picture of the
 * product, rendered inert and hidden by the hero. */

const REVIEWERS = [
  { id: 'm', name: 'Mara Okafor' },
  { id: 't', name: 'Theo Brandt' },
  { id: 'p', name: 'Priya Raman' },
  { id: 'g', name: 'Grace Hopper' },
  { id: 'a', name: 'Ada Lovelace' },
]
const APPROVALS = ['1/3 approved', '3/3 approved', 'Merged', 'Merged']
const BUILD = [0, 62, 100, 100]
const CANARY = [0, 0, 25, 100]
const RPS = [8_120, 8_210, 11_480, 14_960]

function Label({ children }: { children: ReactNode }) {
  return <span className="text-ui-sm text-fg-muted">{children}</span>
}

/** Fades and settles whatever it wraps each time its key changes. */
function Swap({ id, children }: { id: string | number; children: ReactNode }) {
  const k = useYouj()
  return (
    <m.span key={id} initial={k.reduced ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={k.tween('fast', 'enter')} className="inline-flex">
      {children}
    </m.span>
  )
}

interface CardSpec {
  id: string
  /** Which stage it is about. */
  stage: number
  /** Where it sits on the stage, in percent: the inline side it hangs from, how far in, and from the top. */
  at: { side: 'start' | 'end'; inset: number; top: number }
  tilt: number
  render: (step: number, copy: HeroCollageCopy) => ReactNode
}

const CARDS: CardSpec[] = [
  {
    id: 'review',
    stage: 0,
    at: { side: 'start', inset: 0, top: 1 },
    tilt: -2.5,
    render: (step) => (
      <div className="flex flex-col gap-2.5">
        <span className="inline-flex items-center gap-2 text-ui font-medium">
          <GitPullRequestIcon size={15} className="text-accent" /> PR 482 · Add Klarna checkout
        </span>
        <span className="flex items-center justify-between gap-3">
          <AvatarStack users={REVIEWERS} max={4} label="Reviewers" className="space-x-1" />
          <Swap id={APPROVALS[step]!}>
            <Label>{APPROVALS[step]}</Label>
          </Swap>
        </span>
      </div>
    ),
  },
  {
    id: 'build',
    stage: 1,
    at: { side: 'end', inset: 0, top: 19 },
    tilt: 2,
    render: (step, copy) => (
      <div className="flex flex-col gap-2.5">
        <span className="flex items-center justify-between gap-3">
          <span className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1.5 font-mono text-ui-sm">
              <RocketIcon size={13} /> dpl_8f2c
            </span>
            <Label>feat/klarna</Label>
          </span>
          <Swap id={step < 1 ? 'queued' : step < 2 ? 'building' : 'ready'}>
            {step < 1 ? <Badge variant="outline">Queued</Badge> : step < 2 ? <Badge variant="warning">Building</Badge> : <Badge variant="success">Ready</Badge>}
          </Swap>
        </span>
        <Progress value={BUILD[step]!} aria-label={copy.buildProgress} />
      </div>
    ),
  },
  {
    id: 'canary',
    stage: 2,
    at: { side: 'start', inset: 7, top: 42 },
    tilt: -1,
    render: (step, copy) => (
      <div className="flex flex-col gap-3">
        <span className="flex items-baseline justify-between">
          <span className="text-ui font-medium">{copy.canaryTraffic}</span>
          <span className="font-mono text-ui font-medium text-accent tabular-nums">
            {CANARY[step]}
            <span className="text-fg-muted">%</span>
          </span>
        </span>
        <Slider value={[CANARY[step]!]} max={100} aria-label={copy.canaryTraffic} />
      </div>
    ),
  },
  {
    id: 'rps',
    stage: 2,
    at: { side: 'end', inset: 3, top: 63 },
    tilt: 1.5,
    render: (step) => (
      <div className="flex flex-col gap-0.5">
        <Label>Requests per second</Label>
        <span className="text-2xl font-semibold tracking-tight tabular-nums">
          <Counter value={RPS[step]!} mode="roll" inView={false} />
        </span>
        <span className="text-ui-sm text-success-text">p95 {step < 2 ? '212' : '184'} ms · 38 regions</span>
      </div>
    ),
  },
  {
    id: 'live',
    stage: 3,
    at: { side: 'start', inset: 1, top: 83 },
    tilt: 2,
    render: (step) => (
      <div className="flex items-start gap-3">
        <span className={cn('mt-0.5', step >= 3 ? 'text-success-text' : 'text-fg-muted')}>
          <CheckCircleIcon size={18} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-ui font-medium">{step >= 3 ? 'Deployed to production' : 'Waiting for canary'}</span>
          <Label>{step >= 3 ? 'acme.shop · just now' : 'acme.shop · v 2.14'}</Label>
        </span>
      </div>
    ),
  },
]

function Card({ spec, step, stage, copy }: { spec: CardSpec; step: number; stage: number; copy: HeroCollageCopy }) {
  const k = useYouj()
  const active = spec.stage === stage
  const vars = { '--top': `${spec.at.top}%`, '--inset': `${spec.at.inset}%`, '--tilt': `${spec.tilt}deg` } as CSSProperties
  return (
    <m.div
      style={vars}
      animate={{ scale: active ? 1.04 : 1, y: active ? -4 : 0 }}
      transition={k.spring('smooth')}
      className={cn('absolute top-(--top) w-[min(68%,--spacing(64))] rotate-(--tilt)', spec.at.side === 'start' ? 'start-(--inset)' : 'end-(--inset)', active && 'z-10')}
    >
      <div
        className={cn(
          'rounded-xl border bg-surface p-4 text-fg shadow-lg shadow-fg/5 transition-[border-color,box-shadow] yj-duration-base ease-standard',
          active ? 'border-accent-line shadow-xl shadow-accent/10' : 'border-line',
        )}
      >
        {spec.render(step, copy)}
      </div>
    </m.div>
  )
}

/** The picture: every card at the tour's stage. */
export function CollageCards({ stage, copy }: { stage: number; copy: HeroCollageCopy }) {
  const step = Math.min(stage, 3)
  return (
    <MotionFeatures>
      {CARDS.map((spec) => (
        <Card key={spec.id} spec={spec} step={step} stage={Math.min(stage, 3)} copy={copy} />
      ))}
    </MotionFeatures>
  )
}
