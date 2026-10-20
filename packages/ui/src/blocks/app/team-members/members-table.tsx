'use client'

import { PresenceItem, PresenceList } from '@youj/motion'
import { CopyIcon, LockIcon, MoreHorizontalIcon, UserMinusIcon } from '@youj/icons'
import { Avatar, AvatarBadge, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Table, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { cn } from '../../../lib/utils'
import { assignable, initials, lastActive, roleLabel, type TeamMember, type TeamMembersCopy, type TeamRole, type TeamRoleOption } from './data'

export function MembersTable({
  members,
  roles,
  copy,
  onRoleChange,
  onRemove,
}: {
  members: TeamMember[]
  roles: TeamRoleOption[]
  copy: TeamMembersCopy
  onRoleChange: (member: TeamMember, role: TeamRole) => void
  onRemove: (member: TeamMember) => void
}) {
  const options = assignable(roles)
  // PresenceList rows animate height, so borders live on the cells of a separated table.
  const cell = 'border-b border-line py-2.5 [tr:last-child>&]:border-b-0'
  return (
    <Table className="table-fixed border-separate border-spacing-0" aria-label={copy.tableLabel}>
      <TableHeader>
        <TableRow>
          <TableHead className="ps-4">{copy.memberColumn}</TableHead>
          <TableHead className="w-28 max-md:hidden">{copy.lastActiveColumn}</TableHead>
          <TableHead className="w-32 sm:w-36">{copy.roleColumn}</TableHead>
          <TableHead className="w-12 pe-3">
            <span className="sr-only">{copy.actionsColumn}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <PresenceList as="tbody">
        {members.map((m) => {
          const locked = m.role === 'owner'
          return (
            <PresenceItem as="tr" key={m.id} className="bg-surface">
              <TableCell className={cn(cell, 'ps-4')}>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar size="sm">
                    <AvatarFallback>{initials(m.name)}</AvatarFallback>
                    {m.active === 0 && <AvatarBadge className="bg-success" />}
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate font-medium text-fg">{m.name}</span>
                      {m.you && <Badge variant="secondary">{copy.you}</Badge>}
                    </span>
                    <span className="truncate text-ui-sm text-fg-muted">{m.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className={cn(cell, 'text-ui-sm tabular-nums max-md:hidden', m.active === 0 ? 'text-success-text' : 'text-fg-muted')}>
                {lastActive(m.active, copy)}
              </TableCell>
              <TableCell className={cell}>
                {locked ? (
                  // Ownership moves through its own flow, so the owner's role is a label, not a disabled control.
                  <span className="inline-flex h-control-sm items-center gap-1.5 px-2.5 text-ui text-fg-muted">
                    {roleLabel(m.role, roles)}
                    <LockIcon size={12} aria-hidden className="shrink-0" />
                  </span>
                ) : (
                  <Select items={options} value={m.role} onValueChange={(value) => value !== m.role && onRoleChange(m, value as TeamRole)}>
                    <SelectTrigger size="sm" aria-label={copy.roleFor(m.name)} className="w-full">
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
                )}
              </TableCell>
              <TableCell className={cn(cell, 'pe-3 text-end')}>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.actionsFor(m.name)} />}>
                    <MoreHorizontalIcon size={16} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigator.clipboard?.writeText(m.email).catch(() => {})}>
                      <CopyIcon size={14} /> {copy.copyEmail}
                    </DropdownMenuItem>
                    {!locked && !m.you && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="danger" onClick={() => onRemove(m)}>
                          <UserMinusIcon size={14} /> {copy.removeMember}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </PresenceItem>
          )
        })}
      </PresenceList>
    </Table>
  )
}
