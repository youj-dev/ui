'use client'

import { buttonVariants } from '../../../components/ui/button'
import { InputOTPResend } from '../../../components/ui/input-otp'
import { AuthTitle, MailIllustration } from '../shell'
import { AuthLink } from './auth-link'
import { AUTH_COPY, AUTH_LINKS, type AuthAction, type AuthCopy, type AuthLinks } from './copy'

/* After a passwordless sign-in: the link is in the mail. The envelope seals
 * itself and a check lands on it; the address is spelled out so a typo is
 * obvious; shortcuts open the common mail apps; "Resend" waits out a
 * countdown between sends, and a different address is one step back. The
 * body of the magic-link page and of the auth flow's step. */

interface MagicLinkSentProps {
  copy?: AuthCopy
  email: string
  onResend: () => unknown
  changeEmail: AuthAction
  /** The mail apps the shortcuts open. Default: Gmail's and Outlook's web inboxes. */
  mail?: Pick<AuthLinks, 'gmail' | 'outlook'>
}

function MagicLinkSent({ copy = AUTH_COPY, email, onResend, changeEmail, mail = AUTH_LINKS }: MagicLinkSentProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <MailIllustration />
      <div className="flex flex-col gap-1.5">
        <AuthTitle>{copy.inboxTitle}</AuthTitle>
        <p className="text-ui text-fg-muted">
          {copy.inboxBefore}
          <span className="font-medium break-all text-fg">{email}</span>
          {copy.inboxAfter}
        </p>
      </div>
      <div className="grid w-full grid-cols-2 gap-2">
        <a href={mail.gmail} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'secondary' })}>
          {copy.openGmail}
        </a>
        <a href={mail.outlook} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'secondary' })}>
          {copy.openOutlook}
        </a>
      </div>
      <div className="flex w-full flex-col items-center gap-1 border-t border-line pt-5 text-ui-sm text-fg-muted">
        <span>{copy.nothingYet}</span>
        <InputOTPResend onResend={onResend}>{copy.sendAnother}</InputOTPResend>
        <AuthLink to={changeEmail} className="rounded-sm underline-offset-4 focus-ring hover:text-fg hover:underline">
          {copy.differentEmail}
        </AuthLink>
      </div>
    </div>
  )
}

export { MagicLinkSent }
export type { MagicLinkSentProps }
