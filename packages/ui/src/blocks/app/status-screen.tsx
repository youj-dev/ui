'use client'

import { useEffect, useState, type ComponentProps, type ElementType, type MouseEventHandler, type ReactNode } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { Stagger } from '@youj/motion'
import { ExternalLinkIcon, HomeIcon, KeyIcon, LogInIcon, RefreshIcon } from '@youj/icons'
import { AsyncButton } from '../../components/ui/async-button'
import { Button, buttonVariants } from '../../components/ui/button'
import { Progress, ProgressLabel, ProgressValue } from '../../components/ui/progress'
import { cn } from '../../lib/utils'
import { StatusArt } from './status-screen/art'
import { DEFAULT_COPY, demo, RETRY_DELAYS, type StatusScreenCopy, type StatusScreenStatus } from './status-screen/data'
import { useAutoRetry } from './status-screen/use-auto-retry'

/* One page for the states where the app can't show what was asked for, and
 * a status code tells why: `401` sign in first, `403` signed in but not
 * allowed, `503` temporarily unavailable, and `loading` for the page that is
 * still on its way. Each has a miniature that plays its state, beside the
 * text (above it on small screens): a parcel locker waiting for its code, a
 * firewall in lockdown, a server cabinet with two nodes down that recover
 * when a retry gets through, an hourglass whose sand is the progress. Pass
 * `media={null}` for the plain page, the code set large over the text, or
 * your own node. `401` carries the sign-in and where the visitor returns to;
 * `403` names the missing permission, the account that's signed in, and asks
 * for access (Button onAction); `503` retries on its own, waiting longer each
 * time (`retryDelays`), with Try now and the status page; `loading` is a
 * polite live region over a progress bar, indeterminate until you pass
 * `progress`, that offers a reload once it's slow (`slowAfter`). The 404 is
 * the not-found block's, the 500, maintenance and launch pages the error
 * block's. Every string is in `copy`. Reduced motion: the miniature shows
 * each state at once and nothing rises into place. */

type HeadingTag = 'h1' | 'h2' | 'h3'

interface StatusScreenProps extends Omit<ComponentProps<'main'>, 'title' | 'children'> {
  /** Which page: `401` sign in, `403` no access, `503` temporarily unavailable, `loading` still on its way. Default `401`. */
  status?: StatusScreenStatus
  /** The picture beside the text: your own node, or `null` for the plain page. Default: the status's miniature, playing the page's state. */
  media?: ReactNode
  /** Replaces the page's buttons with your own. Default: the status's own actions. */
  actions?: ReactNode
  /** 401: where the sign-in page lives; 403: where Switch account goes. Default `#sign-in`. */
  signInHref?: string
  /** 401: runs when Sign in is pressed, before the link is followed. */
  onSignIn?: MouseEventHandler<HTMLAnchorElement>
  /** 401: the page they return to, shown under the buttons. Empty hides it. Default `/settings/billing`. */
  returnTo?: string
  /** 403: the permission they lack, shown on the page. Empty hides it. Default `billing:read`. */
  permission?: string
  /** 403: the account that's signed in, with Switch account beside it. Empty hides it. Default `ana@northwind.io`. */
  account?: string
  /** 403: ask for access; resolve when sent, reject with an Error whose message says why not. Default: a short demo wait. */
  onRequestAccess?: () => Promise<unknown> | unknown
  /** 503: try the request again; resolve when it worked, reject when it didn't. Default: a short demo wait that fails. */
  onRetry?: () => Promise<unknown> | unknown
  /** 503: seconds before each automatic retry, the last one repeating; `[]` retries only when asked. Default `[5, 15, 30, 60]`. */
  retryDelays?: number[]
  /** 503: where the status page lives. Default `#status`. */
  statusHref?: string
  /** Where Back to home goes. Default `#home`. */
  homeHref?: string
  /** Loading: how far along, 0 to 100. Default: unknown, so the bar sweeps. */
  progress?: number
  /** Loading: after this many ms, say it's slow and offer Reload; 0 never does. Default 10000. */
  slowAfter?: number
  /** Loading: what Reload does once it's slow. Default: a short demo wait. */
  onReload?: () => Promise<unknown> | unknown
  /** The headline's level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** The element every link renders as, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<StatusScreenCopy>
  /** Default: the host's theme. */
  theme?: ThemeInput
}

