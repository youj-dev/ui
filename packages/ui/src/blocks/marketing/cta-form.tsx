'use client'

import { useEffect, useId, useRef, useState, type ComponentProps } from 'react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { ContentSwap, Reveal, Stagger } from '@youj/motion'
import { ArrowRightIcon, CheckIcon, GitBranchIcon, MailOpenIcon, UsersIcon, type IconProps } from '@youj/icons'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group'
import { cn } from '../../lib/utils'

/* A split call to action that closes with a form. The pitch and three proof
 * points rise in on the inline start; on the end, a card asks for a work
 * email and the team's size (a segmented control whose indicator glides).
 * The submit is a Button onAction: the label morphs to a spinner, then to a
 * check. A bad or personal email is explained under the field; a failed send
 * keeps everything typed and raises an alert. On success the card resolves
 * into what happens next (ContentSwap, from a skeleton shaped like it) and
 * focus moves to its heading. Swap `onSubmit` for your signup API. Reduced
 * motion: everything is in place, labels and panels swap without travel.
 *
 * Pass your own `proof` points, `teamSizes` and `defaultValues`; every
 * string, the next steps included, is in `copy`. */

const SIZES = ['1–10', '11–50', '51–200', '200+']
const PERSONAL = /@(gmail|googlemail|yahoo|hotmail|outlook|icloud|proton|protonmail|aol)\./i

interface CtaFormData {
  email: string
  /** One of `teamSizes`. */
  teamSize: string
}

/** A line of the pitch, with its icon. */
interface CtaFormProofPoint {
  icon: React.ComponentType<IconProps>
  text: string
}

const PROOF: CtaFormProofPoint[] = [
  { icon: CheckIcon, text: '14 days of Pro for every seat, no card required' },
  { icon: GitBranchIcon, text: 'Move over from your current host in an afternoon' },
  { icon: UsersIcon, text: 'A solutions engineer on call for the whole trial' },
]

const DEFAULT_COPY = {
  eyebrow: 'Team trial',
  title: 'Put your whole team on Pro for 14 days',
  description: 'Tell us where to send the invite. We’ll import your repositories and hand you a preview URL before your next standup.',
  cardTitle: 'Start a team trial',
  cardDescription: 'Takes about a minute. We’ll email you a link.',
  emailLabel: 'Work email',
  emailPlaceholder: 'you@company.com',
  teamSizeLabel: 'Team size',
  emailMissing: 'Enter your work email.',
  emailInvalid: 'That doesn’t look like an email. Try you@company.com.',
  emailPersonal: 'Use your work email, so we can find your team.',
  failedTitle: 'We couldn’t start your trial',
  failedDescription: 'Your details are still here. Try again in a moment, or write to sales@northwind.dev.',
  submit: 'Start the team trial',
  pending: 'Setting up your trial…',
  success: 'Trial started',
  /** The button's label after a send fails. */
  failed: 'Couldn’t send',
  /** The button's label after the email is rejected. */
  invalid: 'Check your email',
  finePrint: 'No card. Cancel from settings at any time.',
  loading: 'Starting your trial',
  doneTitle: 'You’re in',
  doneDescription: 'We’ve emailed you a link.',
  doneHeading: (email: string) => `Check ${email}`,
  doneIntro: 'Your team’s trial is ready. Here’s what happens next:',
  doneSteps: (teamSize: string) => [
    'Confirm your email. The link lasts 24 hours.',
    'Connect GitHub, GitLab or Bitbucket and pick a repository.',
    `Invite your team: ${teamSize} seats are on us for 14 days.`,
  ],
  changeEmail: 'Use a different email',
}

type CtaFormCopy = typeof DEFAULT_COPY

interface CtaFormProps extends Omit<ComponentProps<'section'>, 'children' | 'onSubmit'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, padding or max width). Default false. */
  embedded?: boolean
  /** Sends the signup. Resolve to show the next steps; reject to keep the form and raise an alert with the error's message. Default: a short simulated request. */
  onSubmit?: (data: CtaFormData) => Promise<unknown> | unknown
  /** The values the form starts with. Default: no email, team size `11–50`. */
  defaultValues?: Partial<CtaFormData>
  /** The pitch's proof points. Default: the demo's three. */
  proof?: CtaFormProofPoint[]
  /** The team size choices; empty hides the control. Default: `1–10`, `11–50`, `51–200`, `200+`. */
  teamSizes?: string[]
  /** Turn away personal addresses (Gmail, Outlook…). Default true. */
  requireWorkEmail?: boolean
  /** The headline's level. Default 2. */
  headingLevel?: 1 | 2 | 3
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<CtaFormCopy>
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

function validate(email: string, copy: CtaFormCopy, requireWorkEmail: boolean): string | undefined {
  const value = email.trim()
  if (!value) return copy.emailMissing
  if (!/^\S+@\S+\.\S+$/.test(value)) return copy.emailInvalid
  if (requireWorkEmail && PERSONAL.test(value)) return copy.emailPersonal
  return undefined
}

function NextSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="size-10 rounded-lg" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-4 w-5/6" />
      ))}
    </div>
  )
}

