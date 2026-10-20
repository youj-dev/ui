'use client'

import { useState } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { MoreHorizontalIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Table, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Skeleton } from '../../../components/ui/skeleton'
import { initials, type SettingsCopy, type SettingsMember, type SettingsRole } from './data'
import { InviteDialog, type InviteDialogProps } from './invite-dialog'

export interface TeamTabProps {
  copy: SettingsCopy
  members: SettingsMember[]
  roles: SettingsRole[]
  workspace: string
  loading?: boolean
  onInvite?: InviteDialogProps['onInvite']
  onRoleChange?: (member: SettingsMember, role: string) => Promise<unknown> | unknown
  onRemoveMember?: (member: SettingsMember) => Promise<unknown> | unknown
  onResendInvite?: (member: SettingsMember) => Promise<unknown> | unknown
}

export function TeamTab({ copy, members: initialMembers, roles, workspace, loading, onInvite, onRoleChange, onRemoveMember, onResendInvite }: TeamTabProps) {
  const [members, setMembers] = useState(initialMembers)
  const setRole = (member: SettingsMember, role: string) => {
    setMembers((list) => list.map((m) => (m.id === member.id ? { ...m, role } : m)))
    onRoleChange?.(member, role)
  }
  const remove = async (member: SettingsMember) => {
    try {
      await onRemoveMember?.(member)
    } catch {
      return // The row stays; the app reports why.
    }
    setMembers((list) => list.filter((x) => x.id !== member.id))
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.teamTitle}</CardTitle>
        <CardDescription>{loading ? copy.loading : copy.teamCount(members.length, workspace)}</CardDescription>
        <CardAction>
          <InviteDialog
            copy={copy}
            roles={roles}
            workspace={workspace}
            onInvite={onInvite}
            onInvited={(email, role) =>
              setMembers((list) => [...list, { id: `invite-${email}-${list.length}`, name: email.split('@')[0] ?? email, email, role, invited: true }])
            }
          />
        </CardAction>
      </CardHeader>
      <CardContent className="px-0" aria-busy={loading || undefined}>
        {!loading && members.length === 0 ? (
          <p className="px-5 py-6 text-center text-ui text-fg-muted">{copy.emptyTeam}</p>
        ) : (
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="ps-5">{copy.memberColumn}</TableHead>
                <TableHead className="w-36 max-sm:w-28">{copy.roleColumn}</TableHead>
                <TableHead className="w-14 pe-5">
                  <span className="sr-only">{copy.actionsColumn}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <PresenceList as="tbody">
              {loading
                ? [0, 1, 2].map((i) => (
                    <PresenceItem as="tr" key={`skeleton-${i}`} className="bg-surface">
                      <TableCell className="ps-5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-8 shrink-0 rounded-full" />
                          <div className="flex flex-1 flex-col gap-1.5">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-44" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-control-sm w-full" />
                      </TableCell>
                      <TableCell className="pe-5" />
                    </PresenceItem>
                  ))
                : members.map((m) => (
                    <PresenceItem as="tr" key={m.id} className="bg-surface">
                      <TableCell className="ps-5">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar size="sm">
                            <AvatarFallback>{initials(m.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col">
                            <span className="flex items-center gap-2 truncate font-medium text-fg">
                              <span className="truncate">{m.name}</span>
                              {m.invited && <Badge variant="secondary">{copy.invitedBadge}</Badge>}
                            </span>
                            <span className="truncate text-ui-sm text-fg-muted">{m.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select items={roles} value={m.role} onValueChange={(value) => setRole(m, value as string)} disabled={m.role === 'owner'}>
                          <SelectTrigger size="sm" aria-label={copy.roleFor(m.name)} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="pe-5 text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.actionsFor(m.name)} />} disabled={m.role === 'owner'}>
                            <MoreHorizontalIcon size={16} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {m.invited && <DropdownMenuItem onClick={() => onResendInvite?.(m)}>{copy.resendInvite}</DropdownMenuItem>}
                            <DropdownMenuItem variant="danger" onClick={() => remove(m)}>
                              {m.invited ? copy.revokeInvite : copy.removeMember}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </PresenceItem>
                  ))}
            </PresenceList>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