function StatusScreen({
  status = '401',
  media,
  actions,
  signInHref = '#sign-in',
  onSignIn,
  returnTo = '/settings/billing',
  permission = 'billing:read',
  account = 'ana@northwind.io',
  onRequestAccess = () => demo('StatusScreen: onRequestAccess', 1000),
  onRetry = () => demo('StatusScreen: onRetry', 1200).then(() => Promise.reject(new Error(''))),
  retryDelays = RETRY_DELAYS,
  statusHref = '#status',
  homeHref = '#home',
  progress,
  slowAfter = 10_000,
  onReload = () => demo('StatusScreen: onReload', 600),
  headingLevel = 1,
  linkComponent: Link = 'a',
  copy: copyProp,
  theme,
  className,
  ...rest
}: StatusScreenProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const Title = `h${headingLevel}` as HeadingTag
  const loading = status === 'loading'
  const unavailable = status === '503'
  const retry = useAutoRetry(onRetry, unavailable ? retryDelays : [])
  const [requested, setRequested] = useState(false)
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!loading || !slowAfter) return
    const timer = setTimeout(() => setSlow(true), slowAfter)
    return () => clearTimeout(timer)
  }, [loading, slowAfter])

  const art = media === undefined ? <StatusArt status={status} down={retry.state !== 'success'} progress={progress} /> : media
  const rich = art !== null && art !== false
  // Beside a picture the text starts at the inline start from lg up; alone it's centred.
  const align = rich ? 'items-center text-center lg:items-start lg:text-start' : 'items-center text-center'
  const row = cn('flex flex-wrap justify-center gap-3', rich && 'lg:justify-start')
  const title = { '401': copy.unauthorizedTitle, '403': copy.forbiddenTitle, '503': copy.unavailableTitle, loading: copy.loadingTitle }[status]
  const description = {
    '401': copy.unauthorizedDescription,
    '403': copy.forbiddenDescription,
    '503': copy.unavailableDescription,
    loading: copy.loadingDescription,
  }[status]
  const home = (
    <Link href={homeHref} data-yj-trigger="" className={buttonVariants({ size: 'lg', variant: unavailable ? 'ghost' : 'outline' })}>
      <HomeIcon size={16} /> {copy.home}
    </Link>
  )
  const hint = 'text-ui-sm text-fg-subtle'

  const text = (
    <Stagger inView={false} delay={rich ? 2 : 0} variant="rise" className={cn('flex w-full max-w-lg flex-col gap-6', align)}>
      {!loading &&
        (rich ? (
          <p className="font-mono text-ui-sm tracking-widest text-fg-subtle uppercase">{copy.errorCode(status)}</p>
        ) : (
          <p className="font-mono text-4xl font-semibold tracking-tighter text-accent sm:text-5xl">{status}</p>
        ))}
      <div role={loading ? 'status' : undefined} className={cn('flex flex-col gap-3', align)}>
        <Title className={cn('text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl', rich && 'xl:text-5xl')}>{title}</Title>
        <p className="max-w-md text-pretty text-ui-lg text-fg-muted">{description}</p>
      </div>
      {status === '403' && permission && (
        <p className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-ui-sm text-fg-muted">
          <KeyIcon size={14} className="text-accent" />
          {copy.permissionLabel}
          <code className="font-mono text-fg">{permission}</code>
        </p>
      )}
      {loading ? (
        <>
          <Progress value={progress ?? null} aria-label={copy.loadingLabel} className="w-64 max-w-full">
            {progress !== undefined && (
              <>
                <ProgressLabel className="sr-only">{copy.loadingLabel}</ProgressLabel>
                <ProgressValue className="ms-auto text-ui-sm text-fg-muted" />
              </>
            )}
          </Progress>
          {slow && (progress ?? 0) < 100 && (
            <div
              role="status"
              className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', rich ? 'justify-center lg:justify-start' : 'justify-center')}
            >
              <span className="text-ui-sm text-fg-muted">{copy.loadingSlow}</span>
              <Button size="sm" variant="outline" onClick={() => onReload()}>
                <RefreshIcon size={14} /> {copy.reload}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className={row}>
          {actions ??
            (status === '401' ? (
              <>
                <Link href={signInHref} onClick={onSignIn} data-yj-trigger="" className={buttonVariants({ size: 'lg' })}>
                  <LogInIcon size={16} className="rtl:-scale-x-100" /> {copy.signIn}
                </Link>
                {home}
              </>
            ) : status === '403' ? (
              <>
                <AsyncButton
                  size="lg"
                  data-yj-trigger=""
                  onAction={async () => {
                    await onRequestAccess()
                    setRequested(true)
                  }}
                  pendingLabel={copy.requesting}
                  successLabel={copy.requested}
                  errorLabel={copy.requestFailed}
                >
                  <KeyIcon size={16} /> {copy.requestAccess}
                </AsyncButton>
                {home}
              </>
            ) : (
              <>
                <AsyncButton
                  size="lg"
                  data-yj-trigger=""
                  status={retry.state}
                  onClick={() => void retry.retry()}
                  pendingLabel={copy.retrying}
                  successLabel={copy.backOnline}
                  errorLabel={copy.stillDown}
                >
                  <RefreshIcon size={16} /> {copy.retry}
                </AsyncButton>
                <Link href={statusHref} data-yj-trigger="" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
                  {copy.statusPage} <ExternalLinkIcon size={16} />
                </Link>
              </>
            ))}
        </div>
      )}
      {!actions && status === '401' && returnTo && <p className={hint}>{copy.returnHint(returnTo)}</p>}
      {!actions && status === '403' && (
        <div className={cn('flex flex-col gap-2', align)}>
          <p role="status" className="text-ui-sm text-fg-muted empty:hidden">
            {requested ? copy.requestedHint : ''}
          </p>
          {account && (
            <p className={hint}>
              {copy.signedInAs(account)} ·{' '}
              <Link
                href={signInHref}
                className="rounded-sm text-fg-muted underline decoration-line underline-offset-4 transition-colors yj-duration-fast ease-standard focus-ring hover:text-fg"
              >
                {copy.switchAccount}
              </Link>
            </p>
          )}
        </div>
      )}
      {!actions && unavailable && (
        <p className={cn(hint, 'tabular-nums')}>
          {retry.seconds !== null && <span>{copy.retryIn(retry.seconds)} · </span>}
          {copy.retryHint}
        </p>
      )}
    </Stagger>
  )

  const page = (
    <main
      {...rest}
      aria-busy={loading || undefined}
      className={cn(
        'relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-canvas px-4 py-16 text-fg sm:px-6 lg:py-20',
        className,
      )}
    >
      {rich ? (
        <div className="grid w-full max-w-5xl items-center justify-items-center gap-8 lg:grid-cols-2 lg:justify-items-start lg:gap-12">
          <div aria-hidden className="size-60 sm:size-72 lg:order-last lg:size-104 lg:justify-self-center xl:size-120">
            {art}
          </div>
          {text}
        </div>
      ) : (
        text
      )}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

export { StatusScreen }
export type { StatusScreenProps, StatusScreenCopy, StatusScreenStatus }
