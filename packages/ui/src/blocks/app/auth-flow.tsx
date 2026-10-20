'use client'

import { useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { useYouj } from '@youj/core'
import type { IllustrationSlot } from '@youj/illustrations'
import { ArrowRightIcon, CheckCircleIcon } from '@youj/icons'
import { buttonVariants } from '../../components/ui/button'
import { EmptyMedia } from '../../components/ui/empty'
import { cn } from '../../lib/utils'
import { AuthHeadingContext, AuthShell, AuthTitle } from '../auth/shell'
import { AuthLink, footerLink } from '../auth/shell/auth-link'
import { CheckEmail, ForgotForm, useForgotForm } from '../auth/shell/forgot-form'
import { MagicLinkSent } from '../auth/shell/magic-link'
import { ResetDone, ResetForm } from '../auth/shell/reset-form'
import { SignInForm, type LoginValues } from '../auth/shell/sign-in-form'
import { SignUpForm, type SignupValues } from '../auth/shell/sign-up-form'
import { TwoFactorForm, type CodeKind } from '../auth/shell/two-factor-form'
import { DEFAULT_COPY, DEPTH, TITLE, demo, demoSignIn, demoVerify, type AuthFlowCopy, type AuthView } from './auth-flow/data'
import { StepStage } from './auth-flow/stage'

/* The whole way in, as one stateful flow: sign in or create an account; forgot
 * password → "check your email" → a new password → done; sign in → a second
 * factor → signed in; or a one-time link by email. Each step is the same form
 * the separate auth pages render (auth/shell/*), and the flow moves between
 * them in place: the card resizes on the layout spring while the step slides
 * the way the journey is going, focus lands on the new step's heading and
 * the step is announced. Reduced motion swaps in place.
 *
 * Run it uncontrolled on one route, or drive it from your router with `view`
 * and `onViewChange` (the reset link in the email opens `view="reset"`).
 * `mode="page"` is the full page with the auth layout's art panel;
 * `mode="card"` is a card for a modal, dialog or popover: in a dialog, the
 * dialog is the card. Every handler is async: resolve to move on, reject with
 * an Error whose message says why not, and the step shows it. It is built for
 * the compact layout density (ui.css), taken from the page. */

interface AuthFlowProps extends Omit<ComponentProps<'div'>, 'children' | 'onReset'> {
  /** `page`: the full page, form beside the art panel. `card`: a card for a modal or dialog. Default `page`. */
  mode?: 'page' | 'card'
  /** The step shown, when your router owns it. */
  view?: AuthView
  /** The first step, when the flow owns it. Default `sign-in`. */
  defaultView?: AuthView
  onViewChange?: (view: AuthView) => void
  /** The page's art: a scene from the illustrations by id, your own node, or `null` for the plain band alone. Default 'deploy'. */
  illustration?: IllustrationSlot
  copy?: Partial<AuthFlowCopy>
  /** Resolve `'two-factor'` to ask for a code, anything else to sign in; reject to say why not. */
  onSignIn?: (values: LoginValues) => Promise<unknown>
  onSignUp?: (values: SignupValues) => Promise<unknown>
  /** Send the reset link. Resolve the same whether or not the address has an account. */
  onRequestReset?: (email: string) => Promise<unknown>
  /** Save the new password from the reset link. */
  onReset?: (password: string) => Promise<unknown>
  /** Resolve true (or nothing) for a good code, false or throw for a bad one. */
  onVerifyCode?: (code: string, kind: CodeKind) => unknown
  /** Email a one-time sign-in link. */
  onMagicLink?: (email: string) => Promise<unknown>
  onResendCode?: () => unknown
  onProvider?: (provider: 'github' | 'google') => unknown
  /** Where the second factor's text went, e.g. "•••• 4821". */
  destination?: string
  /** The account's address, when it's known up front (the reset link's). */
  email?: string
  /** Where "Open your workspace" goes once signed in. */
  continueHref?: string
}

function AuthFlow({
  mode = 'page',
  view: viewProp,
  defaultView = 'sign-in',
  onViewChange,
  illustration,
  copy: copyProp,
  onSignIn = demoSignIn,
  onSignUp = () => demo('AuthFlow: onSignUp', 1400),
  onRequestReset = () => demo('AuthFlow: onRequestReset', 1100),
  onReset = () => demo('AuthFlow: onReset', 1200),
  onVerifyCode = demoVerify,
  onMagicLink = () => demo('AuthFlow: onMagicLink', 1000),
  onResendCode = () => demo('AuthFlow: onResendCode', 800),
  onProvider,
  destination = '•••• 4821',
  email: accountEmail,
  continueHref = '#dashboard',
  className,
  ...rest
}: AuthFlowProps) {
  const k = useYouj()
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp }), [copyProp])
  const [ownView, setOwnView] = useState<AuthView>(defaultView)
  const view = viewProp ?? ownView
  const go = (next: AuthView) => {
    if (viewProp === undefined) setOwnView(next)
    onViewChange?.(next)
  }

  // Deeper into the journey slides forward; back toward sign-in slides back.
  const [shown, setShown] = useState(view)
  const [direction, setDirection] = useState<1 | -1>(1)
  if (shown !== view) {
    setDirection(DEPTH[view] >= DEPTH[shown] ? 1 : -1)
    setShown(view)
  }

  // The address typed on one step starts the next; `sentTo` is the one a link went to.
  const [draft, remember] = useState(accountEmail ?? '')
  const [sentTo, setSentTo] = useState(accountEmail ?? '')
  const forgotForm = useForgotForm(copy, accountEmail)
  const toForgot = () => {
    if (!forgotForm.getValues('email')) forgotForm.reset({ email: draft.trim() })
    go('forgot')
  }
  const signedIn = useRef<unknown>(undefined)

  // Say each new step out loud, once it's in (not on the first render).
  const [announced, setAnnounced] = useState('')
  const [announcedFor, setAnnouncedFor] = useState(view)
  if (announcedFor !== view) {
    setAnnouncedFor(view)
    setAnnounced(copy.announce(TITLE[view](copy)))
  }

  const toSignIn = { onClick: () => go('sign-in') }
  const steps: Record<AuthView, () => ReactNode> = {
    'sign-in': () => (
      <SignInForm
        copy={copy}
        onSignIn={async (values) => {
          signedIn.current = await onSignIn(values)
        }}
        onSignedIn={() => go(signedIn.current === 'two-factor' ? 'two-factor' : 'signed-in')}
        onProvider={onProvider}
        forgot={{ onClick: toForgot }}
        signUp={{ onClick: () => go('sign-up') }}
        magicLink={{
          send: onMagicLink,
          onSent: (email) => {
            setSentTo(email)
            go('magic-link-sent')
          },
        }}
        defaultEmail={draft}
        onEmailChange={remember}
      />
    ),
    'sign-up': () => (
      <SignUpForm copy={copy} onSignUp={onSignUp} onSignedUp={() => go('signed-in')} onProvider={onProvider} signIn={toSignIn} defaultEmail={draft} onEmailChange={remember} />
    ),
    forgot: () => (
      <ForgotForm
        copy={copy}
        form={forgotForm}
        onSend={onRequestReset}
        onSent={(email) => {
          remember(email)
          setSentTo(email)
          go('forgot-sent')
        }}
        signIn={toSignIn}
      />
    ),
    'forgot-sent': () => (
      <div className="flex flex-col gap-5">
        <CheckEmail copy={copy} email={sentTo} onResend={() => onRequestReset(sentTo)} onChangeEmail={() => go('forgot')} />
        <p className="text-center text-ui text-fg-muted">
          <AuthLink to={toSignIn} className={footerLink}>
            {copy.backToSignIn}
          </AuthLink>
        </p>
      </div>
    ),
    reset: () => <ResetForm copy={copy} email={sentTo || undefined} onReset={onReset} onDone={() => go('reset-done')} />,
    'reset-done': () => <ResetDone copy={copy} signIn={toSignIn} />,
    'two-factor': () => (
      <TwoFactorForm copy={copy} onVerify={onVerifyCode} onResend={onResendCode} onVerified={() => setTimeout(() => go('signed-in'), k.ms('deliberate'))} destination={destination} signOut={toSignIn} />
    ),
    'magic-link-sent': () => <MagicLinkSent copy={copy} email={sentTo} onResend={() => onMagicLink(sentTo)} changeEmail={toSignIn} />,
    'signed-in': () => (
      <div className="flex flex-col items-center gap-6 text-center">
        <EmptyMedia variant="icon" className="mb-0 size-16">
          <CheckCircleIcon trigger="mount" size={28} strokeWidth={1.5} className="size-7 text-success" />
        </EmptyMedia>
        <div className="flex flex-col gap-1.5">
          <AuthTitle>{copy.signedInTitle}</AuthTitle>
          <p className="text-ui text-fg-muted">{copy.signedInDescription}</p>
        </div>
        <a href={continueHref} className={buttonVariants({ size: 'lg', className: 'w-full' })}>
          {copy.openWorkspace}
          <ArrowRightIcon className="rtl:-scale-x-100" />
        </a>
        <AuthLink to={toSignIn} className="rounded-sm text-ui-sm text-fg-muted underline-offset-4 focus-ring hover:text-fg hover:underline">
          {copy.someoneElse}
        </AuthLink>
      </div>
    ),
  }

  const body = (
    <AuthHeadingContext.Provider value={{ level: mode === 'page' ? 1 : 2, focusable: true }}>
      <StepStage step={view} direction={direction}>
        {steps[view]()}
      </StepStage>
      <p role="status" data-slot="auth-flow-status" className="sr-only">
        {announced}
      </p>
    </AuthHeadingContext.Provider>
  )

  if (mode === 'page')
    return (
      <AuthShell variant="split" illustration={illustration} {...rest} className={className}>
        {body}
      </AuthShell>
    )
  return (
    <div
      data-slot="auth-flow"
      {...rest}
      className={cn(
        'w-full max-w-sm rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface px-(--ui--panel-x) py-(--ui--panel-y) text-fg shadow-md [--auth-surface:var(--color-surface)]',
        // In a dialog, the dialog is the card: it brings the surface and the padding. Headings keep clear of its close button.
        'in-data-[slot=dialog-content]:max-w-none in-data-[slot=dialog-content]:rounded-none in-data-[slot=dialog-content]:border-0 in-data-[slot=dialog-content]:bg-transparent in-data-[slot=dialog-content]:p-0 in-data-[slot=dialog-content]:shadow-none in-data-[slot=dialog-content]:[--auth-surface:var(--color-overlay)]',
        'in-data-[slot=dialog-content]:[&_h2]:pe-8 in-data-[slot=dialog-content]:[&_.text-center_h2]:px-8',
        className,
      )}
    >
      {body}
    </div>
  )
}

export { AuthFlow, DEFAULT_COPY }
export type { AuthFlowCopy, AuthFlowProps, AuthView }
