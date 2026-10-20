'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useYouj } from '@youj/core'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Checkbox } from '../../../components/ui/checkbox'
import { FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Form, FormField, FormSubmit } from '../../../components/ui/form'
import { Input } from '../../../components/ui/input'
import { defaultPasswordRequirements, PasswordInput, PasswordRequirements, PasswordStrength } from '../../../components/ui/password-input'
import { AuthHeader, SocialSignIn, type AuthProvider } from '../shell'
import { AuthLink, footerLink } from './auth-link'
import { AUTH_COPY, type AuthAction, type AuthCopy } from './copy'
import { reason } from './sign-in-form'

/* Create an account: a provider, or name, email and a new password whose
 * strength meter fills as it's typed while each rule ticks itself off. The
 * rules are the schema's rules, so the checklist and the error agree. Form
 * owns the validation, the focus and the submit. The body of the signup
 * page and of the auth flow's "create account" step. */

const signUpSchema = (copy: AuthCopy) =>
  z.object({
    name: z.string().trim().min(1, copy.nameRequired),
    email: z.string().trim().min(1, copy.emailRequired).email(copy.emailInvalid),
    password: z.string().refine((p) => defaultPasswordRequirements.every((rule) => rule.test(p)), copy.passwordRules),
    terms: z.boolean().refine((v) => v, copy.termsRequired),
  })
type SignupValues = z.infer<ReturnType<typeof signUpSchema>>

interface SignUpFormProps {
  copy?: AuthCopy
  onSignUp: (values: SignupValues) => Promise<unknown>
  /** Runs once the check has landed after the account is made. */
  onSignedUp?: () => void
  /** Starts a provider's redirect with its `id`. */
  onProvider?(provider: string): unknown
  /** The "Continue with…" buttons; `[]` for none. Default: Google and GitHub. */
  providers?: AuthProvider[]
  signIn: AuthAction
  defaultEmail?: string
  /** The fields' starting values. */
  defaultValues?: Partial<SignupValues>
  onEmailChange?: (email: string) => void
  /** A server error to show above the form until the next attempt. */
  error?: ReactNode
}

function SignUpForm({ copy = AUTH_COPY, onSignUp, onSignedUp, onProvider, providers, signIn, defaultEmail = '', defaultValues, onEmailChange, error }: SignUpFormProps) {
  const k = useYouj()
  const rulesId = useId()
  const [failure, setFailure] = useState<ReactNode>(error ?? null)
  const [seenError, setSeenError] = useState(error)
  if (seenError !== error) {
    setSeenError(error)
    setFailure(error ?? null)
  }
  const schema = useMemo(() => signUpSchema(copy), [copy])
  const form = useForm<SignupValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { name: '', email: defaultEmail, password: '', terms: false, ...defaultValues },
  })
  const listener = useRef(onEmailChange)
  useLayoutEffect(() => {
    listener.current = onEmailChange
  })
  useEffect(() => {
    return form.subscribe({ name: 'email', formState: { values: true }, callback: ({ values }) => listener.current?.(values.email ?? '') })
  }, [form])

  const signUp = async (values: SignupValues) => {
    setFailure(null)
    try {
      await onSignUp(values)
    } catch (error) {
      setFailure(reason(error, copy))
      throw error
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeader title={copy.signUpTitle} description={copy.signUpDescription} />
      <SocialSignIn copy={copy} providers={providers} onProvider={onProvider} />
      <Form form={form} onSubmit={signUp} aria-label={copy.signUpFormLabel}>
        <FieldGroup className="gap-5">
          <Alert variant="danger" open={failure !== null}>
            <AlertTitle>{copy.signUpFailed}</AlertTitle>
            <AlertDescription>{failure}</AlertDescription>
          </Alert>
          <FormField name="name" label={copy.name} required>
            {(field) => <Input autoComplete="name" placeholder={copy.namePlaceholder} {...field} />}
          </FormField>
          <FormField name="email" label={copy.workEmail} required>
            {(field) => <Input type="email" autoComplete="email" placeholder={copy.emailPlaceholder} {...field} />}
          </FormField>
          <FormField name="password" label={copy.password} required>
            {(field) => (
              <>
                <PasswordInput autoComplete="new-password" aria-describedby={rulesId} {...field} />
                <PasswordStrength value={field.value} />
                <PasswordRequirements id={rulesId} value={field.value} />
              </>
            )}
          </FormField>
          {/* The checkbox and its label share a row; the error sits under the label. */}
          <FormField name="terms" className="[&>[data-slot=field-error-panel]]:ps-6.5">
            {({ value, onChange, ...field }) => (
              <div className="flex items-start gap-2.5">
                <Checkbox checked={value} onCheckedChange={onChange} className="mt-0.5" {...field} />
                <FieldLabel className="font-normal">{copy.terms}</FieldLabel>
              </div>
            )}
          </FormField>
          <FormSubmit
            size="lg"
            className="w-full"
            pendingLabel={copy.creatingAccount}
            successLabel={copy.accountCreated}
            errorLabel={copy.createError}
            onActionStateChange={onSignedUp && ((state) => state === 'success' && setTimeout(onSignedUp, k.ms('deliberate')))}
          >
            {copy.createAccount}
          </FormSubmit>
        </FieldGroup>
      </Form>
      <p className="text-center text-ui text-fg-muted">
        {copy.haveAccount}{' '}
        <AuthLink to={signIn} className={footerLink}>
          {copy.signIn}
        </AuthLink>
      </p>
    </div>
  )
}

export { SignUpForm, signUpSchema }
export type { SignUpFormProps, SignupValues }
