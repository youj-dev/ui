'use client'

import { useEffect, useRef, useState } from 'react'
import { AUTH_LINKS, AuthShell, useAuthCopy, demo, type AuthBrand, type AuthCopy, type AuthLinks, type AuthPageProps } from './shell'
import { CheckEmail, ForgotForm, useForgotForm } from './shell/forgot-form'

/* Ask for a reset link by email. Sending runs through the button's onAction;
 * once it lands, the form gives way to a confirmation that names the address,
 * offers a resend (held back by a countdown) and a way to fix a typo. Focus
 * moves to the confirmation's heading so screen readers hear the news.
 * The response is the same whether or not the address has an account.
 * Both halves are layout/forgot-form.tsx, shared with the auth flow.
 * Wire `onSend`, pass your `brand` and `links`; every string is in `copy`. */

interface ForgotPasswordProps extends AuthPageProps {
  /** Sends the reset link (and each resend); reject with an Error whose message says why not. Default: a short demo wait. */
  onSend?: (email: string) => Promise<unknown>
  /** The field's starting value. Default: empty. */
  defaultValues?: { email?: string }
}

function ForgotPassword({ layout = 'card', copy: copyProp, links: linksProp, onSend = () => demo('ForgotPassword: onSend', 1100), defaultValues, ...frame }: ForgotPasswordProps) {
  const copy = useAuthCopy(copyProp)
  const links = { ...AUTH_LINKS, ...linksProp }
  const [sentTo, setSentTo] = useState<string | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const form = useForgotForm(copy, defaultValues?.email)
  const swapped = useRef(false)
  // Focus follows the swap: to the news, or back to the field to fix a typo.
  useEffect(() => {
    if (!swapped.current) return
    if (sentTo) heading.current?.focus()
    else form.setFocus('email')
  }, [sentTo, form])

  const show = (email: string | null) => {
    swapped.current = true
    setSentTo(email)
  }

  return (
    <AuthShell variant={layout} copy={copy} links={links} {...frame}>
      {sentTo ? (
        <CheckEmail copy={copy} email={sentTo} headingRef={heading} onResend={() => onSend(sentTo)} onChangeEmail={() => show(null)} />
      ) : (
        <ForgotForm copy={copy} form={form} onSend={onSend} onSent={show} signIn={{ href: links.signIn }} />
      )}
    </AuthShell>
  )
}

export { ForgotPassword }
export type { AuthBrand, AuthCopy, AuthLinks, ForgotPasswordProps }
