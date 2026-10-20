'use client'

import { useId, useMemo, useState, type ReactNode, type Ref } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useYouj } from '@youj/core'
import { CheckCircleIcon } from '@youj/icons'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Button, buttonVariants } from '../../../components/ui/button'
import { EmptyMedia } from '../../../components/ui/empty'
import { FieldGroup } from '../../../components/ui/field'
import { Form, FormField, FormSubmit } from '../../../components/ui/form'
import { defaultPasswordRequirements, PasswordInput, PasswordRequirements, PasswordStrength } from '../../../components/ui/password-input'
import { AuthHeader, AuthTitle } from '../shell'
import { AUTH_COPY, type AuthAction, type AuthCopy } from './copy'
import { reason } from './sign-in-form'

/* Choose a new password from a reset link: the strength meter and rules
 * track it as it's typed, the confirmation must match, and an expired link
 * says so above the form. Then the confirmation, with the way back to sign
 * in. The bodies of the reset-password page and of the auth flow's steps. */

const resetSchema = (copy: AuthCopy) =>
  z
    .object({
      password: z.string().refine((p) => defaultPasswordRequirements.every((rule) => rule.test(p)), copy.passwordRules),
      confirm: z.string().min(1, copy.confirmRequired),
    })
    .refine((v) => v.password === v.confirm, { path: ['confirm'], message: copy.mismatch })
type ResetValues = z.infer<ReturnType<typeof resetSchema>>

interface ResetFormProps {
  copy?: AuthCopy
  /** The account the link is for, named in the description. */
  email?: string
  onReset: (password: string) => Promise<unknown>
  /** Runs once the check has landed. */
  onDone: () => void
  /** A server error to show above the form until the next attempt (an expired link, say). */
  error?: ReactNode
}

function ResetForm({ copy = AUTH_COPY, email, onReset, onDone, error }: ResetFormProps) {
  const k = useYouj()
  const rulesId = useId()
  const [failure, setFailure] = useState<ReactNode>(error ?? null)
  const [errorFor, setErrorFor] = useState(error)
  if (errorFor !== error) {
    setErrorFor(error)
    setFailure(error ?? null)
  }
  const schema = useMemo(() => resetSchema(copy), [copy])
  const form = useForm<ResetValues>({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { password: '', confirm: '' } })

  const reset = async (values: ResetValues) => {
    setFailure(null)
    try {
      await onReset(values.password)
    } catch (error) {
      setFailure(reason(error, copy))
      throw error
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <AuthHeader title={copy.resetTitle} description={copy.resetDescription(email)} />
      <Form form={form} onSubmit={reset} aria-label={copy.resetTitle}>
        <FieldGroup className="gap-5">
          <Alert variant="danger" open={failure !== null}>
            <AlertTitle>{copy.resetFailed}</AlertTitle>
            <AlertDescription>{failure}</AlertDescription>
          </Alert>
          <FormField name="password" label={copy.newPassword} required>
            {(field) => (
              <>
                <PasswordInput autoComplete="new-password" aria-describedby={rulesId} {...field} />
                <PasswordStrength value={field.value} />
                <PasswordRequirements id={rulesId} value={field.value} />
              </>
            )}
          </FormField>
          <FormField name="confirm" label={copy.confirmPassword} required>
            {(field) => <PasswordInput autoComplete="new-password" {...field} />}
          </FormField>
          <FormSubmit
            size="lg"
            className="w-full"
            pendingLabel={copy.saving}
            successLabel={copy.saved}
            errorLabel={copy.saveError}
            onActionStateChange={(state) => {
              if (state === 'success') setTimeout(onDone, k.ms('deliberate'))
            }}
          >
            {copy.updatePassword}
          </FormSubmit>
        </FieldGroup>
      </Form>
    </div>
  )
}

interface ResetDoneProps {
  copy?: AuthCopy
  signIn: AuthAction
  headingRef?: Ref<HTMLHeadingElement>
}

function ResetDone({ copy = AUTH_COPY, signIn, headingRef }: ResetDoneProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <EmptyMedia variant="icon" className="mb-0 size-16">
        <CheckCircleIcon trigger="mount" size={28} strokeWidth={1.5} className="size-7 text-success" />
      </EmptyMedia>
      <div className="flex flex-col gap-1.5">
        <AuthTitle ref={headingRef} focusable>
          {copy.resetDoneTitle}
        </AuthTitle>
        <p className="text-ui text-fg-muted">{copy.resetDoneDescription}</p>
      </div>
      {'href' in signIn ? (
        <a href={signIn.href} className={buttonVariants({ size: 'lg', className: 'w-full' })}>
          {copy.continueToSignIn}
        </a>
      ) : (
        <Button size="lg" className="w-full" onClick={signIn.onClick}>
          {copy.continueToSignIn}
        </Button>
      )}
    </div>
  )
}

export { ResetDone, ResetForm, resetSchema }
export type { ResetDoneProps, ResetFormProps, ResetValues }
