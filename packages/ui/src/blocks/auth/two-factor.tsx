'use client'

import { AUTH_LINKS, AuthShell, useAuthCopy, demo, type AuthBrand, type AuthCopy, type AuthLinks, type AuthPageProps } from './shell'
import { TwoFactorForm } from './shell/two-factor-form'

/* The second factor: a six-digit code from an authenticator app or a text
 * message. Filling the last slot verifies it at once (no submit button): the
 * slots lock with a spinner, then turn green left to right as a check draws,
 * or shake and clear for another try. "Resend" is held back by a countdown.
 * A recovery code (two groups of four letters and digits) is the way in when
 * the phone isn't at hand. The form is layout/two-factor-form.tsx, shared
 * with the auth flow.
 * Wire `onVerify` and `onResend`, pass the `destination`, your `brand` and
 * `links`; every string is in `copy`. */

interface TwoFactorProps extends AuthPageProps {
  /** Resolve true (or nothing) for a good code, false or throw for a bad one. Default: a demo check that refuses all zeros. */
  onVerify?: (code: string, kind: 'totp' | 'recovery') => unknown
  /** Texts a new code. Default: a short demo wait. */
  onResend?: () => unknown
  /** Where the code went, e.g. "•••• 4821". Default: "•••• 4821". */
  destination?: string
}

async function demoVerify(code: string) {
  await demo('TwoFactor: onVerify', 900)
  return !/^0+$/.test(code)
}

function TwoFactor({ layout = 'card', copy: copyProp, links: linksProp, onVerify = demoVerify, onResend = () => demo('TwoFactor: onResend', 800), destination = '•••• 4821', ...frame }: TwoFactorProps) {
  const copy = useAuthCopy(copyProp)
  const links = { ...AUTH_LINKS, ...linksProp }
  return (
    <AuthShell variant={layout} copy={copy} links={links} {...frame}>
      <TwoFactorForm copy={copy} onVerify={onVerify} onResend={onResend} destination={destination} signOut={{ href: links.signIn }} />
    </AuthShell>
  )
}

export { TwoFactor }
export type { AuthBrand, AuthCopy, AuthLinks, TwoFactorProps }
