'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type ElementType } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { ArrowRightIcon, CheckIcon, PlayIcon } from '@youj/icons'
import { Button, buttonVariants } from '../../components/ui/button'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useVisible } from '../../hooks/use-visible'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, STEPS, type FeatureStepsCopy, type FeatureStepsCta, type FeatureStepsState, type FeatureStepsStep } from './feature-steps/data'

/* How it works, as a release you can watch. The steps sit on one track
 * (across the page on wide screens, down a rail on phones) and a lens rides
 * it: it rests on the step in play, its ring unwinding as the step plays,
 * and when the ring is gone it glides on to the next number, filling the
 * track behind it. Each step's picture plays its moment as the lens
 * arrives (the framework detected, the build streaming, reviewers on the
 * preview, the regions lighting up) and holds it once the lens moves on;
 * after the last step the lens slides back and the next release starts.
 * The numbers are buttons: pick one and the lens glides there from wherever
 * it is, and the tour stops until Play. It holds while keyboard focus is in
 * the track, off screen and in a hidden tab, and never runs under reduced
 * motion, where every step shows its finished picture.
 *
 * Pass your own `steps` (a `media` node, or a function of the step's state)
 * and `cta`, and follow or drive the step in play with `value`; every string
 * is in `copy`, and `linkComponent` renders the link. */

/** Milliseconds a step is held in play, before the Speed control. */
const DWELL = 3400

interface FeatureStepsProps extends Omit<ComponentProps<'section'>, 'children' | 'defaultValue'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<FeatureStepsCopy>
  /** The steps, in order; four fill a wide row. Default: the demo's four. */
  steps?: FeatureStepsStep[]
  /** The step in play (its `id`, or its title), controlled. */
  value?: string
  /** The step in play first, uncontrolled. Default: the first. */
  defaultValue?: string
  /** Called with the step's id when someone picks one or the tour moves on. */
  onValueChange?: (value: string) => void
  /** Tour the steps on its own until someone picks one. Default true (never under reduced motion). */
  autoAdvance?: boolean
  /** The call to action beside the heading; `null` hides it. Default: "Import a repository" to `#import`. */
  cta?: FeatureStepsCta | null
  /** Renders every link: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** The heading's level. Default 2. */
  headingLevel?: 1 | 2 | 3
}

