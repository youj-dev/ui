'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type ElementType } from 'react'
import { useInView } from 'motion/react'
import { useYouj } from '@youj/core'
import { Magnetic, MagneticInner, Reveal, Stagger, TextSplit } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { DotMatrixWave } from '@youj/motion/backgrounds'
import { buttonVariants } from '../../components/ui/button'
import { Kbd } from '../../components/ui/kbd'
import { useVisible } from '../../hooks/use-visible'
import { cn } from '../../lib/utils'
import { ACCENTS, DEFAULT_COPY, FACTS, MORE_TASKS, TASKS, type HeroMotionCopy, type HeroMotionCta, type HeroMotionFact, type HeroMotionTask } from './hero-motion/data'
import { Tuner } from './hero-motion/tuner'

/* The youj hero, and its proof. On the left an editorial headline whose words
 * rise out of their own line masks; the second line takes each phrase of
 * `accents` in turn, rising again. Calls to action are magnetic. Behind it a
 * dot matrix swells under the pointer. On the right, "Try the contract": a
 * Speed control, a Reduced motion switch and a Theme picker drive a small
 * release checklist (tick a task, add one, filter, Ship it), so the claim in
 * the headline (one motion contract; speed, reduced motion and theme reach
 * everything) is something the visitor does, not reads.
 * The headline reads as one sentence to assistive tech (the first accent); the
 * rotation is decorative. Reduced motion: words are set and don't rotate,
 * the matrix is still, buttons stay put, and the checklist answers instantly.
 * Pass your own `accents`, `facts`, `shortcut` and calls to action; every other
 * string is in `copy`, and `linkComponent` renders the links. The checklist is
 * demo content: edit after adding. */

/** Milliseconds each accent phrase stays, before the Speed control. */
const DWELL = 3800

interface HeroMotionProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<HeroMotionCopy>
  /** The phrases the headline's second line takes in turn; one is a still headline. Default: the demo's three. */
  accents?: string[]
  /** The figures under the calls to action; empty hides the row. Default: the demo's three. */
  facts?: HeroMotionFact[]
  /** The keys of the shortcut shown beside the calls to action; empty hides it. Default `['⌘', 'K']`. */
  shortcut?: string[]
  /** The main call to action. Default: "Get started" to `#get-started`. */
  primaryCta?: HeroMotionCta
  /** The second call to action; `null` hides it. Default: "Browse components" to `#components`. */
  secondaryCta?: HeroMotionCta | null
  /** Show the "Try the contract" panel. Default true. */
  tuner?: boolean
  /** The checklist in that panel, tickable. Default: the demo's release checklist. */
  tasks?: HeroMotionTask[]
  /** What "Add a task" adds, in turn; the button disables when they run out. Default: the demo's four. */
  moreTasks?: string[]
  /** Called when "Ship it" is pressed; the button shows it working until the promise settles. Default: a short demo wait. */
  onShip?: () => Promise<unknown> | unknown
  /** Renders every link: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** The headline's level. Default 1. */
  headingLevel?: 1 | 2 | 3
}

