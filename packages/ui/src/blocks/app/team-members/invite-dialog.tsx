'use client'

import { useState } from 'react'
import { useYouj } from '@youj/core'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { TagInput } from '../../../components/ui/tag-input'
import { assignable, demo, EMAIL, type TeamMembersCopy, type TeamRole, type TeamRoleOption } from './data'

/**
 * Invite several people at once: addresses become tags (Enter, comma or a
 * pasted list), each checked as it lands. Everyone gets the same role. The
 * free seats cap how many can go out; the send button says how many it sends.
 */
export function InviteDialog({
  open,
  onOpenChange,
  seatsLeft,
  taken,
  workspace,
  roles,
  copy,
  onSend,
  onInvite,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  seatsLeft: number
  /** Addresses already in the team or invited. */
  taken: string[]
  workspace: string
  roles: TeamRoleOption[]
  copy: TeamMembersCopy
  /** Sends the invites; resolve when sent, throw to show the message. Default: a demo wait. */
  onSend?: (invite: { emails: string[]; role: TeamRole }) => Promise<unknown> | unknown
  onInvite: (emails: string[], role: TeamRole) => void
}) {
  const options = assignable(roles)
  const firstRole = options.find((r) => r.value === 'member')?.value ?? options[0]?.value ?? ''
  const k = useYouj()
  const [emails, setEmails] = useState<string[]>([])
  const [role, setRole] = useState<TeamRole>(firstRole)
  const [error, setError] = useState<string>()
  const over = emails.length > seatsLeft
  const count = emails.length

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(next) => {
        if (next) return
        setEmails([])
        setRole(firstRole)
        setError(undefined)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.inviteTitle(workspace)}</DialogTitle>
          <DialogDescription>{copy.inviteDescription}</DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-5">
          <Field invalid={!!error || over}>
            <FieldLabel>{copy.emailsLabel}</FieldLabel>
            <TagInput
              value={emails}
              onValueChange={(next) => {
                setEmails(next)
                setError(undefined)
              }}
              validate={(tag, tags) => {
                const email = tag.toLowerCase()
                if (!EMAIL.test(email)) return copy.notEmail(tag)
                if (taken.includes(email)) return copy.alreadyIn(tag, workspace)
                if (tags.includes(email)) return copy.alreadyListed(tag)
              }}
              placeholder={count ? copy.addAnother : copy.emailsPlaceholder}
            />
            <FieldDescription>{copy.emailsHint}</FieldDescription>
            <FieldError>
              {error ?? (over ? copy.seatsShort(seatsLeft, count - seatsLeft) : undefined)}
            </FieldError>
          </Field>
          <Field>
            <FieldLabel>{copy.roleLabel}</FieldLabel>
            <Select items={options} value={role} onValueChange={(value) => setRole(value as TeamRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>{options.find((r) => r.value === role)?.blurb}</FieldDescription>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {copy.cancel}
          </Button>
          <AsyncButton
            pendingLabel={copy.sending}
            successLabel={copy.invitesSent(count)}
            onClick={(event) => {
              // Check before the action runs, so a corrected list can be sent straight away.
              if (count === 0) setError(copy.addOne)
              if (count === 0 || over) event.preventDefault()
            }}
            onAction={async () => {
              try {
                await (onSend ? onSend({ emails, role }) : demo('TeamMembers: onInvite', 800))
              } catch (failure) {
                if (failure instanceof Error && failure.message) setError(failure.message)
                throw failure
              }
              onInvite(emails, role)
            }}
            onActionStateChange={(state) => {
              // Let the success label land, then close; the invites slide into the list.
              if (state === 'success') setTimeout(() => onOpenChange(false), k.ms('deliberate'))
            }}
          >
            {copy.sendInvites(count)}
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
