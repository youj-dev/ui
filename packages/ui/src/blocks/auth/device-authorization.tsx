'use client'

import { Fragment, useRef, useState, type ReactNode } from 'react'
import { CheckIcon, ClockIcon, ShieldCheckIcon, ShieldXIcon, TerminalIcon } from '@youj/icons'
import { AsyncButton } from '../../components/ui/async-button'
import { Button } from '../../components/ui/button'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { InputOTP, useOTPVerification } from '../../components/ui/input-otp'
import { PropertyList, PropertyListItem, PropertyPerson } from '../../components/ui/property-list'
import { cn } from '../../lib/utils'
import { AUTH_LINKS, AuthHeader, AuthShell, AuthTitle, demo, useAuthCopy, type AuthBrand, type AuthCopy, type AuthLinks, type AuthPageProps } from './shell'
import { AuthLink, quietLink } from './shell/auth-link'

/* Signing a command-line tool (or any device without a browser) in: the tool
 * printed a code, and this page asks whether to let that tool into your
 * account. It shows who is asking (the app), what it will be able to do
 * (`access`), who it would act as (the signed-in `account`, with a way to
 * switch) and the code as tiles to compare with the terminal, then a plain
 * safety note and Authorize or Deny. Without a `code` (the user came here by
 * hand) it asks for the one the terminal shows, in the kit's code field: upper
 * case, with or without the dash.
 * Three endings: approved ("close this tab"), denied and expired; a code that
 * isn't recognized shakes the field instead. Wire `onCheckCode`, `onAuthorize`
 * and `onDeny`; every string is in `copy`. */

type DeviceStep = 'enter' | 'review' | 'approved' | 'denied' | 'expired'

/** The tool asking for access. */
interface DeviceApp {
  name: string
  /** Shown after the name, e.g. "2.4.0". */
  version?: string
  /** Its mark, 24px. Default: a terminal. */
  logo?: ReactNode
}

interface DeviceAccount {
  name: string
  email: string
  /** A photo; without one, the initials. */
  image?: string
}

interface DeviceAuthorizationProps extends AuthPageProps {
  /** The tool asking. Default: the Fernbit command-line tool. */
  app?: DeviceApp
  /** What approving lets it do, one line each. */
  access?: string[]
  /** Who is signed in. Default: the demo's Ada Lovelace. */
  account?: DeviceAccount
  /** The code the terminal printed, "TFXS-STXG" (the dash is optional). Omit it to ask for the user's own. */
  code?: string
  /** Where it opens. Default: `review` with a `code`, else `enter`. `approved`, `denied` and `expired` draw those endings. */
  defaultStep?: DeviceStep
  /** Checks a typed code; resolve true (or nothing) for a live one, false or throw for one that isn't. Default: a demo wait that refuses ZZZZ-ZZZZ. */
  onCheckCode?: (code: string) => unknown
  /** Lets the tool in; resolve when it has. Default: a short demo wait. */
  onAuthorize?: (code: string) => unknown
  /** Turns the request down; resolve when it has. Default: a short demo wait. */
  onDeny?: (code: string) => unknown
}

const APP: DeviceApp = { name: 'Fernbit CLI', version: '2.4.0' }
const ACCESS = ['Read your projects and deployments', 'Create deployments and preview links']
const ACCOUNT: DeviceAccount = { name: 'Ada Lovelace', email: 'ada@northwind.dev' }
const CODE = 'TFXS-STXG'
const SIZE = 8

const clean = (text: string) => text.replace(/[^a-z0-9]/gi, '').toUpperCase()

async function demoCheck(code: string) {
  await demo('DeviceAuthorization: onCheckCode', 800)
  return code !== 'ZZZZZZZZ'
}

const SEAL = {
  success: 'bg-success-subtle text-success-text',
  danger: 'bg-danger-subtle text-danger-text',
  warning: 'bg-warning-subtle text-warning-text',
  neutral: 'bg-band text-fg-muted',
}

/* The code as tiles: the field's own slots, drawn flat and soft, so the page
 * reads the same whether the code is typed or shown. */