function FeatureSteps({
  theme,
  embedded = false,
  copy: copyProp,
  steps = STEPS,
  value: valueProp,
  defaultValue,
  onValueChange,
  autoAdvance = true,
  cta = { label: 'Import a repository', href: '#import' },
  linkComponent: Link = 'a',
  headingLevel = 2,
  className,
  ...rest
}: FeatureStepsProps) {
  const k = useYouj()
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const lensId = useId()
  const Title = `h${headingLevel}` as const
  const ids = steps.map((step) => step.id ?? step.title)
  const [value, setValue] = useControllableState(valueProp, defaultValue ?? ids[0] ?? '')
  const active = Math.max(0, ids.indexOf(value))
  const [stopped, setStopped] = useState(false)
  const [focused, setFocused] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const visible = useVisible(track)
  const touring = autoAdvance && !stopped && !k.reduced && steps.length > 1
  const go = (index: number) => {
    const id = ids[index]
    if (id === undefined) return
    setValue(id)
    onValueChange?.(id)
  }
  const stateOf = (index: number): FeatureStepsState => (k.reduced || index < active ? 'done' : index === active ? 'active' : 'idle')

  // The lens's ring is the tour's clock: it arrives whole, unwinds while the step plays, and when it's gone the lens moves on.
  const clock = useRef<Animation | null>(null)
  useEffect(() => {
    if (!touring) return
    const ring = track.current?.querySelector<SVGElement>('[data-yj-clock]')
    if (!ring || typeof ring.animate !== 'function') return
    const animation = ring.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: -1 }], {
      duration: DWELL * k.timeScale,
      delay: k.ms('deliberate'),
      easing: 'linear',
      fill: 'forwards',
    })
    clock.current = animation
    animation.finished.then(
      () => go((active + 1) % steps.length),
      () => {},
    )
    return () => {
      animation.cancel()
      clock.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the tour restarts on these; what it steps through is read as it runs
  }, [touring, value, k, steps.length])
  useEffect(() => {
    const animation = clock.current
    if (!animation) return
    if (focused || !visible) animation.pause()
    else animation.play()
  }, [focused, visible, value, touring])

  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-12 md:gap-16', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div className="flex max-w-2xl flex-col gap-3">
            {copy.eyebrow && <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>}
            <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {copy.title}
            </Title>
            <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {autoAdvance && !k.reduced && steps.length > 1 && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={touring ? copy.pause : copy.play}
                onClick={() => {
                  setStopped(touring)
                  // An explicit Play runs now, even with focus still on this button.
                  if (!touring) setFocused(false)
                }}
              >
                <PlayIcon size={14} active={touring} />
              </Button>
            )}
            {cta && (
              <Link href={cta.href} onClick={cta.onClick} className={buttonVariants({ variant: 'outline', className: 'gap-2' })} data-yj-trigger="">
                {cta.label} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
              </Link>
            )}
          </div>
        </Reveal>
        <MotionFeatures features="max">
          <div
            ref={track}
            onFocus={(event) => event.target.matches(':focus-visible') && setFocused(true)}
            onBlur={(event) => !event.currentTarget.contains(event.relatedTarget as Node | null) && setFocused(false)}
          >
            <ol aria-label={copy.stepsLabel} className="grid gap-10 lg:grid-cols-4 lg:gap-8">
              {steps.map((step, i) => {
                const state = stateOf(i)
                const media = typeof step.media === 'function' ? step.media(state) : step.media
                return (
                  <li key={ids[i]} className="relative grid grid-cols-[--spacing(10)_minmax(0,1fr)] gap-x-4 lg:grid-cols-1 lg:grid-rows-[auto_1fr] lg:gap-y-6">
                    {i < steps.length - 1 && (
                      <span
                        aria-hidden
                        className={cn(
                          'absolute overflow-hidden rounded-full bg-line',
                          // Phones: down the rail to the next number. Wide: across to it, a lens's width clear of both.
                          'start-5 top-14 -bottom-6 w-0.5 -translate-x-1/2 rtl:translate-x-1/2 lg:start-14 lg:top-[--spacing(4.75)] lg:-end-4 lg:bottom-auto lg:h-0.5 lg:w-auto lg:translate-x-0 rtl:lg:translate-x-0',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute inset-0 bg-accent transition-transform yj-duration-deliberate ease-emphasized',
                            'origin-top lg:origin-left rtl:lg:origin-right',
                            i < active || k.reduced ? 'scale-100' : 'scale-y-0 lg:scale-x-0 lg:scale-y-100',
                          )}
                        />
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={copy.stepName(i + 1, steps.length, step.title)}
                      aria-current={i === active ? 'step' : undefined}
                      onClick={() => {
                        setStopped(true)
                        go(i)
                      }}
                      className={cn(
                        'relative z-10 grid size-10 place-items-center rounded-full border text-ui font-semibold tabular-nums focus-ring',
                        'transition-[background-color,color,border-color] yj-duration-base ease-standard',
                        state === 'idle' ? 'border-line bg-surface text-fg-muted hover:text-fg' : 'border-accent bg-accent text-on-accent',
                      )}
                      // The number fills as the lens arrives, not as it sets off.
                      style={{ transitionDelay: state === 'active' && !k.reduced ? `${Math.round(k.ms('deliberate') * 0.6)}ms` : undefined }}
                    >
                      <span aria-hidden>{state === 'done' ? <CheckIcon key={`done-${i}`} trigger="mount" size={16} strokeWidth={2.5} /> : i + 1}</span>
                      {i === active && (
                        <m.span
                          layoutId={lensId}
                          aria-hidden
                          transition={k.tween('deliberate', 'emphasized')}
                          className="pointer-events-none absolute -inset-1.5 rounded-full"
                        >
                          <svg viewBox="0 0 52 52" className="size-full -rotate-90 overflow-visible">
                            <circle cx="26" cy="26" r="25" fill="none" strokeWidth="2" className="stroke-line" />
                            <circle
                              data-yj-clock=""
                              cx="26"
                              cy="26"
                              r="25"
                              fill="none"
                              strokeWidth="2"
                              strokeLinecap="round"
                              pathLength={1}
                              strokeDasharray="1"
                              className="stroke-accent"
                            />
                          </svg>
                        </m.span>
                      )}
                    </button>
                    <div className="flex min-w-0 flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-ui-lg font-semibold text-fg">{step.title}</h3>
                        <p className="text-pretty text-ui text-fg-muted lg:min-h-[3lh]">{step.description}</p>
                      </div>
                      {media != null && (
                        <div
                          aria-hidden
                          inert
                          data-state={state}
                          className={cn(
                            'flex flex-1 flex-col transition-[opacity,translate] yj-duration-slow ease-standard',
                            state === 'idle' && 'opacity-60',
                            state === 'active' && !k.reduced && '-translate-y-1',
                          )}
                        >
                          {media}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </MotionFeatures>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { FeatureSteps }
export type { FeatureStepsProps, FeatureStepsCopy, FeatureStepsCta, FeatureStepsStep, FeatureStepsState }
