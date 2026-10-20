'use client'

import { AUTH_LINKS, AuthShell, useAuthCopy, demo, type AuthBrand, type AuthCopy, type AuthLinks, type AuthPageProps } from './shell'
import { MagicLinkSent as MagicLinkCard } from './shell/magic-link'

/* After a passwordless sign-in: the link is in the mail. The envelope seals
 * itself and a check lands on it; the address is spelled out so a typo is
 * obvious; shortcuts open the common mail apps; "Resend" waits out a
 * countdown between sends, and a different address is one step back. The
 * body is layout/magic-link.tsx, shared with the auth flow.
 * Pass the `email`, wire `onResend`, pass your `brand` and `links` (the mail
 * apps' too); every string is in `copy`. */

interface MagicLinkSentProps extends AuthPageProps {
  /** The address the link went to. Default: the demo's. */
  email?: string
  /** Sends another link. Default: a short demo wait. */
  onResend?: () => unknown
}

function MagicLinkSent({ layout = 'card', copy: copyProp, links: linksProp, email = 'ada@northwind.dev', onResend = () => demo('MagicLinkSent: onResend', 900), ...frame }: MagicLinkSentProps) {
  const copy = useAuthCopy(copyProp)
  const links = { ...AUTH_LINKS, ...linksProp }
  return (
    <AuthShell variant={layout} copy={copy} links={links} {...frame}>
      <MagicLinkCard copy={copy} email={email} onResend={onResend} changeEmail={{ href: links.signIn }} mail={links} />
    </AuthShell>
  )
}

export { MagicLinkSent }
export type { AuthBrand, AuthCopy, AuthLinks, MagicLinkSentProps }
