'use client'

import type { ReactNode } from 'react'
import { AUTH_LINKS, AuthShell, useAuthCopy, demo, type AuthBrand, type AuthCopy, type AuthLinks, type AuthPageProps, type AuthProvider } from './shell'
import { SignInForm, type LoginValues } from './shell/sign-in-form'

/* Sign in with a provider or email and password. Errors appear under their
 * field as you leave it (and all at once on submit, with focus on the first);
 * a rejected sign-in shows why above the form. The submit button carries the
 * whole request: a spinner while it runs, then a drawn check, or a shake and
 * "Couldn't sign in". Form owns the validation, the focus and the submit.
 * The form is layout/sign-in-form.tsx, shared with the auth flow.
 * Wire `onSignIn` and `onProvider`, pass your `brand`, `providers` and
 * `links` (and `linkComponent` for your router); every string is in `copy`. */

interface LoginProps extends AuthPageProps {
  /** Resolve to sign in; reject with an Error whose message says why not. Default: a short demo wait. */
  onSignIn?: (values: LoginValues) => Promise<unknown>
  /** Starts a provider's redirect with its `id`. Default: a short demo wait. */
  onProvider?: (provider: string) => unknown
  /** The "Continue with…" buttons, in order; `[]` for the email form alone. Default: Google and GitHub. */
  providers?: AuthProvider[]
  /** The fields' starting values (`email`, `password`, `remember`). Default: empty, with "Keep me signed in" on. */
  defaultValues?: Partial<LoginValues>
  /** A server error to show above the form (from a failed redirect, say) until the next attempt. */
  error?: ReactNode
}

function Login({ layout = 'card', copy: copyProp, links: linksProp, onSignIn = () => demo('Login: onSignIn', 1200), onProvider, providers, defaultValues, error, ...frame }: LoginProps) {
  const copy = useAuthCopy(copyProp)
  const links = { ...AUTH_LINKS, ...linksProp }
  return (
    <AuthShell variant={layout} copy={copy} links={links} {...frame}>
      <SignInForm
        copy={copy}
        onSignIn={onSignIn}
        onProvider={onProvider}
        providers={providers}
        defaultValues={defaultValues}
        error={error}
        forgot={{ href: links.forgot }}
        signUp={{ href: links.signUp }}
      />
    </AuthShell>
  )
}

export { Login }
export type { AuthBrand, AuthCopy, AuthLinks, AuthProvider, LoginProps, LoginValues }
