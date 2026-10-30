'use client'

import { useId, useRef, useState, useSyncExternalStore, type ComponentProps, type ElementType } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { ArrowRightIcon, CheckIcon } from '@youj/icons'
import { Button, buttonVariants } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, type ProductTourCopy, type ProductTourStep, type ProductTourStepContext } from './product-tour/data'
import { TourBeacon } from './product-tour/beacon'
import { STEPS } from './product-tour/steps'

/* A walkthrough you do rather than watch. The steps sit on a rail (vertical
 * beside the picture on wide screens, a pill strip above it on phones); each
 * step's picture is a live window of real components: connect a repository,
 * flip a guardrail, reply on a preview, move a canary and promote it. A
 * beacon rings the control each step asks you to try, pinging slowly until
 * the step is done. Doing a step's thing checks it off and moves the
 * progress line; Back and Next walk the rest, and the last step ends on your
 * call to action. Arrow keys move between steps (they are tabs), and a step's
 * state survives going back to it. Reduced motion: panels swap in place and
 * the beacon is a still ring.
 *
 * Pass your own `steps` (each with a `render` that gets `{ done, complete }`;
 * mark the control to try with `data-yj-tour-target` and the beacon finds it)
 * and follow or drive the open step with `value`; the heading, labels and the
 * closing call to action are in `copy` and `cta`. */

const WIDE = '(min-width: 64rem)'
function subscribeWide(onChange: () => void) {
  const query = window.matchMedia?.(WIDE)
  query?.addEventListener?.('change', onChange)
  return () => query?.removeEventListener?.('change', onChange)
}
const isWide = () => window.matchMedia?.(WIDE).matches ?? false

interface ProductTourProps extends Omit<ComponentProps<'section'>, 'children' | 'defaultValue'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The steps, in order. Default: the demo's connect, guardrails, review and canary. */
  steps?: ProductTourStep[]
  /** The open step's id, controlled. */
  value?: string
  /** The step shown first, uncontrolled. Default: the first. */
  defaultValue?: string
  /** Called with the step's id when someone opens one. */
  onValueChange?: (value: string) => void
  /** The ids of the steps done, controlled. */
  done?: string[]
  /** Called with the ids of the steps done, as each is completed or the tour restarted. */
  onDoneChange?: (done: string[]) => void
  /** The call to action after the last step; `null` hides it. Default: "Start with your own project" to `#signup`. */
  cta?: { label?: string; href: string; onClick?: ComponentProps<'a'>['onClick'] } | null
  /** Renders the call to action: pass your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<ProductTourCopy>
  /** The heading's level; each open step's heading sits one below. Default 2. */
  headingLevel?: 1 | 2 | 3
}

