'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type ElementType } from 'react'
import { useInView } from 'motion/react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { Magnetic, MagneticInner, Stagger } from '@youj/motion'
import { ArrowRightIcon, PlayIcon } from '@youj/icons'
import { DotMatrixWave } from '@youj/motion/backgrounds'
import { Button, buttonVariants } from '../../components/ui/button'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { CollageCards } from './hero-collage/cards'
import { DEFAULT_COPY, STAGES, type HeroCollageCopy, type HeroCollageCta, type HeroCollageStage } from './hero-collage/data'

/* A hero that tells one release, start to finish. On the left the pitch; on
 * the right a stack of cards, each a real component (an avatar stack, a
 * progress bar, a slider, a rolling counter, a status badge), laid out like a
 * desk covered in the product. Four stages sit under them (Review, Build,
 * Canary, Live): the page tours them on its own, and at each the cards change
 * state, the one the stage is about lifts and rings, and a caption says in a
 * sentence what is happening. Pick a stage to take over; the tour stops
 * for good. It also pauses while the pointer or focus is inside, off screen
 * or in a hidden tab, and a play/pause button is always there.
 * Reduced motion: no tour, cards switch state in place.
 * The cards are a picture: inert and hidden from assistive tech; the caption
 * (a polite live region) carries the same story in words. Pass your own
 * `stages` (labels and captions; the cards follow the order, so keep four
 * or fewer) and calls to action; every other string is in `copy`, and
 * `linkComponent` renders the links. The cards are demo content: edit after adding. */

/** Milliseconds each stage is shown while the tour runs, before the Speed control. */
const DWELL = 4200

interface HeroCollageProps extends Omit<ComponentProps<'section'>, 'children' | 'defaultValue'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, padding or max width), and the title is an h2. Default false. */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<HeroCollageCopy>
  /** The stages under the cards, in order: a label and a caption each. Default: Review, Build, Canary and Live. */
  stages?: HeroCollageStage[]
  /** The shown stage's id, controlled. */
  value?: string
  /** The stage shown first, uncontrolled. Default: the first. */
  defaultValue?: string
  /** Called with the stage's id when someone picks one or the tour moves on. */
  onValueChange?: (value: string) => void
  /** Tour the stages on its own until someone picks one. Default true (never under reduced motion). */
  autoAdvance?: boolean
  /** The main call to action. Default: "Start a team trial" to `#trial`. */
  primaryCta?: HeroCollageCta
  /** The second call to action; `null` hides it. Default: "See how teams ship" to `#customers`. */
  secondaryCta?: HeroCollageCta | null
  /** Renders every link: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** The headline's level. Default 1, or 2 when `embedded`. */
  headingLevel?: 1 | 2 | 3
}