function HeroMotion({
  copy: copyProp,
  accents = ACCENTS,
  facts = FACTS,
  shortcut = ['⌘', 'K'],
  primaryCta = { label: 'Get started', href: '#get-started' },
  secondaryCta = { label: 'Browse components', href: '#components' },
  tuner = true,
  tasks = TASKS,
  moreTasks = MORE_TASKS,
  onShip,
  linkComponent: Link = 'a',
  headingLevel = 1,
  className,
  ...rest
}: HeroMotionProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const k = useYouj()
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const stage = useRef<HTMLDivElement>(null)
  const inView = useInView(stage, { amount: 0.4 })
  const [turn, setTurn] = useState(0)
  // Also off while the tab is hidden: `inView` alone keeps a scrolled-to hero rotating in the background.
  const shown = useVisible(stage)
  const rotating = accents.length > 1 && !k.reduced && inView && shown
  useEffect(() => {
    if (!rotating) return
    const id = setInterval(() => setTurn((n) => n + 1), DWELL * k.timeScale)
    return () => clearInterval(id)
  }, [rotating, k.timeScale])
  const accent = accents[turn % Math.max(accents.length, 1)] ?? ''
  return (
    <section aria-labelledby={titleId} {...rest} className={cn('relative isolate overflow-hidden bg-canvas', className)}>
      <div aria-hidden className="absolute inset-0 -z-10 [mask-image:radial-gradient(120%_90%_at_100%_40%,black_20%,transparent_75%)]">
        <DotMatrixWave className="absolute inset-0" />
      </div>
      <div
        ref={stage}
        className={cn(
          'mx-auto grid min-h-[min(90dvh,780px)] max-w-6xl items-center gap-12 px-4 py-24 sm:px-6',
          tuner && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,--spacing(112))] lg:gap-14',
        )}
      >
        <div className="flex min-w-0 flex-col gap-8">
          <Reveal inView={false} variant="fade">
            <span className="inline-flex items-center gap-2 text-ui-sm font-medium text-fg-muted">
              <span className="size-1.5 rounded-full bg-accent" />
              {copy.eyebrow}
            </span>
          </Reveal>
          <Title id={titleId} aria-label={`${copy.headlineLead} ${accents[0] ?? ''}`} className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tighter text-fg sm:text-6xl">
            <span aria-hidden>
              <TextSplit as="span" by="words" mask inView={false} delay={2} duration="deliberate" ease="enter" className="block">
                {copy.headlineLead}
              </TextSplit>{' '}
              <TextSplit
                key={accent}
                as="span"
                by="words"
                mask
                inView={false}
                delay={turn === 0 ? 5 : 0}
                duration="deliberate"
                ease="enter"
                className="block text-accent"
              >
                {accent}
              </TextSplit>
            </span>
          </Title>
          <Stagger inView={false} delay={9} step="loose" variant="rise" className="flex flex-col gap-8">
            <p className="max-w-xl text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Magnetic>
                <Link href={primaryCta.href} onClick={primaryCta.onClick} data-yj-trigger="" className={buttonVariants({ size: 'lg', className: 'px-5' })}>
                  <MagneticInner className="inline-flex items-center gap-2">
                    {primaryCta.label} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
                  </MagneticInner>
                </Link>
              </Magnetic>
              {secondaryCta && (
                <Magnetic strength={0.2}>
                  <Link
                    href={secondaryCta.href}
                    onClick={secondaryCta.onClick}
                    className={buttonVariants({ size: 'lg', variant: 'outline', className: 'bg-canvas/70 youj-allow-glass px-5 backdrop-blur' })}
                  >
                    <MagneticInner>{secondaryCta.label}</MagneticInner>
                  </Link>
                </Magnetic>
              )}
              {shortcut.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-ui-sm text-fg-muted max-sm:hidden">
                  {copy.shortcutHint}{' '}
                  {shortcut.map((key, i) => (
                    <Kbd key={i}>{key}</Kbd>
                  ))}
                </span>
              )}
            </div>
            {facts.length > 0 && (
              <dl className="grid grid-cols-3 gap-4 border-t border-line pt-6 sm:flex sm:gap-10">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex flex-col-reverse">
                    <dt className="text-ui-sm text-fg-muted">{fact.label}</dt>
                    <dd className="text-2xl font-semibold tracking-tight text-fg tabular-nums">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Stagger>
        </div>
        {tuner && (
          <Reveal inView={false} variant="rise" delay={10} className="min-w-0">
            <Tuner copy={copy} tasks={tasks} moreTasks={moreTasks} onShip={onShip} />
          </Reveal>
        )}
      </div>
    </section>
  )
}

export { HeroMotion }
export type { HeroMotionProps, HeroMotionCopy, HeroMotionCta, HeroMotionFact, HeroMotionTask }
