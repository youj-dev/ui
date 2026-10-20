'use client'

import { useState } from 'react'
import { Counter, Reveal, Stagger } from '@youj/motion'
import { MeshGradient } from '@youj/motion/backgrounds'
import { AsyncButton } from '../../../components/ui/async-button'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { useNow } from '../../../hooks/use-now'
import { DEMO_LEAD, EMAIL, type HeadingTag, type NotFoundCopy } from './data'

const UNITS = [
  { key: 'days', ms: 86_400_000, mod: Infinity },
  { key: 'hours', ms: 3_600_000, mod: 24 },
  { key: 'minutes', ms: 60_000, mod: 60 },
  { key: 'seconds', ms: 1000, mod: 60 },
] as const

/** Counts from zero once the browser knows the time: the server's clock would disagree with it on hydration. */
function useRemaining(launch: number | undefined) {
  const now = useNow(1000)
  const [opened, setOpened] = useState<number | null>(null)
  if (now !== null && opened === null) setOpened(now)
  const target = launch ?? (opened === null ? null : opened + DEMO_LEAD)
  return now === null || target === null ? 0 : Math.max(0, target - now)
}

interface ComingSoonProps {
  copy: NotFoundCopy
  launch: number | undefined
  onNotify: (email: string) => Promise<unknown> | unknown
  Title: HeadingTag
}

/** The coming-soon page: a launch countdown whose digits roll each second over a mesh gradient, and a notify-me sign-up. */
export function ComingSoon({ copy, launch, onNotify, Title }: ComingSoonProps) {
  const remaining = useRemaining(launch)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const notify = async () => {
    setError(null)
    if (!EMAIL.test(email.trim())) {
      setError(copy.invalidEmail)
      throw new Error('invalid')
    }
    try {
      await onNotify(email.trim())
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : copy.notifyFailed)
      throw failure
    }
  }
  return (
    <>
      <div aria-hidden className="absolute inset-0 -z-10 opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent)]">
        <MeshGradient className="absolute inset-0" />
      </div>
      <Stagger inView={false} variant="rise" className="flex flex-col items-center gap-6 text-center">
        <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
        <Title className="max-w-2xl text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl">{copy.comingTitle}</Title>
        <p className="max-w-md text-pretty text-ui-lg text-fg-muted">{copy.comingDescription}</p>
        <dl aria-label={copy.countdownLabel} className="grid grid-cols-4 gap-2 sm:gap-3">
          {UNITS.map((unit) => (
            <div
              key={unit.key}
              className="flex min-w-16 flex-col-reverse items-center gap-1 rounded-xl border border-line bg-surface/80 youj-allow-glass px-3 py-4 backdrop-blur sm:min-w-24"
            >
              <dt className="text-ui-sm text-fg-muted">{copy[unit.key]}</dt>
              <dd className="text-3xl font-semibold tracking-tight text-fg tabular-nums sm:text-4xl">
                <Counter
                  value={Math.floor(remaining / unit.ms) % unit.mod}
                  mode="roll"
                  inView={false}
                  duration="base"
                  format={{ minimumIntegerDigits: 2 }}
                />
              </dd>
            </div>
          ))}
        </dl>
        {/* A Reveal of its own, so the form can take the column's width rather than its content's. */}
        <Reveal className="w-full">
          <form noValidate aria-label={copy.notifyLabel} onSubmit={(event) => event.preventDefault()} className="mx-auto w-full max-w-sm">
            <Field invalid={error !== null}>
              <FieldLabel className="sr-only">{copy.emailLabel}</FieldLabel>
              <div className="flex gap-2">
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder={copy.placeholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-w-0 flex-1"
                />
                <AsyncButton type="submit" onAction={notify} pendingLabel={copy.notifying} successLabel={copy.notified} errorLabel={copy.retry}>
                  {copy.notify}
                </AsyncButton>
              </div>
              {error ? <FieldError>{error}</FieldError> : <FieldDescription>{copy.notifyHint}</FieldDescription>}
            </Field>
          </form>
        </Reveal>
      </Stagger>
    </>
  )
}
