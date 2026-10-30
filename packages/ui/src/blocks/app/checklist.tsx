'use client'

import { useCallback, useId, useState, type ComponentProps, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { Counter, PresenceItem, PresenceList } from '@youj/motion'
import { MinimizeIcon, PartyPopperIcon, XIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn } from '../../lib/utils'
import { Eyebrow } from '../../components/ui/typography'
import { DEFAULT_COPY, stepsFor, demo, type ChecklistCopy, type ChecklistStep } from './checklist/data'
import { FauxApp, ProgressRing, StepRow } from './checklist/step-row'

/* A getting-started checklist that floats at the bottom-end of an app. The
 * header's ring fills and its percentage counts up as steps are done. One step
 * is open at a time (Collapse) with a line of why and the action that does
 * it; finishing a step draws its check and the row glides down into Done
 * (PresenceList reorder). With every step done the list gives way to a
 * celebration and a dismiss. Minimize folds the card into a pill that keeps
 * the count, the box morphing between the two on the smooth spring, and back.
 * Each change is announced. Reduced motion: rows, the ring and the box change
 * in place. Each step's demo stand-in runs until `onComplete` does the work.
 * `embedded` puts the card inside a host app instead: no faux app, landmark or
 * h1 of its own, laid out where the host puts it, in the host's theme;
 * `product` names the product its copy speaks for.
 * Pass your own `steps` and do each one in `onComplete`; track progress with
 * `completed` / `onCompletedChange`; every string is in `copy`. It is built for
 * the compact layout density (ui.css), taken from the page; embedded, it sits at the
 * elevation of the cards beside it and stops at its natural width unless
 * `fill`. */


interface ChecklistProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Ids of the steps done when the card opens, uncontrolled. Default: the first step. */
  defaultCompleted?: string[]
  /** Ids of the done steps, controlled. Pair it with `onCompletedChange`. */
  completed?: string[]
  /** Called with the done ids after a step completes. */
  onCompletedChange?: (ids: string[]) => void
  /** Starts folded into the pill, uncontrolled. Default false. */
  defaultMinimized?: boolean
  /** Folded into the pill, controlled. Pair it with `onMinimizedChange`. */
  minimized?: boolean
  /** Called when the card folds or unfolds. */
  onMinimizedChange?: (minimized: boolean) => void
  /** Inside a host app: no faux app, page landmark or h1; the card sits where the host lays it out. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (672px at 100% scale). Default false. */
  fill?: boolean
  /** The product its copy names. Default "Fern". Prefer `brand`. */
  product?: string
  /** The product the copy names. Default: Fern. */
  brand?: { name: string; logo?: ReactNode }
  /** The steps, in order. Default: the demo's five, from workspace to domain. */
  steps?: ChecklistStep[]
  /** Does a step's work when its action is pressed; resolve to mark it done, throw to show why it failed. Default: a short demo wait. */
  onComplete?: (step: ChecklistStep) => Promise<unknown> | unknown
  /** Called when the finished checklist is dismissed. */
  onDismiss?: () => void
  /** The card title's level. Default 2. */
  headingLevel?: 1 | 2 | 3
  /** Formats the percentage. Default: the provider's locale. */
  locale?: string
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<ChecklistCopy>
  /** Classes for its parts: `list` is the region the steps scroll in (its height, 306px at 100%, holds the card's size as steps open, close and finish). */
  classNames?: { list?: string }
}