function ProductTour({
  theme,
  embedded = false,
  steps = STEPS,
  value: valueProp,
  defaultValue = steps[0]?.id ?? '',
  onValueChange,
  done: doneProp,
  onDoneChange,
  cta = { href: '#signup' },
  linkComponent: Link = 'a',
  copy: copyProp,
  headingLevel = 2,
  className,
  ...rest
}: ProductTourProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const Step = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  const wide = useSyncExternalStore(subscribeWide, isWide, () => false)
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const [done, setDone] = useControllableState<string[]>(doneProp, [])
  // A panel keeps what the visitor did in it, so it stays mounted once visited.
  const [visited, setVisited] = useState<string[]>([defaultValue])
  const [announcement, setAnnouncement] = useState('')
  const panes = useRef<HTMLDivElement>(null)
  const index = Math.max(0, steps.findIndex((step) => step.id === value))
  const last = index === steps.length - 1
  const open = (id: string) => {
    setValue(id)
    setVisited((all) => (all.includes(id) ? all : [...all, id]))
    onValueChange?.(id)
  }
  const complete = (step: ProductTourStep) => {
    if (done.includes(step.id)) return
    const next = [...done, step.id]
    setDone(next)
    setAnnouncement(copy.stepDone(step.title))
    onDoneChange?.(next)
  }
  const reset = () => {
    setDone([])
    setVisited([steps[0]!.id])
    setValue(steps[0]!.id)
    setAnnouncement('')
    onDoneChange?.([])
    onValueChange?.(steps[0]!.id)
  }
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'bg-canvas py-20 md:py-28', className)}>
      <div className={cn('flex flex-col gap-10', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <Reveal className="flex max-w-2xl flex-col gap-3">
          <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
          <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            {copy.title}
          </Title>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
        </Reveal>

        <Tabs
          value={value}
          onValueChange={(next) => open(next as string)}
          orientation={wide ? 'vertical' : 'horizontal'}
          className="gap-6 lg:grid lg:grid-cols-[minmax(0,--spacing(80))_minmax(0,1fr)] lg:items-start lg:gap-10"
        >
          <div className="flex min-w-0 flex-col gap-4">
            <TabsList variant={wide ? 'underline' : 'pill'} aria-label={copy.stepsLabel} className="w-full">
              {steps.map((step, i) => {
                const finished = done.includes(step.id)
                return (
                  <TabsTrigger
                    key={step.id}
                    value={step.id}
                    // Wide, the tab shows its number, title and (picked) description: the name starts with those, then says where it stands.
                    aria-label={
                      wide
                        ? `${[finished ? null : i + 1, step.title, step.id === value ? step.description : null].filter(Boolean).join(' ')}, ${copy.stepName(i + 1, steps.length, step.title, finished)}`
                        : copy.stepName(i + 1, steps.length, step.title, finished)
                    }
                    className={cn(wide ? 'h-auto w-full flex-col items-stretch gap-1.5 py-3 ps-4 pe-3 text-start whitespace-normal' : 'flex-1')}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        aria-hidden
                        className={cn(
                          'grid size-5 shrink-0 place-items-center rounded-full border text-ui-xs font-semibold tabular-nums transition-colors yj-duration-fast ease-standard',
                          finished ? 'border-transparent bg-accent text-on-accent' : 'border-line text-fg-muted',
                        )}
                      >
                        {finished ? <CheckIcon size={12} strokeWidth={3} /> : i + 1}
                      </span>{' '}
                      {wide && step.title}
                    </span>{' '}
                    {wide && step.id === value && <span className="font-sans text-ui-sm font-normal tracking-normal text-fg-muted normal-case">{step.description}</span>}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            <div className="flex flex-col gap-1.5">
              <Progress value={(done.length / Math.max(steps.length, 1)) * 100} aria-label={copy.progress(done.length, steps.length)} className="h-1.5" />
              <p className="text-ui-sm text-fg-muted tabular-nums">{copy.progress(done.length, steps.length)}</p>
            </div>
          </div>

          <div ref={panes} className="relative flex min-w-0 flex-col gap-4">
            <TourBeacon host={panes} step={value} show={!done.includes(value)} />
            {steps.map((step) => {
              const finished = done.includes(step.id)
              const context: ProductTourStepContext = { done: finished, complete: () => complete(step), copy }
              return (
                <TabsContent
                  key={step.id}
                  value={step.id}
                  keepMounted={visited.includes(step.id)}
                  data-yj-tour-step={step.id}
                  // The tallest step's window at 100%: moving through the tour never resizes the section.
                  className="flex min-h-84.75 flex-col overflow-hidden rounded-2xl border border-line bg-canvas shadow-lg"
                >
                  <div aria-hidden className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
                    <span className="flex gap-1.5">
                      <span className="size-2.5 rounded-full bg-well" />
                      <span className="size-2.5 rounded-full bg-well" />
                      <span className="size-2.5 rounded-full bg-well" />
                    </span>
                    <span className="min-w-0 flex-1 truncate rounded-md bg-band px-3 py-1 text-center text-ui-xs text-fg-muted">{copy.address}</span>
                  </div>
                  <div className="flex flex-col gap-4 p-4 sm:p-6">
                    <Step className="flex flex-wrap items-center justify-between gap-2 text-ui-lg font-semibold">
                      {step.title}
                      {step.prompt && (
                        <span className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-ui-xs font-medium text-accent-text">
                          {copy.try}: {step.prompt}
                        </span>
                      )}
                    </Step>
                    {!wide && <p className="text-ui text-fg-muted">{step.description}</p>}
                    {step.render(context)}
                  </div>
                </TabsContent>
              )
            })}
            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={() => open(steps[index - 1]!.id)} disabled={index === 0}>
                {copy.back}
              </Button>
              {last ? (
                <div className="flex items-center gap-2">
                  {done.length > 0 && (
                    <Button variant="ghost" onClick={reset}>
                      {copy.reset}
                    </Button>
                  )}
                  {cta && (
                    <Link href={cta.href} onClick={cta.onClick} className={buttonVariants({})}>
                      {cta.label ?? copy.finish}
                      <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
                    </Link>
                  )}
                </div>
              ) : (
                <Button onClick={() => open(steps[index + 1]!.id)}>
                  {copy.next}
                  <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
                </Button>
              )}
            </div>
          </div>
        </Tabs>
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { ProductTour }
export type { ProductTourProps, ProductTourCopy, ProductTourStep, ProductTourStepContext }
