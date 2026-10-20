'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useLocale } from '@youj/core'
import { Reveal, Stagger } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Countdown } from '../../../components/ui/countdown'
import { Field, FieldError, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { useNow } from '../../../hooks/use-now'
import { cn, dateTimeFormat } from '../../../lib/utils'
import { alignment, DroneDockArt, Split } from './art'
import { DEFAULT_COPY, demo, type ErrorScreenCopy } from './data'

/* The launch page: what's coming, the time left to it, and a way in for the
 * people who hold an early-access code. At zero the badge turns to “We’re
 * live”, the digits settle and the drone beside it takes off. The code field
 * is a slot: pass `form` to post to your own server instead (the default
 * calls `onRedeem`). */

export interface LaunchProps {
  /** When it opens: a Date, ms since the epoch, or an ISO string. */
  at: Date | number | string
  /** A logo or wordmark above the rest. */
  brand?: ReactNode
  title?: ReactNode
  description?: ReactNode
  /** Checks an early-access code: resolve to let them in, reject (with a message) when it's wrong. */
  onRedeem?: (code: string) => Promise<unknown> | unknown
  /** Replaces the built-in code form, e.g. with one that posts to your server. */
  form?: ReactNode
  /** The picture beside the text; undefined for the drone dock, null for none. */
  media?: ReactNode
  className?: string
  /** The page's strings. Default: the error page's. */
  copy?: ErrorScreenCopy
  /** The locale the opening time reads in. Default: the app's (YoujProvider), else en-US. */
  locale?: string
  /** The headline's level. Default 1. */
  headingLevel?: 1 | 2 | 3
}

export function Launch({
  at,
  brand,
  copy = DEFAULT_COPY,
  title = copy.launchTitle,
  description = copy.launchDescription,
  onRedeem = async (code) => {
    await demo('ErrorScreen: onRedeem', 900)
    if (code.toUpperCase() !== 'EARLY') throw new Error(copy.codeFailed)
  },
  form,
  media,
  className,
  locale: localeProp,
  headingLevel = 1,
}: LaunchProps) {
  const locale = useLocale(localeProp)
  const Title = `h${headingLevel}` as const
  const when = useMemo(
    () =>
      dateTimeFormat(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      }),
    [locale],
  )
  const [live, setLive] = useState(false)
  // The opening time is written in the reader's own zone, so it waits for the browser.
  const now = useNow(0)
  const opens = new Date(at)
  const art = media === undefined ? <DroneDockArt live={live} /> : media
  const rich = art !== null && art !== false
  const align = alignment(rich)

  return (
    <Split art={art}>
      <Stagger inView={false} variant="rise" className={cn('flex w-full max-w-xl flex-col gap-8', align, className)}>
        {brand}
        <div className={cn('flex flex-col gap-4', align)}>
          <Badge variant={live ? 'success' : 'outline'} className="gap-1.5 font-mono tracking-wider uppercase">
            <span aria-hidden className={cn('size-1.5 rounded-full', live ? 'bg-success' : 'bg-accent')} />
            {live ? copy.live : copy.launching}
          </Badge>
          <Title className="text-balance text-3xl font-semibold tracking-tight text-fg sm:text-5xl">{title}</Title>
          <p className="max-w-md text-pretty text-ui-lg text-fg-muted">{description}</p>
        </div>
        <div className={cn('flex flex-col gap-3', align)}>
          <Countdown to={at} onComplete={() => setLive(true)} className={cn('gap-3 text-4xl sm:gap-4', rich ? 'sm:text-5xl' : 'sm:text-6xl')} />
          <p className="min-h-5 text-ui-sm text-fg-muted">
            {now !== null && !Number.isNaN(opens.getTime()) && (live ? copy.opened : copy.opens)(when.format(opens))}
          </p>
        </div>
        {/* A Reveal of its own, so the form can take the column's width rather than its content's. */}
        <Reveal className="w-full">{form ?? <CodeForm onRedeem={onRedeem} copy={copy} className={cn('mx-auto', rich && 'lg:mx-0')} />}</Reveal>
      </Stagger>
    </Split>
  )
}

function CodeForm({
  onRedeem,
  copy,
  className,
}: {
  onRedeem: (code: string) => Promise<unknown> | unknown
  copy: ErrorScreenCopy
  className?: string
}) {
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  const [admitted, setAdmitted] = useState(false)

  return (
    <form
      className={cn(
        'w-full max-w-sm rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface/80 youj-allow-glass p-4 text-start backdrop-blur',
        className,
      )}
      onSubmit={async (event) => {
        event.preventDefault()
        setPending(true)
        setError(undefined)
        try {
          await onRedeem(code.trim())
          setAdmitted(true)
        } catch (reason) {
          setError(reason instanceof Error && reason.message ? reason.message : copy.codeFailed)
        } finally {
          setPending(false)
        }
      }}
    >
      <Field invalid={Boolean(error)}>
        <FieldLabel>{copy.codeLabel}</FieldLabel>
        <div className="flex gap-2">
          <Input
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
            autoComplete="off"
            spellCheck={false}
            placeholder={copy.codePlaceholder}
            className="flex-1 font-mono"
          />
          <Button type="submit" loading={pending} disabled={admitted}>
            {copy.getIn} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
          </Button>
        </div>
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <p role="status" className="text-ui-sm text-success [&:not(:empty)]:mt-2">
        {admitted ? copy.admitted : ''}
      </p>
    </form>
  )
}
