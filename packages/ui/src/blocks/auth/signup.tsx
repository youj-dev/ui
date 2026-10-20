'use client'

import type { ReactNode } from 'react'
import { AUTH_LINKS, AuthShell, useAuthCopy, demo, type AuthBrand, type AuthCopy, type AuthLinks, type AuthPageProps, type AuthProvider } from './shell'
import { SignUpForm, type SignupValues } from './shell/sign-up-form'

/* Create an account: a provider, or name, email and a new password whose
 * strength meter fills as it's typed while each rule ticks itself off. The
 * rules are the schema's rules, so the checklist and the error agree. Form
 * owns the validation, the focus and the submit. The form is
 * layout/sign-up-form.tsx, shared with the auth flow.
 * Wire `onSignUp` and `onProvider`, pass your `brand`, `providers` and
 * `links` (and `linkComponent` for your router); every string is in `copy`. */

interface SignupProps extends AuthPageProps {
  /** Resolve once the account exists; reject with an Error whose message says why not. Default: a short demo wait. */
  onSignUp?: (values: SignupValues) => Promise<unknown>
  /** Starts a provider's redirect with its `id`. Default: a short demo wait. */
  onProvider?: (provider: string) => unknown
  /** The "Continue with…" buttons, in order; `[]` for the email form alone. Default: Google and GitHub. */
  providers?: AuthProvider[]
  /** The fields' starting values (an invited `email`, say). Default: empty. */
  defaultValues?: Partial<SignupValues>
  /** A server error to show above the form until the next attempt. */
  error?: ReactNode
}

function Signup({ layout = 'card', copy: copyProp, links: linksProp, onSignUp = () => demo('Signup: onSignUp', 1400), onProvider, providers, defaultValues, error, ...frame }: SignupProps) {
  const copy = useAuthCopy(copyProp)
  const links = { ...AUTH_LINKS, ...linksProp }
  return (
    <AuthShell variant={layout} copy={copy} links={links} {...frame}>
      <SignUpForm
        copy={copy}
        onSignUp={onSignUp}
        onProvider={onProvider}
        providers={providers}
        defaultValues={defaultValues}
        error={error}
        signIn={{ href: links.signIn }}
      />
    </AuthShell>
  )
}

export { Signup }
export type { AuthBrand, AuthCopy, AuthLinks, AuthProvider, SignupProps, SignupValues }
