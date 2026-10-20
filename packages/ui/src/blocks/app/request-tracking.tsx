'use client'

import { lazy, Suspense, useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal, Stagger } from '@youj/motion'
import { CheckIcon, CircleAlertIcon, ClockIcon, SearchIcon } from '@youj/icons'
import { AsyncButton } from '../../components/ui/async-button'
import { Badge } from '../../components/ui/badge'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { cn, dateTimeFormat } from '../../lib/utils'
import { DEFAULT_COPY, demo, ORDER, standing, type RequestTrackingCopy, type TrackingResult, type TrackingStep } from './request-tracking/data'

/* A page for “where is my…?”: someone types a reference (an order, a support
 * request, an incident) and sees where it stands as a vertical run of steps,
 * the finished ones ticked with when they happened, the current one marked
 * and the rest waiting, with the expected finish up top. Beside it a
 * packaging line fills its pallet as the request moves through its steps,
 * stops when a step fails and wraps the pallet, light green, once everything
 * is done (`media={null}` for the plain page, or your own node). The lookup is
 * Button onAction: it runs `onTrack(reference)`, which resolves to the
 * request (or rejects with an Error whose message says why it wasn't found),
 * and the result is announced politely. Start with a request already shown
 * (`result`), or `null` for the bare lookup. Reduced motion: the steps are
 * simply there and the line shows each state at once. Pass your own
 * `result`, wire `onTrack`, and rewrite any string in `copy`. */

type HeadingTag = 'h1' | 'h2' | 'h3'

/** The packaging line is a chunk of its own, fetched when the page shows it (`media={null}` fetches nothing). */
const PackagingLine = lazy(() => import('./request-tracking/packaging-line').then((m) => ({ default: m.PackagingLine })))

const TONE: Record<TrackingStep['state'], string> = {
  done: 'border-success-line bg-success-subtle text-success-text',
  current: 'border-accent-line bg-accent-subtle text-accent-text',
  upcoming: 'border-line bg-surface text-fg-subtle',
  failed: 'border-danger-line bg-danger-subtle text-danger-text',
}

interface RequestTrackingProps extends Omit<ComponentProps<'main'>, 'title' | 'children'> {
  /** The request shown first; `null` starts on the bare lookup. Default: an order being packed. */
  result?: TrackingResult | null
  /** Find a request by its reference; resolve to it, or reject with an Error whose message says why not. Default: any `ORD-…` reference finds the sample order. */
  onTrack?: (reference: string) => Promise<TrackingResult> | TrackingResult
  /** The reference in the field to begin with. Default: the shown request's. */
  defaultReference?: string
  /** The picture beside the request: your own node, or `null` for the plain page. Default: a packaging line that follows the request's steps. */
  media?: ReactNode
  /** The time zone times read in (IANA, e.g. `Europe/Berlin`). Default `UTC`, so the server and browser agree. */
  timeZone?: string
  /** The locale times read in. Default: the app's (YoujProvider), else en-US. */
  locale?: string
  /** The page heading's level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<RequestTrackingCopy>
  /** Default: the host's theme. */
  theme?: ThemeInput
}