function ChecklistContent({
  defaultCompleted = ['workspace'],
  completed: completedProp,
  onCompletedChange,
  defaultMinimized = false,
  minimized: minimizedProp,
  onMinimizedChange,
  embedded = true,
  fill = false,
  product,
  brand,
  steps: stepsProp,
  onComplete,
  onDismiss,
  headingLevel = 2,
  locale,
  copy: copyProp,
  classNames,
  className,
  ...rest
}: ChecklistProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const name = brand?.name ?? product ?? 'Fern'
  const k = useYouj()
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const STEPS = stepsProp ?? stepsFor(name)
  const { announce, announcer } = useAnnouncer()
  const [ownDone, setOwnDone] = useState<string[]>(defaultCompleted)
  const done = completedProp ?? ownDone
  const [ownMinimized, setOwnMinimized] = useState(defaultMinimized)
  const minimized = minimizedProp ?? ownMinimized
  const setMinimized = (next: boolean) => {
    setOwnMinimized(next)
    onMinimizedChange?.(next)
  }
  const [dismissed, setDismissed] = useState(false)
  const [open, setOpen] = useState<string | null>(() => STEPS.find((s) => !done.includes(s.id))?.id ?? null)
  const count = STEPS.filter((s) => done.includes(s.id)).length
  const all = count === STEPS.length
  const progress = STEPS.length ? count / STEPS.length : 0

  // The morphing box keeps round corners only with an inline radius: read the class's once.
  const [radius, setRadius] = useState<string>()
  const card = useCallback((el: HTMLElement | null) => {
    if (!el) return
    const inline = el.style.borderRadius
    el.style.borderRadius = ''
    setRadius(getComputedStyle(el).borderRadius || undefined)
    el.style.borderRadius = inline
  }, [])

  const complete = (step: ChecklistStep) => {
    const next = [...done, step.id]
    setOwnDone(next)
    onCompletedChange?.(next)
    const upcoming = STEPS.find((s) => !next.includes(s.id))
    setOpen(upcoming?.id ?? null)
    const n = STEPS.filter((s) => next.includes(s.id)).length
    announce(n === STEPS.length ? copy.announceAll : copy.announceStep(step.title, n, STEPS.length))
  }

  const todo = STEPS.filter((s) => !done.includes(s.id))
  const finished = STEPS.filter((s) => done.includes(s.id))
  const layout = k.reduced ? false : true
  const spring = k.reduced ? { type: false as const } : k.spring('smooth')

  // Embedded, the card is a plain box in the host's layout; standalone, it floats over the faux app as its own region.
  const Box = embedded ? motion.div : motion.aside
  const content = (
    <>
        {announcer}
        <AnimatePresence>
          {!dismissed && (
            <Box
              key="checklist"
              ref={card}
              aria-label={embedded ? undefined : copy.region}
              layout={layout}
              initial={k.reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={k.reduced ? undefined : { opacity: 0, y: 16, transition: k.tween('fast', 'exit') }}
              transition={{ layout: spring, default: k.reduced ? { type: false } : k.tween('base', 'enter') }}
              style={{ borderRadius: minimized ? 9999 : radius }}
              className={cn(
                'overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-overlay text-fg',
                embedded ? ['shadow-xs', minimized ? 'w-fit' : 'w-full'] : ['absolute end-4 bottom-4 z-10 shadow-lg', minimized ? 'w-auto' : 'w-88 max-w-[calc(100vw-2rem)]'],
              )}
            >
              {minimized ? (
                <motion.button
                  layout="position"
                  type="button"
                  // The pill's words as shown, then what it opens.
                  aria-label={`${copy.pill} ${copy.pillCount(count, STEPS.length)}, ${copy.openPill(count, STEPS.length)}`}
                  onClick={() => setMinimized(false)}
                  className="focus-ring flex items-center gap-2.5 rounded-full py-1.5 ps-1.5 pe-4 text-ui font-medium"
                >
                  <ProgressRing value={progress} size={28} />
                  {copy.pill}{' '}
                  <span className="text-fg-muted tabular-nums">{copy.pillCount(count, STEPS.length)}</span>
                </motion.button>
              ) : (
                <motion.div layout="position" className="flex flex-col">
                  <div className="flex items-center gap-3 border-b border-line p-4">
                    <div className="relative grid place-items-center">
                      <ProgressRing value={progress} size={44} />
                      <Counter
                        value={progress}
                        inView={false}
                        locale={locale}
                        format={{ style: 'percent' }}
                        className="absolute text-ui-xs font-semibold"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Title id={titleId} className="text-ui font-semibold tracking-tight">
                        {copy.title(name)}
                      </Title>
                      <p className="text-ui-sm text-fg-muted tabular-nums">{copy.stepsDone(count, STEPS.length)}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" aria-label={copy.minimize} onClick={() => setMinimized(true)}>
                      <MinimizeIcon size={16} />
                    </Button>
                  </div>
                  {/* The steps and the celebration share one height: opening, closing and finishing a step never resize the card. */}
                  <div className={cn('yj-scrollbar flex h-76.5 flex-col overflow-y-auto', classNames?.list)}>
                    {all ? (
                      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
                        <span className="grid size-12 place-items-center rounded-full bg-accent-subtle text-accent">
                          <PartyPopperIcon trigger="mount" size={24} />
                        </span>
                        <div className="flex flex-col gap-1">
                          <p className="text-ui font-semibold">{copy.allSet}</p>
                          <p className="text-ui-sm text-fg-muted">{copy.allSetBody(name)}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDismissed(true)
                            onDismiss?.()
                          }}
                        >
                          <XIcon size={14} /> {copy.dismiss}
                        </Button>
                      </div>
                    ) : (
                      <PresenceList className="flex flex-col gap-0.5 p-2">
                        {todo.map((s) => (
                          <PresenceItem key={s.id}>
                            <StepRow
                              step={s}
                              copy={copy}
                              done={false}
                              open={open === s.id}
                              onToggle={() => setOpen(open === s.id ? null : s.id)}
                              onRun={() => (onComplete ? onComplete(s) : demo('Checklist: onComplete', 700))}
                              onDone={() => complete(s)}
                            />
                          </PresenceItem>
                        ))}
                        {finished.length > 0 && (
                          <PresenceItem key="done-label" aria-hidden className="px-2.5 pt-3 pb-1 text-ui-xs font-medium tracking-wide text-fg-muted uppercase">
                            <Eyebrow className="text-ui-xs font-medium tracking-wide text-fg-muted uppercase">{copy.done}</Eyebrow>
                          </PresenceItem>
                        )}
                        {finished.map((s) => (
                          <PresenceItem key={s.id}>
                            <StepRow step={s} copy={copy} done open={false} onToggle={() => {}} onRun={() => {}} onDone={() => {}} />
                          </PresenceItem>
                        ))}
                      </PresenceList>
                    )}
                  </div>
                </motion.div>
              )}
            </Box>
          )}
        </AnimatePresence>
        {dismissed && (
          <Button variant="outline" size="sm" className={cn(!embedded && 'absolute end-4 bottom-4')} onClick={() => setDismissed(false)}>
            {copy.show}
          </Button>
        )}
    </>
  )

  if (embedded) {
    const expanded = !minimized && !dismissed
    return (
      <section {...rest} aria-labelledby={expanded ? titleId : undefined} aria-label={expanded ? undefined : copy.region} className={cn('relative', !fill && 'max-w-2xl', className)}>
        {content}
      </section>
    )
  }
  return (
    <div {...rest} className={cn('relative isolate min-h-dvh overflow-hidden bg-canvas text-fg', className)}>
        <FauxApp />
        <main className="sr-only">
          <h1>{copy.page(name)}</h1>
        </main>
        {content}
      </div>
  )
}

function Checklist({ theme, ...props }: ChecklistProps & { /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */ theme?: ThemeInput }) {
  if (!theme) return <ChecklistContent {...props} />
  return (
    <ThemeScope theme={theme}>
      <ChecklistContent {...props} />
    </ThemeScope>
  )
}

export { Checklist, type ChecklistProps, type ChecklistCopy, type ChecklistStep }
