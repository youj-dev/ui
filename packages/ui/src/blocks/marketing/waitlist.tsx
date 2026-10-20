'use client'

import { useEffect, useState, type ComponentProps, type ElementType } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { Counter, TextSplit } from '@youj/motion'
import { ApertureIcon, ArrowRightIcon, SparklesIcon } from '@youj/icons'
import { AvatarStack } from '../../components/ui/avatar-stack'
import { Badge } from '../../components/ui/badge'
import { AsyncButton } from '../../components/ui/async-button'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { cn } from '../../lib/utils'
import { Countdown } from './waitlist/countdown'
import {
  CTA,
  DEFAULT_COPY,
  demoPlace,
  PEOPLE,
  demo,
  type WaitlistBrand,
  type WaitlistCopy,
  type WaitlistCta,
  type WaitlistPerson,
  type WaitlistPlace,
} from './waitlist/data'
import { Place } from './waitlist/place'

/* Aperture's launch page. The headline's
 * words lift out of their line masks (TextSplit). The countdown's digits
 * roll like an odometer each second. Joining runs through Button onAction;
 * the form gives way to a moment of "saving your spot" and then your place
 * in line resolves out of it (ContentSwap), the number rolling down each
 * time a share moves you up. The referral link copies with a morphing label,
 * and the count of people waiting ticks up live under the avatars. Reduced
 * motion: the aurora holds one frame, the words are set and numbers change
 * in place.
 *
 * Wire `onJoin` to your list's API (resolve with the visitor's place), and
 * pass your `brand`, `launchAt`, `people` and `waitingCount`; every string is
 * in `copy`. */

type LinkComponent = ElementType