function HeroCollage({
  theme,
  embedded = false,
  copy: copyProp,
  stages = STAGES,
  value: valueProp,
  defaultValue = stages[0]?.id ?? '',
  onValueChange,
  autoAdvance = true,
  primaryCta = { label: 'Start a team trial', href: '#trial' },
  secondaryCta = { label: 'See how teams ship', href: '#customers' },
  linkComponent: Link = 'a',
  headingLevel = embedded ? 2 : 1,
  className,
  ...rest
}: HeroCollageProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const k = useYouj()
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const root = useRef<HTMLDivElement>(null)
  const inView = useInView(root, { amount: 0.35 })
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const index = Math.max(0, stages.findIndex((stage) => stage.id === value))
  const stage = stages[index]
  // Stages spread across the story's four states, however many there are.
  const step = stages.length > 1 ? Math.round((index * 3) / (stages.length - 1)) : 3
  const [picked, setPicked] = useState(false)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(false)
  const touring = autoAdvance && !picked && !k.reduced && stages.length > 1
  const holding = paused || hovered || focused || hidden || !inView
  const go = (id: string) => {
    setValue(id)
    onValueChange?.(id)
  }

  useEffect(() => {
    const sync = () => setHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [])

  // The shown stage's progress line is the tour's clock: when it fills, the next stage opens.
  const clock = useRef<Animation[]>([])
  useEffect(() => {
    if (!touring) return
    const line = root.current?.querySelector<HTMLElement>(`[data-progress="${value}"]`)
    if (!line || typeof line.animate !== 'function') return
    const animation = line.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: DWELL * k.timeScale, easing: 'linear', fill: 'forwards' })
    clock.current = [animation]
    animation.finished.then(
      () => go(stages[(index + 1) % stages.length]!.id),
      () => {},
    )
    return () => {
      animation.cancel()
      clock.current = []
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the tour restarts on these; what it steps through is read as it runs
  }, [touring, value, k.timeScale])
  useEffect(() => {
    clock.current.forEach((animation) => (holding ? animation.pause() : animation.play()))
  }, [holding, value, touring])

  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'overflow-hidden bg-canvas', className)}>
      <div
        ref={root}
        className={cn('grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,--spacing(136))] lg:gap-10', !embedded && 'mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24')}
      >
        <Stagger inView={false} variant="rise" className="flex max-w-xl flex-col items-start gap-6">
          {copy.eyebrow && (
            <span className="inline-flex items-center gap-2 text-ui-sm font-medium text-accent">
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />
              {copy.eyebrow}
            </span>
          )}
          <Title id={titleId} className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.05] xl:text-6xl">
            {copy.headline}
          </Title>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          <div className="flex flex-wrap gap-3">
            <Magnetic strength={0.25}>
              <Link href={primaryCta.href} onClick={primaryCta.onClick} data-yj-trigger="" className={buttonVariants({ size: 'lg', className: 'px-5' })}>
                <MagneticInner className="inline-flex items-center gap-2">
                  {primaryCta.label} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
                </MagneticInner>
              </Link>
            </Magnetic>
            {secondaryCta && (
              <Link href={secondaryCta.href} onClick={secondaryCta.onClick} className={buttonVariants({ size: 'lg', variant: 'outline' })}>
                {secondaryCta.label}
              </Link>
            )}
          </div>
          {copy.note && <p className="text-ui-sm text-fg-muted">{copy.note}</p>}
        </Stagger>

        <div
          className="flex min-w-0 flex-col gap-5"
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={() => setFocused(true)}
          onBlur={(event) => !event.currentTarget.contains(event.relatedTarget as Node | null) && setFocused(false)}
        >
          <div aria-hidden inert className="relative h-124 pointer-events-none">
            <div className="absolute -inset-6 -z-10 [mask-image:radial-gradient(closest-side,black_35%,transparent)]">
              <DotMatrixWave interactive={false} intensity={0.7} className="absolute inset-0" />
            </div>
            <CollageCards stage={step} copy={copy} />
          </div>

          <div role="group" aria-label={copy.stagesLabel} className="flex items-start gap-2">
            <ol className="grid min-w-0 flex-1 grid-flow-col auto-cols-fr gap-2">
              {stages.map((s, i) => (
                <li key={s.id} className="min-w-0">
                  <button
                    type="button"
                    aria-current={s.id === value ? 'step' : undefined}
                    aria-label={copy.stageName(i + 1, stages.length, s.label)}
                    onClick={() => {
                      setPicked(true)
                      go(s.id)
                    }}
                    className="group/stage flex w-full flex-col gap-2 rounded-md py-1 text-start focus-ring"
                  >
                    <span aria-hidden className={cn('relative block h-0.5 overflow-hidden rounded-full bg-line', s.id === value && !touring && 'bg-accent')}>
                      <span
                        data-progress={s.id}
                        className={cn('absolute inset-0 origin-left rounded-full bg-accent rtl:origin-right', (s.id !== value || !touring) && 'invisible')}
                        style={{ transform: 'scaleX(0)' }}
                      />
                    </span>
                    <span aria-hidden className={cn('truncate text-ui-sm font-medium transition-colors yj-duration-fast ease-standard', s.id === value ? 'text-fg' : 'text-fg-muted group-hover/stage:text-fg')}>
                      <span className="tabular-nums text-fg-subtle">{i + 1} </span>
                      {s.label}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            {touring && (
              <Button variant="ghost" size="icon-sm" aria-label={paused ? copy.play : copy.pause} onClick={() => setPaused((p) => !p)}>
                <PlayIcon size={14} active={!paused} />
              </Button>
            )}
          </div>
          <p aria-live="polite" className="min-h-15 max-w-md text-pretty text-ui text-fg-muted">
            {stage?.caption}
          </p>
        </div>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { HeroCollage }
export type { HeroCollageProps, HeroCollageCopy, HeroCollageCta, HeroCollageStage }
