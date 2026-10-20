'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useYouj } from '@youj/core'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { AsyncButton } from '../../../components/ui/async-button'
import { Checkbox } from '../../../components/ui/checkbox'
import { FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Form, FormField, FormSubmit } from '../../../components/ui/form'
import { Input } from '../../../components/ui/input'
import { PasswordInput } from '../../../components/ui/password-input'
import { AuthHeader, SocialSignIn, type AuthProvider } from '../shell'
import { AuthLink, footerLink, quietLink } from './auth-link'
import { AUTH_COPY, type AuthAction, type AuthCopy } from './copy'

/* Sign in with a provider or email and password: the body of the login page
 * and of the auth flow's first step. Errors appear under their field as you
 * leave it (and all at once on submit, with focus on the first); a rejected
 * sign-in shows why above the form. The submit button carries the request:
 * a spinner while it runs, then a drawn check, or a shake and "Couldn't sign
 * in". With `onMagicLink`, a second button emails a one-time link to the
 * address in the field instead. */

const signInSchema = (copy: AuthCopy) =>
  z.object({
    email: z.string().trim().min(1, copy.emailRequired).email(copy.emailInvalid),
    password: z.string().min(1, copy.passwordRequired),
    remember: z.boolean(),
  })
type LoginValues = z.infer<ReturnType<typeof signInSchema>>

interface SignInFormProps {
  copy?: AuthCopy
  onSignIn: (values: LoginValues) => Promise<unknown>
  /** Runs once the check has landed after a sign-in. */
  onSignedIn?: () => void
  /** Starts a provider's redirect with its `id`. */
  onProvider?(provider: string): unknown
  /** The "Continue with…" buttons; `[]` for none. Default: Google and GitHub. */
  providers?: AuthProvider[]
  forgot: AuthAction
  signUp: AuthAction
  /** Offers "Email me a sign-in link" for the address in the field; `onSent` runs once it has gone. */
  magicLink?: { send: (email: string) => Promise<unknown>; onSent: (email: string) => void }
  defaultEmail?: string
  /** The fields' starting values. */
  defaultValues?: Partial<LoginValues>
  /** Hears the email as it's typed, so the next step can start with it. */
  onEmailChange?: (email: string) => void
  /** A server error to show above the form until the next attempt. */
  error?: ReactNode
}

/** Something went wrong: the rejection's own message, or a plain fallback. */
const reason = (error: unknown, copy: AuthCopy) => (error instanceof Error ? error.message : copy.genericError)

function SignInForm({ copy = AUTH_COPY, onSignIn, onSignedIn, onProvider, providers, forgot, signUp, magicLink, defaultEmail = '', defaultValues, onEmailChange, error }: SignInFormProps) {
  const k = useYouj()
  const [failure, setFailure] = useState<ReactNode>(error ?? null)
  const [seenError, setSeenError] = useState(error)
  if (seenError !== error) {
    setSeenError(error)
    setFailure(error ?? null)
  }
  const schema = useMemo(() => signInSchema(copy), [copy])
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { email: defaultEmail, password: '', remember: true, ...defaultValues },
  })
  const listener = useRef(onEmailChange)
  useLayoutEffect(() => {
    listener.current = onEmailChange
  })
  useEffect(() => {
    return form.subscribe({ name: 'email', formState: { values: true }, callback: ({ values }) => listener.current?.(values.email ?? '') })
  }, [form])

  const signIn = async (values: LoginValues) => {
    setFailure(null)
    try {
      await onSignIn(values)
    } catch (error) {
      setFailure(reason(error, copy))
      throw error
    }
  }

  // Only the email has to be right to send a link: say so under it, and shake.
  const sendLink = async () => {
    setFailure(null)
    if (!(await form.trigger('email'))) {
      form.setFocus('email')
      throw new Error(copy.emailInvalid)
    }
    const email = form.getValues('email').trim()
    try {
      await magicLink!.send(email)
    } catch (error) {
      setFailure(reason(error, copy))
      throw error
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeader title={copy.signInTitle} description={copy.signInDescription} />
      <SocialSignIn copy={copy} providers={providers} onProvider={onProvider} />
      <Form form={form} onSubmit={signIn} aria-label={copy.signInFormLabel}>
        <FieldGroup className="gap-5">
          <Alert variant="danger" open={failure !== null}>
            <AlertTitle>{copy.signInFailed}</AlertTitle>
            <AlertDescription>{failure}</AlertDescription>
          </Alert>
          <FormField name="email" label={copy.email} required>
            {(field) => <Input type="email" autoComplete="email" placeholder={copy.emailPlaceholder} {...field} />}
          </FormField>
          <FormField name="password" required>
            {(field) => (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <FieldLabel>{copy.password}</FieldLabel>
                  <AuthLink to={forgot} className={quietLink}>
                    {copy.forgotPassword}
                  </AuthLink>
                </div>
                <PasswordInput autoComplete="current-password" {...field} />
              </>
            )}
          </FormField>
          <FormField name="remember" orientation="horizontal">
            {({ value, onChange, ...field }) => (
              <>
                <Checkbox checked={value} onCheckedChange={onChange} {...field} />
                <FieldLabel className="font-normal">{copy.remember}</FieldLabel>
              </>
            )}
          </FormField>
          <FormSubmit
            size="lg"
            className="w-full"
            pendingLabel={copy.signingIn}
            successLabel={copy.signedIn}
            errorLabel={copy.signInError}
            onActionStateChange={onSignedIn && ((state) => state === 'success' && setTimeout(onSignedIn, k.ms('deliberate')))}
          >
            {copy.signIn}
          </FormSubmit>
          {magicLink && (
            <AsyncButton
              variant="ghost"
              size="lg"
              className="-mt-2 w-full"
              onAction={sendLink}
              pendingLabel={copy.magicLinkSending}
              successLabel={copy.magicLinkSent}
              errorLabel={copy.magicLinkError}
              onActionStateChange={(state) => {
                if (state === 'success') setTimeout(() => magicLink.onSent(form.getValues('email').trim()), k.ms('deliberate'))
              }}
            >
              {copy.magicLink}
            </AsyncButton>
          )}
        </FieldGroup>
      </Form>
      <p className="text-center text-ui text-fg-muted">
        {copy.newHere}{' '}
        <AuthLink to={signUp} className={footerLink}>
          {copy.createAccountLink}
        </AuthLink>
      </p>
    </div>
  )
}

export { reason, SignInForm, signInSchema }
export type { LoginValues, SignInFormProps }