const TILE = 'grid h-control-lg min-w-0 max-w-control-lg flex-1 place-items-center rounded-md bg-band text-base font-medium text-fg tabular-nums'

function CodeTiles({ code }: { code: string }) {
  const half = SIZE / 2
  return (
    <div role="img" aria-label={[...code].join(' ')} data-slot="device-code" className="flex w-full items-center justify-center gap-2">
      {[code.slice(0, half), code.slice(half)].map((group, g) => (
        <Fragment key={g}>
          {g > 0 && <span aria-hidden className="h-px w-2.5 shrink-0 rounded-full bg-fg-subtle" />}
          <div aria-hidden className="flex min-w-0 flex-1 items-center gap-1.5">
            {[...group].map((char, i) => (
              <span key={i} className={TILE}>
                {char}
              </span>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  )
}

function EnterCode({ copy, onCheckCode, onFound }: { copy: AuthCopy; onCheckCode: (code: string) => unknown; onFound: (code: string) => void }) {
  const otp = useOTPVerification(onCheckCode, { onVerified: onFound })
  return (
    <div className="flex flex-col gap-6">
      <AuthHeader title={copy.deviceEnterTitle} description={copy.deviceEnterDescription} />
      <Field invalid={otp.status === 'error'}>
        <FieldLabel>{copy.deviceEnterLabel}</FieldLabel>
        <InputOTP
          {...otp.field}
          autoFocus
          length={SIZE}
          groups={[SIZE / 2, SIZE / 2]}
          mode="alphanumeric"
          statusLabels={{ verifying: copy.deviceChecking, success: copy.deviceCodeFound, error: copy.deviceCodeUnknown }}
          className="[&_[data-slot=input-otp-slot]]:border-transparent [&_[data-slot=input-otp-slot]]:bg-band"
        />
        <FieldError>{otp.status === 'error' ? copy.deviceCodeUnknownHint : undefined}</FieldError>
      </Field>
    </div>
  )
}

interface ReviewProps extends Required<Pick<DeviceAuthorizationProps, 'app' | 'access' | 'account' | 'onAuthorize' | 'onDeny'>> {
  copy: AuthCopy
  code: string
  links: AuthLinks
  onApproved: () => void
  onDenied: () => void
  onEnter: () => void
}

function Review({ copy, app, access, account, code, links, onAuthorize, onDeny, onApproved, onDenied, onEnter }: ReviewProps) {
  // An ending waits for its button to settle, so the check is seen first.
  const outcome = useRef<'approved' | 'denied' | null>(null)
  const settled = (state: string) => {
    if (state !== 'idle') return
    if (outcome.current === 'approved') onApproved()
    if (outcome.current === 'denied') onDenied()
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <span aria-hidden className="grid size-12 place-items-center rounded-xl bg-band text-fg [&_svg]:size-6">
          {app.logo ?? <TerminalIcon />}
        </span>
        <div className="flex flex-col gap-1.5">
          <AuthTitle>{copy.deviceTitle(app.name)}</AuthTitle>
          <p className="text-ui text-fg-muted">{copy.deviceDescription}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <CodeTiles code={code} />
        <button type="button" onClick={onEnter} className={cn(quietLink, 'cursor-pointer')}>
          {copy.deviceEnterInstead}
        </button>
      </div>

      <PropertyList className="[--property-label-width:--spacing(24)]">
        <PropertyListItem label={copy.deviceApp}>{app.version ? `${app.name} ${app.version}` : app.name}</PropertyListItem>
        <PropertyListItem label={copy.deviceAccess} className="items-start py-2.5">
          <ul className="flex flex-col gap-1">
            {access.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </PropertyListItem>
        <PropertyListItem label={copy.deviceAccount} className="items-start py-2.5">
          <span className="flex min-w-0 flex-col gap-1">
            <PropertyPerson name={account.name} src={account.image} />
            <span className="truncate text-ui-sm text-fg-muted">{account.email}</span>
            <AuthLink to={{ href: links.signIn }} className={cn(quietLink, 'w-fit')}>
              {copy.deviceNotYou}
            </AuthLink>
          </span>
        </PropertyListItem>
      </PropertyList>

      <p className="flex items-start gap-2.5 text-ui-sm text-fg-muted">
        <ShieldCheckIcon aria-hidden size={16} className="mt-0.5 shrink-0 text-warning-text" />
        <span>{copy.deviceSafety}</span>
      </p>

      <div className="grid grid-cols-2 gap-2">
        <AsyncButton
          variant="secondary"
          size="lg"
          onAction={async () => {
            await onDeny(code)
            outcome.current = 'denied'
          }}
          onActionStateChange={settled}
          pendingLabel={copy.deviceDenying}
          successLabel={copy.deviceDenied}
          errorLabel={copy.deviceDenyError}
        >
          {copy.deviceDeny}
        </AsyncButton>
        <AsyncButton
          size="lg"
          onAction={async () => {
            await onAuthorize(code)
            outcome.current = 'approved'
          }}
          onActionStateChange={settled}
          pendingLabel={copy.deviceAuthorizing}
          successLabel={copy.deviceAuthorized}
          errorLabel={copy.deviceAuthorizeError}
        >
          {copy.deviceAuthorize}
        </AsyncButton>
      </div>
    </div>
  )
}

function Ending({ tone, icon, title, description, children }: { tone: keyof typeof SEAL; icon: ReactNode; title: string; description: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span aria-hidden className={cn('grid size-12 place-items-center rounded-full [&_svg]:size-6', SEAL[tone])}>
        {icon}
      </span>
      <div className="flex flex-col gap-1.5">
        <AuthTitle>{title}</AuthTitle>
        <p className="text-ui text-balance text-fg-muted">{description}</p>
      </div>
      {children}
    </div>
  )
}

function DeviceAuthorization({
  layout = 'card',
  copy: copyProp,
  links: linksProp,
  app = APP,
  access = ACCESS,
  account = ACCOUNT,
  code: codeProp,
  defaultStep,
  onCheckCode = demoCheck,
  onAuthorize = () => demo('DeviceAuthorization: onAuthorize', 1000),
  onDeny = () => demo('DeviceAuthorization: onDeny', 700),
  ...frame
}: DeviceAuthorizationProps) {
  const copy = useAuthCopy(copyProp)
  const links = { ...AUTH_LINKS, ...linksProp }
  const [step, setStep] = useState<DeviceStep>(defaultStep ?? (codeProp ? 'review' : 'enter'))
  const [code, setCode] = useState(clean(codeProp ?? CODE))
  return (
    <AuthShell variant={layout} copy={copy} links={links} {...frame}>
      <div aria-live="polite">
        {step === 'enter' && (
          <EnterCode
            copy={copy}
            onCheckCode={onCheckCode}
            onFound={(found) => {
              setCode(clean(found))
              setStep('review')
            }}
          />
        )}
        {step === 'review' && (
          <Review
            copy={copy}
            app={app}
            access={access}
            account={account}
            code={code}
            links={links}
            onAuthorize={onAuthorize}
            onDeny={onDeny}
            onApproved={() => setStep('approved')}
            onDenied={() => setStep('denied')}
            onEnter={() => setStep('enter')}
          />
        )}
        {step === 'approved' && (
          <Ending tone="success" icon={<CheckIcon trigger="mount" strokeWidth={2.5} />} title={copy.deviceApprovedTitle} description={copy.deviceApprovedDescription(app.name)} />
        )}
        {step === 'denied' && <Ending tone="neutral" icon={<ShieldXIcon />} title={copy.deviceDeniedTitle} description={copy.deviceDeniedDescription(app.name)} />}
        {step === 'expired' && (
          <Ending tone="warning" icon={<ClockIcon />} title={copy.deviceExpiredTitle} description={copy.deviceExpiredDescription}>
            <Button variant="secondary" size="lg" className="w-full" onClick={() => setStep('enter')}>
              {copy.deviceTryAnother}
            </Button>
          </Ending>
        )}
      </div>
    </AuthShell>
  )
}

export { DeviceAuthorization }
export type { AuthBrand, AuthCopy, AuthLinks, DeviceAccount, DeviceApp, DeviceAuthorizationProps, DeviceStep }
