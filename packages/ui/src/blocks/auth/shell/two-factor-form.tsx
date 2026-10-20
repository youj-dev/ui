'use client'

import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../../components/ui/field'
import { InputOTP, InputOTPResend, useOTPVerification } from '../../../components/ui/input-otp'
import { AuthHeader } from '../shell'
import { AuthLink } from './auth-link'
import { AUTH_COPY, type AuthAction, type AuthCopy } from './copy'

/* The second factor: a six-digit code from an authenticator app or a text
 * message. Filling the last slot verifies it at once (no submit button): the
 * slots lock with a spinner, then turn green left to right as a check draws,
 * or shake and clear for another try. "Resend" is held back by a countdown.
 * A recovery code (two groups of four letters and digits) is the way in when
 * the phone isn't at hand. The body of the two-factor page and of the auth
 * flow's step. */

type CodeKind = 'totp' | 'recovery'

interface TwoFactorFormProps {
  copy?: AuthCopy
  /** Resolve true (or nothing) for a good code, false or throw for a bad one. */
  onVerify: (code: string, kind: CodeKind) => unknown
  onResend: () => unknown
  /** Runs once a code is accepted. */
  onVerified?: () => void
  /** Where the code went, e.g. "•••• 4821". */
  destination: string
  signOut: AuthAction
}

function TwoFactorForm({ copy = AUTH_COPY, onVerify, onResend, onVerified, destination, signOut }: TwoFactorFormProps) {
  const [kind, setKind] = useState<CodeKind>('totp')
  return (
    <div className="flex flex-col gap-6">
      <AuthHeader title={copy.twoFactorTitle} description={kind === 'totp' ? copy.twoFactorDescription(destination) : copy.recoveryDescription} />
      {/* Keyed, so switching starts a fresh attempt. */}
      <CodeField key={kind} copy={copy} kind={kind} onVerify={onVerify} onResend={onResend} onVerified={onVerified} />
      <div className="flex flex-col items-center gap-2 border-t border-line pt-5 text-center text-ui text-fg-muted">
        <Button variant="link" size="sm" className="h-auto px-0" onClick={() => setKind(kind === 'totp' ? 'recovery' : 'totp')}>
          {kind === 'totp' ? copy.useRecovery : copy.useApp}
        </Button>
        <AuthLink to={signOut} className="rounded-sm text-ui-sm underline-offset-4 focus-ring hover:text-fg hover:underline">
          {copy.someoneElse}
        </AuthLink>
      </div>
    </div>
  )
}

function CodeField({ copy, kind, onVerify, onResend, onVerified }: Pick<TwoFactorFormProps, 'onVerify' | 'onResend' | 'onVerified'> & { copy: AuthCopy; kind: CodeKind }) {
  const otp = useOTPVerification((code) => onVerify(code, kind), { onVerified: onVerified && (() => onVerified()) })
  const recovery = kind === 'recovery'
  return (
    <div className="flex flex-col gap-4">
      <Field invalid={otp.status === 'error'}>
        <FieldLabel>{recovery ? copy.recoveryCode : copy.verificationCode}</FieldLabel>
        <InputOTP
          {...otp.field}
          autoFocus
          length={recovery ? 8 : 6}
          groups={recovery ? [4, 4] : [3, 3]}
          mode={recovery ? 'alphanumeric' : 'numeric'}
          statusLabels={{ verifying: copy.codeChecking, success: copy.codeVerified, error: copy.codeFailed }}
        />
        <FieldError>{otp.status === 'error' ? copy.codeFailedHint : undefined}</FieldError>
        {otp.status === 'success' && <FieldDescription className="text-success-text">{copy.codeVerifiedHint}</FieldDescription>}
      </Field>
      {!recovery && (
        <div className="flex items-center justify-between gap-3 text-ui-sm text-fg-muted">
          <span>{copy.noText}</span>
          <InputOTPResend onResend={onResend} />
        </div>
      )}
    </div>
  )
}

export { TwoFactorForm }
export type { CodeKind, TwoFactorFormProps }