function CtaForm({
  theme,
  embedded = false,
  onSubmit = () => demo('CtaForm: onSubmit', 900),
  defaultValues,
  proof = PROOF,
  teamSizes = SIZES,
  requireWorkEmail = true,
  headingLevel = 2,
  copy: copyProp,
  className,
  ...rest
}: CtaFormProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const Heading = `h${headingLevel}` as const
  const k = useYouj()
  const titleId = useId()
  const [email, setEmail] = useState(defaultValues?.email ?? '')
  const [teamSize, setTeamSize] = useState(defaultValues?.teamSize ?? '11–50')
  const [error, setError] = useState<string>()
  // The send failed: true, or the rejection's message to show.
  const [failed, setFailed] = useState<string | boolean>(false)
  const [sent, setSent] = useState(false)
  const [settling, setSettling] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const doneHeading = useRef<HTMLHeadingElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, k.reduced ? 0 : ms))

  useEffect(() => {
    if (sent && !settling) doneHeading.current?.focus()
  }, [sent, settling])

  const submit = async () => {
    setFailed(false)
    const problem = validate(email, copy, requireWorkEmail)
    if (problem) {
      setError(problem)
      throw new Error(problem)
    }
    try {
      await onSubmit({ email: email.trim(), teamSize })
    } catch (cause) {
      setFailed(cause instanceof Error && cause.message ? cause.message : true)
      throw cause
    }
  }

  const form = (
    <form noValidate onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
      <Field invalid={!!error}>
        <FieldLabel>{copy.emailLabel}</FieldLabel>
        <Input
          ref={emailRef}
          type="email"
          value={email}
          autoComplete="email"
          placeholder={copy.emailPlaceholder}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(undefined)
          }}
          className="h-control-lg"
        />
        <FieldError>{error}</FieldError>
      </Field>
      {teamSizes.length > 0 && (
        <FieldSet className="gap-2">
          {/* Worn like the field label above it, whatever the preset does to labels. */}
          <FieldLegend variant="label" className="font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]">
            {copy.teamSizeLabel}
          </FieldLegend>
          <ToggleGroup
            variant="segmented"
            value={[teamSize]}
            onValueChange={(value) => value[0] && setTeamSize(value[0])}
            className="w-full [&>*]:flex-1"
          >
            {teamSizes.map((size) => (
              <ToggleGroupItem key={size} value={size} className="tabular-nums">
                {size}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldSet>
      )}
      {failed && (
        <Alert variant="danger">
          <AlertTitle>{copy.failedTitle}</AlertTitle>
          <AlertDescription>{typeof failed === 'string' ? failed : copy.failedDescription}</AlertDescription>
        </Alert>
      )}
      <AsyncButton
        type="submit"
        size="lg"
        className="w-full"
        onAction={submit}
        pendingLabel={copy.pending}
        successLabel={copy.success}
        errorLabel={failed ? copy.failed : copy.invalid}
        onActionStateChange={(state) => {
          if (state !== 'success') return
          later(() => {
            setSent(true)
            setSettling(true)
            later(() => setSettling(false), k.ms('deliberate'))
          }, k.ms('slow'))
        }}
      >
        {copy.submit} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
      </AsyncButton>
      <p className="text-center text-ui-sm text-fg-muted">{copy.finePrint}</p>
    </form>
  )

  const done = (
    <ContentSwap loading={settling} fallback={<NextSkeleton />} loadingLabel={copy.loading}>
      <div className="flex flex-col gap-4">
        <span className="grid size-10 place-items-center rounded-lg bg-accent-subtle text-accent">
          <MailOpenIcon size={20} trigger="mount" aria-hidden />
        </span>
        <h3 ref={doneHeading} tabIndex={-1} className="rounded-sm text-xl font-semibold tracking-tight text-fg outline-none focus-ring">
          {copy.doneHeading(email.trim())}
        </h3>
        <p className="text-ui text-fg-muted">{copy.doneIntro}</p>
        <ol className="flex flex-col gap-3">
          {copy.doneSteps(teamSize).map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-ui text-fg">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-band text-ui-sm font-medium text-fg-muted tabular-nums">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
        <Button
          variant="ghost"
          className="-ms-3 self-start"
          onClick={() => {
            setSent(false)
            timers.current.push(setTimeout(() => emailRef.current?.focus()))
          }}
        >
          {copy.changeEmail}
        </Button>
      </div>
    </ContentSwap>
  )

  const view = (
    <section
      aria-labelledby={titleId}
      {...rest}
      className={cn('relative isolate overflow-hidden', !embedded && 'bg-canvas px-4 py-20 text-fg sm:px-6 md:py-28', className)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 end-0 -z-10 w-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent)_12%,transparent),transparent)] lg:w-3/5"
      />
      <div className={cn('grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16', !embedded && 'mx-auto max-w-6xl')}>
        <Stagger variant="rise" className="flex flex-col items-start gap-6">
          <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
          <Heading id={titleId} className="text-balance text-3xl font-semibold tracking-tight text-fg md:text-4xl">
            {copy.title}
          </Heading>
          <p className="max-w-lg text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          <ul className="flex flex-col gap-3">
            {proof.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-ui text-fg">
                <span className="grid size-7 shrink-0 place-items-center rounded-md border border-line bg-surface text-accent">
                  <Icon size={15} strokeWidth={2} aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </Stagger>
        <Reveal variant="rise" delay={3} className="min-w-0">
          <Card className="shadow-xl shadow-fg/5">
            <CardHeader>
              <CardTitle>{sent ? copy.doneTitle : copy.cardTitle}</CardTitle>
              <CardDescription>{sent ? copy.doneDescription : copy.cardDescription}</CardDescription>
            </CardHeader>
            <CardContent>{sent ? done : form}</CardContent>
          </Card>
        </Reveal>
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { CtaForm }
export type { CtaFormData, CtaFormProps, CtaFormCopy, CtaFormProofPoint }