function RequestTracking({
  result: initial = ORDER,
  onTrack = async (reference) => {
    await demo('RequestTracking: onTrack', 800)
    if (!/^ORD-\d+$/i.test(reference)) throw new Error('')
    return { ...ORDER, reference: reference.toUpperCase() }
  },
  defaultReference,
  media,
  timeZone = 'UTC',
  locale: localeProp,
  headingLevel = 1,
  copy: copyProp,
  theme,
  className,
  ...rest
}: RequestTrackingProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const Title = `h${headingLevel}` as HeadingTag
  const Sub = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  const fieldId = useId()
  const [reference, setReference] = useState(defaultReference ?? initial?.reference ?? '')
  const [result, setResult] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [announced, setAnnounced] = useState('')
  const when = useMemo(
    () => dateTimeFormat(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone, timeZoneName: 'short' }),
    [locale, timeZone],
  )
  const stamp = (at: Date | number | string) => when.format(new Date(at))
  const art =
    media === undefined ? (
      <Suspense fallback={null}>
        <Reveal inView={false} variant="scale" duration="slow" className="size-full">
          <PackagingLine {...standing(result)} />
        </Reveal>
      </Suspense>
    ) : (
      media
    )
  const rich = art !== null && art !== false

  const track = async () => {
    setError(null)
    const value = reference.trim()
    if (!value) {
      setError(copy.emptyReference)
      throw new Error('empty')
    }
    try {
      const found = await onTrack(value)
      setResult(found)
      setAnnounced(copy.found(found.reference))
    } catch (failure) {
      setError(failure instanceof Error && failure.message ? failure.message : copy.notFound)
      throw failure
    }
  }

  const content = (
    <div className={cn('flex w-full flex-col items-center gap-10', rich && 'lg:items-start')}>
      <Stagger
        inView={false}
        variant="rise"
        className={cn('flex w-full max-w-md flex-col items-center gap-6 text-center', rich && 'lg:items-start lg:text-start')}
      >
        <div className={cn('flex flex-col items-center gap-3', rich && 'lg:items-start')}>
          <Title className="text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{copy.title}</Title>
          <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
        </div>
        {/* A Reveal of its own, so the form takes the column's width rather than its content's. */}
        <Reveal className="w-full">
          <form noValidate aria-label={copy.lookupLabel} onSubmit={(event) => event.preventDefault()} className="w-full text-start">
            <Field invalid={error !== null}>
              <FieldLabel htmlFor={fieldId} className="sr-only">
                {copy.referenceLabel}
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  id={fieldId}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={copy.placeholder}
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  className="min-w-0 flex-1 font-mono"
                />
                <AsyncButton type="submit" onAction={track} pendingLabel={copy.tracking} successLabel={copy.tracked} errorLabel={copy.retry}>
                  <SearchIcon size={16} /> {copy.track}
                </AsyncButton>
              </div>
              {error ? <FieldError>{error}</FieldError> : <FieldDescription>{copy.referenceHint}</FieldDescription>}
            </Field>
          </form>
        </Reveal>
      </Stagger>
      <span role="status" aria-live="polite" className="sr-only">
        {announced}
      </span>
      {result && (
        <Reveal inView={false} delay={4} className="w-full max-w-xl">
          <section
            aria-label={copy.resultLabel(result.reference)}
            className="flex flex-col rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface"
          >
            <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-4">
              <div className="flex min-w-0 flex-col gap-1">
                <Sub className="text-ui-lg font-medium text-fg">{result.title}</Sub>
                <p className="flex flex-wrap items-center gap-x-2 text-ui-sm text-fg-muted">
                  <code className="font-mono text-fg">{result.reference}</code>
                  {result.eta !== undefined && (
                    <>
                      <span aria-hidden>·</span>
                      <span>
                        {copy.expected} {stamp(result.eta)}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <Badge variant={result.tone ?? 'default'}>{result.status}</Badge>
            </header>
            <ol aria-label={copy.stepsLabel} className="flex flex-col px-5 py-5">
              {result.steps.map((step, index) => {
                const last = index === result.steps.length - 1
                return (
                  <li key={index} aria-current={step.state === 'current' ? 'step' : undefined} className="relative flex gap-4 pb-6 last:pb-0">
                    {!last && (
                      <span
                        aria-hidden
                        className={cn('absolute start-3.25 top-7 -bottom-1 w-px', step.state === 'done' ? 'bg-success' : 'bg-line')}
                      />
                    )}
                    <span
                      aria-hidden
                      className={cn('relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border', TONE[step.state])}
                    >
                      {step.state === 'done' ? (
                        <CheckIcon size={14} />
                      ) : step.state === 'failed' ? (
                        <CircleAlertIcon size={14} />
                      ) : step.state === 'current' ? (
                        <ClockIcon size={14} />
                      ) : (
                        <span className="size-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <p className={cn('text-ui font-medium', step.state === 'upcoming' ? 'text-fg-muted' : 'text-fg')}>
                          {step.title}
                          <span className="sr-only"> ({copy.states[step.state]})</span>
                        </p>
                        {step.at !== undefined && (
                          <time dateTime={new Date(step.at).toISOString()} className="text-ui-sm text-fg-subtle tabular-nums">
                            {stamp(step.at)}
                          </time>
                        )}
                      </div>
                      {step.detail && <p className="text-ui-sm text-fg-muted">{step.detail}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        </Reveal>
      )}
    </div>
  )

  const page = (
    <main {...rest} className={cn('relative isolate flex min-h-dvh flex-col items-center bg-canvas px-4 py-16 text-fg sm:px-6 lg:py-20', className)}>
      {rich ? (
        <div className="grid w-full max-w-6xl items-start justify-items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div aria-hidden className="size-60 sm:size-72 lg:sticky lg:top-20 lg:order-last lg:size-120">
            {art}
          </div>
          {content}
        </div>
      ) : (
        content
      )}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

export { RequestTracking }
export type { RequestTrackingProps, RequestTrackingCopy, TrackingResult, TrackingStep }
