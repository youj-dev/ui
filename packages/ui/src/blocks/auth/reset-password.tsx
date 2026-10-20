'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AUTH_LINKS, AuthShell, useAuthCopy, demo, type AuthBrand, type AuthCopy, type AuthLinks, type AuthPageProps } from './shell'
import { ResetDone, ResetForm } from './shell/reset-form'

/* Choose a new password from a reset link: the strength meter and rules
 * track it's typed, the confirmation must match, and an expired link
 * says so above the form. Once saved, a confirmation takes over with the way
 * back to sign in, and focus moves to it. Both halves are
 * layout/reset-form.tsx, shared with the auth flow.
 * Pass the link's `email`, wire `onReset`, pass your `brand` and `links`;
 * every string is in `copy`. */

interface ResetPasswordProps extends Omit<AuthPageProps, 'onReset'> {
  /** Resolve once saved; reject with an Error whose message says why not (an expired link, say). Default: a short demo wait. */
  onReset?: (password: string) => Promise<unknown>
  /** The account the reset link is for, named under the heading; `undefined` leaves it out. Default: the demo's address. */
  email?: string
  /** A server error to show above the form (a link you already know has expired, say) until the next attempt. */
  error?: ReactNode
}

function ResetPassword({ layout = 'card', copy: copyProp, links: linksProp, onReset = () => demo('ResetPassword: onReset', 1200), email = 'ada@northwind.dev', error, ...frame }: ResetPasswordProps) {
  const copy = useAuthCopy(copyProp)
  const links = { ...AUTH_LINKS, ...linksProp }
  const [done, setDone] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (done) heading.current?.focus()
  }, [done])

  return (
    <AuthShell variant={layout} copy={copy} links={links} {...frame}>
      {done ? (
        <ResetDone copy={copy} signIn={{ href: links.signIn }} headingRef={heading} />
      ) : (
        <ResetForm copy={copy} email={email} error={error} onReset={onReset} onDone={() => setDone(true)} />
      )}
    </AuthShell>
  )
}

export { ResetPassword }
export type { AuthBrand, AuthCopy, AuthLinks, ResetPasswordProps }
