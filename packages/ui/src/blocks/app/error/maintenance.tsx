'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Counter, Reveal, Stagger } from '@youj/motion'
import { CheckIcon, CircleDashedIcon, LoaderRingIcon } from '@youj/icons'
import { AsyncButton } from '../../../components/ui/async-button'
import { Badge } from '../../../components/ui/badge'
import { Field, FieldError, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Progress } from '../../../components/ui/progress'
import { useNow } from '../../../hooks/use-now'
import { cn, dateTimeFormat } from '../../../lib/utils'
import { alignment, RepairBenchArt, Split } from './art'
import { EMAIL, type ErrorScreenCopy, type ErrorScreenStep, type LinkComponent } from './data'
import { StatusLink } from './server-error'

const pad = (n: number) => ({ value: n, format: { minimumIntegerDigits: 2 } })

interface MaintenanceProps {
  start: number
  end: number
  statusHref: string
  steps: readonly ErrorScreenStep[]
  onSubscribe: (email: string) => Promise<unknown> | unknown
  /** The picture beside the text; undefined for the repair bench, null for none. */
  media: ReactNode
  copy: ErrorScreenCopy
  link: LinkComponent
  locale: string
  headingLevel: 1 | 2 | 3
}

export function Maintenance({ start, end, statusHref, steps, onSubscribe, media, copy, link, locale, headingLevel }: MaintenanceProps) {
  const Title = `h${headingLevel}` as const
  const now = useNow(1000)
  // Nothing time-based renders until the browser knows the time: the server's clock would disagree on hydration.
  const remaining = now === null ? 0 : Math.max(0, end - now)
  const progress = now === null ? 0 : Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
  const minutes = Math.ceil(remaining / 60_000)
  const time = useMemo(() => dateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }), [locale])
  const art = media === undefined ? <RepairBenchArt progress={now === null ? null : progress / 100} done={now !== null && remaining === 0} /> : media
  const rich = art !== null && art !== false
  const align = alignment(rich)
  return (
    <>
      <Split art={art}>
        <Stagger inView={false} variant="rise" className={cn('flex w-full max-w-xl flex-col gap-6', align)}>
          <Badge variant="warning">{copy.maintenanceBadge}</Badge>
          <p
            role="timer"
            aria-label={now === null ? copy.timeLeft : copy.backIn(minutes)}
            className={cn(
              'flex items-baseline font-mono font-semibold tracking-tighter text-accent tabular-nums',
              rich ? 'text-4xl sm:text-5xl' : 'text-5xl sm:text-6xl',
            )}
          >
            {[3_600_000, 60_000, 1000].map((unit, i) => (
              <span key={unit} className="flex items-baseline">
                {i > 0 && <span className="px-1 text-fg-muted">:</span>}
                <Counter {...pad(Math.floor(remaining / unit) % (i === 0 ? Infinity : 60))} mode="roll" inView={false} duration="base" />
              </span>
            ))}
          </p>
          <Title className="text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{copy.maintenanceTitle}</Title>
          <p className="max-w-md text-pretty text-ui-lg text-fg-muted">{copy.maintenanceDescription}</p>
          {/* Reveals of their own, so the card and the form take the column's width rather than their content's. */}
          <Reveal className="w-full">
            <div
              className={cn(
                'mx-auto flex w-full max-w-md flex-col gap-2 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface/80 youj-allow-glass p-4 text-start backdrop-blur',
                rich && 'lg:mx-0',
              )}
            >
              <div className="flex items-baseline justify-between gap-3 text-ui-sm text-fg-muted">
                <span>{now === null ? ' ' : copy.started(time.format(start))}</span>
                <span>{now === null ? ' ' : copy.backBy(time.format(end))}</span>
              </div>
              <Progress value={progress} aria-label={copy.progress} />
              <ol className="mt-2 flex flex-col gap-2">
                {steps.map((step) => (
                  <li key={step.label} className="flex items-center gap-2.5 text-ui">
                    {step.state === 'done' ? (
                      <CheckIcon size={16} className="text-success" />
                    ) : step.state === 'active' ? (
                      <LoaderRingIcon size={16} className="text-accent" />
                    ) : (
                      <CircleDashedIcon size={16} className="text-fg-muted" />
                    )}
                    <span className={step.state === 'pending' ? 'text-fg-muted' : 'text-fg'}>{step.label}</span>
                    <span className="sr-only">{copy.stepStates[step.state]}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
          <Reveal className="w-full">
            <Subscribe onSubscribe={onSubscribe} copy={copy} className={cn('mx-auto', rich && 'lg:mx-0')} />
          </Reveal>
          <StatusLink href={statusHref} copy={copy} link={link} />
        </Stagger>
      </Split>
    </>
  )
}

/** Email me when it's back: an address checked here, then handed to `onSubscribe`. */
function Subscribe({
  onSubscribe,
  copy,
  className,
}: {
  onSubscribe: (email: string) => Promise<unknown> | unknown
  copy: ErrorScreenCopy
  className?: string
}) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const subscribe = async () => {
    setError(null)
    if (!EMAIL.test(email.trim())) {
      setError(copy.invalidEmail)
      throw new Error('invalid')
    }
    try {
      await onSubscribe(email.trim())
    } catch (failure) {
      setError(failure instanceof Error && failure.message ? failure.message : copy.subscribeFailed)
      throw failure
    }
  }
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className={cn('w-full max-w-md text-start', className)}>
      <Field invalid={error !== null}>
        <FieldLabel>{copy.subscribeLabel}</FieldLabel>
        <div className="flex gap-2">
          <Input
            type="email"
            autoComplete="email"
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-w-0 flex-1"
          />
          <AsyncButton
            type="submit"
            variant="outline"
            onAction={subscribe}
            pendingLabel={copy.subscribing}
            successLabel={copy.subscribed}
            errorLabel={copy.subscribeRetry}
          >
            {copy.subscribe}
          </AsyncButton>
        </div>
        {error && <FieldError>{error}</FieldError>}
      </Field>
    </form>
  )
}
