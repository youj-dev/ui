'use client'

import { isValidElement, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { cn } from '../../lib/utils'
import {
  DEFAULT_COPY,
  SERVICES,
  STEPS,
  demo,
  type ErrorScreenBrand,
  type ErrorScreenCopy,
  type ErrorScreenService,
  type ErrorScreenServiceState,
  type ErrorScreenStep,
  type LinkComponent,
} from './error/data'
import { Launch } from './error/launch'
import { Maintenance } from './error/maintenance'
import { ServerError } from './error/server-error'

/* The app's pages for when the app itself can't answer, each beside a
 * miniature that plays its state (`media={null}` for the plain page, the
 * code set large, or your own node). `500`: a
 * mainframe stopped in machine check; Try again (Button onAction) resets it
 * and feeds its cards, and it runs again when the retry works. Then a plain
 * apology, the status page, the live state of each service and the incident
 * ID with a one-press copy and a way to support. `maintenance`: a planned
 * window, its time left rolling down (Counter), how far along it is and each
 * step's state, an "email me when it's back" field, and a repair bench whose
 * checklist lights up as the window passes and whose beacon turns green at
 * the end. `launch`: the page before a launch, its time left in rolling
 * digits (Countdown) with an early-access code field, and a drone charging on
 * its pad that takes off at zero, when the badge turns to “We’re live”.
 * Pass your own `services`, `steps`, `window` or `launchAt`, wire `onRetry`,
 * `onSubscribe` and `onRedeem`; every string is in `copy`. Reduced motion:
 * the digits are set, the miniature shows each state at once and the
 * countdown simply changes. It is built for
 * the compact layout density (ui.css), taken from the page. */

interface ErrorScreenProps extends Omit<ComponentProps<'main'>, 'title' | 'children'> {
  /** `500` for an unexpected server error; `maintenance` for a planned window; `launch` for the page before you open. Default `500`. */
  variant?: '500' | 'maintenance' | 'launch'
  /** The picture beside the text: your own node, or `null` for the plain page. Default: the page's miniature (a mainframe, a repair bench, a drone dock), playing its state. */
  media?: ReactNode
  /** 500: the ID support can trace. Default a sample ID. */
  incidentId?: string
  /** 500: try the request again; resolve when it worked, reject when it didn't (its message shows under the buttons). Default: a short demo wait. */
  onRetry?: () => Promise<unknown> | unknown
  /** 500: the services on the status card, with their state. Default: four demo services. */
  services?: ErrorScreenService[]
  /** 500: where Contact support goes, beside the incident ID. Default `#support`. */
  supportHref?: string
  /** Maintenance: the window, in ms since the epoch. Default: began 38 minutes before `now`, ends 52 minutes after. */
  window?: { start: number; end: number }
  /** Maintenance: the window's steps and where each stands. Default: the demo's database upgrade. */
  steps?: ErrorScreenStep[]
  /** Maintenance: email them when it's back; resolve once they're on the list, reject with an Error whose message says why not. Default: a short demo wait. */
  onSubscribe?: (email: string) => Promise<unknown> | unknown
  /** Launch: when it opens, as a Date, ms since the epoch or an ISO string. Default: 6 days and 4 hours after `now`. */
  launchAt?: Date | number | string
  /** The time the demo window and launch are set from. Only the browser renders anything timed, so this never mismatches on hydration. Default: the time of the first render. */
  now?: Date | number
  /** Launch: the product above the headline, as `{ name, logo }` or your own node. */
  brand?: ErrorScreenBrand | ReactNode
  /** Launch: the headline and the line under it. Default: `copy.launchTitle` and `copy.launchDescription`. */
  title?: ReactNode
  description?: ReactNode
  /** Launch: check an early-access code; resolve to let them in, reject with a message when it's wrong. Default: a demo that accepts `EARLY`. */
  onRedeem?: (code: string) => Promise<unknown> | unknown
  /** Launch: your own code form in place of the built-in one, e.g. a plain form that posts to your server. */
  codeForm?: ReactNode
  /** Where the status page lives. Default `#status`. */
  statusHref?: string
  /** What the status and support links render as, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<ErrorScreenCopy>
  /** The locale times read in. Default: the app's (YoujProvider), else en-US. */
  locale?: string
  /** The headline's level; the status card's heading sits one under it. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Default: the host's theme. */
  theme?: ThemeInput
}

const isBrand = (brand: unknown): brand is ErrorScreenBrand =>
  typeof brand === 'object' && brand !== null && !isValidElement(brand) && 'name' in brand

function ErrorScreen({
  variant = '500',
  media,
  incidentId = 'inc_7Hq2Kx9mWp',
  onRetry = () => demo('ErrorScreen: onRetry', 1200),
  services = SERVICES,
  supportHref = '#support',
  window: range,
  steps = STEPS,
  onSubscribe = () => demo('ErrorScreen: onSubscribe', 900),
  launchAt,
  now,
  brand,
  title,
  description,
  onRedeem,
  codeForm,
  statusHref = '#status',
  linkComponent = 'a',
  copy: copyProp,
  locale: localeProp,
  headingLevel = 1,
  theme,
  className,
  ...rest
}: ErrorScreenProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const [anchor] = useState(() => (now === undefined ? Date.now() : +now))
  const windowRange = range ?? { start: anchor - 38 * 60_000, end: anchor + 52 * 60_000 }
  const launch = launchAt ?? anchor + (6 * 24 + 4) * 3_600_000
  const brandNode = isBrand(brand) ? (
    <span className="flex items-center gap-2 text-ui-lg font-semibold tracking-tight text-fg">
      {brand.logo}
      {brand.name}
    </span>
  ) : (
    brand
  )
  const page = (
    <main
      {...rest}
      className={cn(
        'relative isolate flex min-h-dvh flex-col items-center justify-center gap-14 overflow-hidden bg-canvas px-4 py-16 text-fg sm:px-6 lg:py-20',
        className,
      )}
    >
      {variant === 'maintenance' ? (
        <Maintenance
          start={windowRange.start}
          end={windowRange.end}
          statusHref={statusHref}
          steps={steps}
          onSubscribe={onSubscribe}
          media={media}
          copy={copy}
          link={linkComponent}
          locale={locale}
          headingLevel={headingLevel}
        />
      ) : variant === 'launch' ? (
        <>
          <Launch
            at={launch}
            brand={brandNode}
            title={title}
            description={description}
            onRedeem={onRedeem}
            form={codeForm}
            media={media}
            copy={copy}
            locale={locale}
            headingLevel={headingLevel}
          />
        </>
      ) : (
        <ServerError
          incidentId={incidentId}
          onRetry={onRetry}
          statusHref={statusHref}
          supportHref={supportHref}
          services={services}
          media={media}
          copy={copy}
          link={linkComponent}
          headingLevel={headingLevel}
        />
      )}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

export { ErrorScreen }
export type { ErrorScreenProps, ErrorScreenCopy, ErrorScreenService, ErrorScreenServiceState, ErrorScreenStep, ErrorScreenBrand }
