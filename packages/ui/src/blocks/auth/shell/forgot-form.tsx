'use client'

import { useMemo, type Ref } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'
import { useYouj } from '@youj/core'
import { Button } from '../../../components/ui/button'
import { FieldGroup } from '../../../components/ui/field'
import { Form, FormField, FormSubmit } from '../../../components/ui/form'
import { Input } from '../../../components/ui/input'
import { InputOTPResend } from '../../../components/ui/input-otp'
import { AuthHeader, AuthTitle, MailIllustration } from '../shell'
import { AuthLink, footerLink } from './auth-link'
import { AUTH_COPY, type AuthAction, type AuthCopy } from './copy'

/* Ask for a reset link by email, then the confirmation that names the
 * address, offers a resend (held back by a countdown) and a way to fix a
 * typo. The response is the same whether or not the address has an account.
 * The bodies of the forgot-password page and of the auth flow's steps. */

const forgotSchema = (copy: AuthCopy) => z.object({ email: z.string().trim().min(1, copy.emailRequired).email(copy.emailInvalid) })
type ForgotValues = z.infer<ReturnType<typeof forgotSchema>>

/** The request form's state, held by its owner so the email survives a round trip to the confirmation. */
function useForgotForm(copy: AuthCopy = AUTH_COPY, defaultEmail = '') {
  const schema = useMemo(() => forgotSchema(copy), [copy])
  return useForm<ForgotValues>({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { email: defaultEmail } })
}

interface ForgotFormProps {
  copy?: AuthCopy
  form: UseFormReturn<ForgotValues>
  onSend: (email: string) => Promise<unknown> | unknown
  /** Runs with the address once the check has landed. */
  onSent: (email: string) => void
  signIn: AuthAction
}

function ForgotForm({ copy = AUTH_COPY, form, onSend, onSent, signIn }: ForgotFormProps) {
  const k = useYouj()
  return (
    <div className="flex flex-col gap-6">
      <AuthHeader title={copy.forgotTitle} description={copy.forgotDescription} />
      <Form form={form} onSubmit={(values) => onSend(values.email)} aria-label={copy.forgotTitle}>
        <FieldGroup className="gap-5">
          <FormField name="email" label={copy.email} description={copy.forgotEmailHint} required>
            {(field) => <Input type="email" autoComplete="email" placeholder={copy.emailPlaceholder} {...field} />}
          </FormField>
          <FormSubmit
            size="lg"
            className="w-full"
            pendingLabel={copy.sending}
            successLabel={copy.sent}
            errorLabel={copy.sendError}
            onActionStateChange={(state) => {
              if (state !== 'success') return
              // Let the check land before the confirmation takes over.
              setTimeout(() => onSent(form.getValues('email').trim()), k.ms('deliberate'))
            }}
          >
            {copy.sendResetLink}
          </FormSubmit>
        </FieldGroup>
      </Form>
      <p className="text-center text-ui text-fg-muted">
        {copy.remembered}{' '}
        <AuthLink to={signIn} className={footerLink}>
          {copy.backToSignIn}
        </AuthLink>
      </p>
    </div>
  )
}

interface CheckEmailProps {
  copy?: AuthCopy
  email: string
  onResend: () => unknown
  onChangeEmail: () => void
  headingRef?: Ref<HTMLHeadingElement>
}

function CheckEmail({ copy = AUTH_COPY, email, onResend, onChangeEmail, headingRef }: CheckEmailProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <MailIllustration />
      <div className="flex flex-col gap-1.5">
        <AuthTitle ref={headingRef} focusable>
          {copy.checkEmailTitle}
        </AuthTitle>
        <p className="text-ui text-fg-muted">
          {copy.checkEmailBefore}
          <span className="font-medium break-all text-fg">{email}</span>
          {copy.checkEmailAfter}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <InputOTPResend variant="outline" size="lg" className="w-full" onResend={onResend}>
          {copy.resendLink}
        </InputOTPResend>
        <Button variant="ghost" size="lg" className="w-full" onClick={onChangeEmail}>
          {copy.differentEmail}
        </Button>
      </div>
    </div>
  )
}

export { CheckEmail, ForgotForm, useForgotForm }
export type { CheckEmailProps, ForgotFormProps, ForgotValues }
