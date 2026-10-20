'use client'

import { PresenceItem, PresenceList } from '@youj/motion'
import { MailIcon, XIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { cn } from '../../../lib/utils'
import { INVITE_TTL, demo, roleLabel, type TeamInvite, type TeamMembersCopy, type TeamRoleOption } from './data'

/** Invites still out: each can be sent again (which restarts its week) or revoked. */
export function InvitesList({
  invites,
  roles,
  copy,
  onResendInvite,
  onResend,
  onRevoke,
}: {
  invites: TeamInvite[]
  roles: TeamRoleOption[]
  copy: TeamMembersCopy
  /** Sends the invite again; default a demo wait. */
  onResendInvite?: (invite: TeamInvite) => Promise<unknown> | unknown
  onResend: (invite: TeamInvite) => void
  onRevoke: (invite: TeamInvite) => void
}) {
  return (
    <PresenceList as="ul" aria-label={copy.invitesLabel} className="flex flex-col text-ui">
      {invites.map((invite) => {
        const left = INVITE_TTL - invite.sent
        return (
          <PresenceItem as="li" key={invite.id} className="border-b border-line last:border-b-0">
            <div className="flex items-center gap-3 px-4 py-2.5">
              <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full border border-dashed border-line text-fg-muted">
                <MailIcon size={12} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-medium text-fg">{invite.email}</span>
                  <Badge variant="outline" className="shrink-0">
                    {roleLabel(invite.role, roles)}
                  </Badge>
                </span>
                <span className="truncate text-ui-sm text-fg-muted">
                  {copy.invitedBy(invite.invitedBy)}
                  <span className={cn(left <= 1 && 'text-warning-text')}>{left <= 0 ? copy.expiresToday : copy.expiresIn(left)}</span>
                </span>
              </div>
              <AsyncButton
                variant="ghost"
                size="sm"
                aria-label={copy.resendTo(invite.email)}
                pendingLabel={copy.sending}
                successLabel={copy.sent}
                onAction={async () => {
                  await (onResendInvite ? onResendInvite(invite) : demo('TeamMembers: onResendInvite', 700))
                  onResend(invite)
                }}
              >
                {copy.resend}
              </AsyncButton>
              <Button variant="ghost" size="icon-sm" aria-label={copy.revokeTo(invite.email)} onClick={() => onRevoke(invite)}>
                <XIcon size={16} />
              </Button>
            </div>
          </PresenceItem>
        )
      })}
    </PresenceList>
  )
}