interface WaitlistProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** The product's name and logo in the header. Default: Aperture. */
  brand?: WaitlistBrand
  /** The header's link; `null` hides it. Default: "Read the manifesto". */
  cta?: WaitlistCta | null
  /** The launch moment the countdown runs to. Default: 23 days and some hours after the page opens. */
  launchAt?: Date | number
  /** Adds the email to the list. Resolve with the visitor's place (or nothing, for the demo's); reject to explain under the field. Default: a short demo wait. */
  onJoin?: (email: string) => Promise<WaitlistPlace | void> | WaitlistPlace | void
  /** Called when the visitor shares their referral link. Default: the demo moves them up 100 places. */
  onShare?: (method: 'share' | 'email', link: string) => void
  /** The values the form starts with. Default: empty. */
  defaultValues?: { email?: string }
  /** Faces in the avatar stack. Default: the demo's six. */
  people?: WaitlistPerson[]
  /** How many people are waiting. Default 4,812. */
  waitingCount?: number
  /** Ticks the waiting count up now and then, as people join. Default true. */
  live?: boolean
  /** BCP 47 locale for the numbers. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** The headline's level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<WaitlistCopy>
  /** Renders the header link, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
}

function WaitlistContent({
  brand = { name: 'Aperture', logo: <ApertureIcon size={22} className="text-accent" /> },
  cta = CTA,
  launchAt,
  onJoin = () => demo('Waitlist: onJoin', 900).then(() => undefined),
  onShare,
  defaultValues,
  people = PEOPLE,
  waitingCount = 4_812,
  live = true,
  locale: localeProp,
  headingLevel = 1,
  copy: copyProp,
  linkComponent: Link = 'a',
  className,
  ...rest
}: Omit<WaitlistProps, 'theme'>) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const k = useYouj()
  const [email, setEmail] = useState(defaultValues?.email ?? '')
  const [error, setError] = useState<string>()
  const [place, setPlace] = useState<WaitlistPlace>()
  const [placing, setPlacing] = useState(false)
  const [waiting, setWaiting] = useState(waitingCount)
  const [prevCount, setPrevCount] = useState(waitingCount)
  if (prevCount !== waitingCount) {
    setPrevCount(waitingCount)
    setWaiting(waitingCount)
  }

  // People keep joining while the page is open.
  useEffect(() => {
    if (!live) return
    let t: ReturnType<typeof setTimeout>
    const next = () => {
      t = setTimeout(() => {
        setWaiting((n) => n + 1 + Math.floor(Math.random() * 3))
        next()
      }, 2400 + Math.random() * 2400)
    }
    next()
    return () => clearTimeout(t)
  }, [live])

  useEffect(() => {
    if (!placing) return
    const t = setTimeout(() => setPlacing(false), 900)
    return () => clearTimeout(t)
  }, [placing])

  const join = async () => {
    const value = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setError(copy.emailInvalid)
      throw new Error('invalid')
    }
    let result: WaitlistPlace | void
    try {
      result = await onJoin(value)
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : copy.joinFailed)
      throw cause
    }
    const next = result ?? demoPlace(value)
    setTimeout(
      () => {
        setPlace(next)
        setPlacing(true)
      },
      k.reduced ? 0 : k.ms('slow'),
    )
  }

  return (
    <div {...rest} className={cn('relative isolate flex min-h-dvh flex-col overflow-hidden bg-canvas text-fg', className)}>
      <header className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-5 md:px-8">
        {brand.logo}
        <span className="font-semibold tracking-tight">{brand.name}</span>
        {cta && (
          <Link
            href={cta.href}
            onClick={cta.onClick}
            className="focus-ring ms-auto rounded-md px-3 py-1.5 text-ui-sm text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg"
          >
            {cta.label}
          </Link>
        )}
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-4 pt-6 pb-16 text-center">
        {copy.badge && (
          <Badge variant="default" className="gap-1.5 bg-canvas/60 youj-allow-glass backdrop-blur-md">
            <SparklesIcon size={12} /> {copy.badge}
          </Badge>
        )}
        <div className="flex flex-col items-center gap-4">
          <TextSplit as={`h${headingLevel}`} by="words" mask inView={false} className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            {copy.title}
          </TextSplit>
          <p className="max-w-lg text-ui-lg text-pretty text-fg-muted">{copy.description}</p>
        </div>

        <Countdown launchAt={launchAt} copy={copy} locale={locale} />

        <div className="w-full max-w-md">
          {!place ? (
            <form
              noValidate
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col gap-2 rounded-2xl border border-line-subtle bg-canvas/70 youj-allow-glass p-2 text-start shadow-sm backdrop-blur-md"
            >
              <Field invalid={!!error} className="gap-1">
                <FieldLabel className="sr-only">{copy.emailLabel}</FieldLabel>
                <div className="flex items-center gap-2 max-sm:flex-col max-sm:items-stretch">
                  {/* shape: the glass form is the field's frame; the address sits bare inside it beside the button */}
                  <Input
                    type="email"
                    value={email}
                    autoComplete="email"
                    placeholder={copy.emailPlaceholder}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError(undefined)
                    }}
                    className="h-control-lg flex-1 border-transparent bg-transparent shadow-none"
                  />
                  <AsyncButton type="submit" pendingLabel={copy.joining} successLabel={copy.joined} errorLabel={copy.joinError} onAction={join}>
                    {copy.join} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
                  </AsyncButton>
                </div>
                <FieldError className="px-3 pb-1">{error}</FieldError>
              </Field>
            </form>
          ) : (
            <Place place={place} placing={placing} copy={copy} locale={locale} onShare={onShare} />
          )}
        </div>

        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
          {people.length > 0 && <AvatarStack users={people} max={4} label={copy.waitingLabel} />}
          <p className="text-ui-sm text-fg-muted">
            <span className="font-medium text-fg tabular-nums">
              <Counter value={waiting} from={waiting} inView={false} duration="slow" locale={locale} format={{ useGrouping: true, maximumFractionDigits: 0 }} />
            </span>{' '}
            {copy.waiting}
          </p>
        </div>
      </main>
    </div>
  )
}

function Waitlist({ theme, ...props }: WaitlistProps) {
  return (
    <ThemeScope theme={theme}>
      <WaitlistContent {...props} />
    </ThemeScope>
  )
}

export { Waitlist }
export type { WaitlistProps, WaitlistCopy, WaitlistBrand, WaitlistCta, WaitlistPerson, WaitlistPlace }
