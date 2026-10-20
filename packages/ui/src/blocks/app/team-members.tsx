'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { Collapse, Reveal } from '@youj/motion'
import { SearchIcon, UserPlusIcon, UsersIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { ConfirmDialog } from '../../components/ui/alert-dialog'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { toast, Toaster } from '../../components/ui/toast'
import { cn } from '../../lib/utils'
import {
  DEFAULT_COPY,
  demo,
  INVITES,
  MEMBERS,
  roleLabel,
  ROLES,
  SEATS,
  type TeamInvite,
  type TeamMember,
  type TeamMembersCopy,
  type TeamRole,
  type TeamRoleOption,
} from './team-members/data'
import { InviteDialog } from './team-members/invite-dialog'
import { InvitesList } from './team-members/invites-list'
import { MembersTable } from './team-members/members-table'
import { Seats } from './team-members/seats'

/* Halyard's members page: who is in the workspace, what they can do, and who
 * is still invited. A seat strip counts members and invites against the plan
 * (a Counter and a Progress). Members sit in a table with a role Select per
 * row; the owner's role is locked. Search and a role filter narrow it, and
 * removing someone asks first (ConfirmDialog), then offers Undo in a toast.
 * Invites go out in batches: addresses become tags, checked as they land and
 * capped by the free seats; they slide into the pending list, where each can
 * be resent (Button onAction) or revoked. Rows enter and leave through
 * PresenceList; the pending section folds away (Collapse) when it empties.
 * Pass your own `members`, `invites`, `roles` and `brand`, and wire `onInvite`,
 * `onRoleChange`, `onRemoveMember`, `onResendInvite` and `onRevokeInvite` to
 * your members API (demo fallbacks, which warn once in development, stand in until you do); every string is
 * in `copy`. Reduced motion: rows, numbers and sections change in place.
 * It is built for the compact layout density (ui.css), taken from the page. */

interface TeamMembersProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with no top bar of its own. Default true; `false` draws its own page (the top bar and a centered canvas). */
  embedded?: boolean
  /** The workspace people are invited to, in the copy. Default 'Halyard'. */
  workspace?: string
  /** Seats the plan pays for. Default 12. */
  seats?: number
  /** The product in the top bar and the copy; its name overrides `workspace`. Default: `workspace`, with its initial as the logo. */
  brand?: { name: string; logo?: ReactNode }
  /** The people in the workspace, in order. Mark the signed-in person `you`. Default: Halyard's eight. */
  members?: TeamMember[]
  /** Invites still out. Default: the demo's two. */
  invites?: TeamInvite[]
  /** The roles, most powerful first; `owner` is never offered. Default: Owner, Admin, Member, Viewer. */
  roles?: TeamRoleOption[]
  /** The page title's level; section headings sit one below. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Shows skeleton rows in place of the table while members load. Default false. */
  loading?: boolean
  /** A load failure, shown above the table with a Retry button when `onRetry` is set. */
  error?: ReactNode
  /** Called from the error's Retry button. */
  onRetry?: () => void
  /** Replaces the empty state shown when there are no members. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<TeamMembersCopy>
  /** Sends a batch of invites; they join the pending list once it resolves, and a rejection's message shows in the dialog. Default: a demo wait. */
  onInvite?: (invite: { emails: string[]; role: TeamRole }) => Promise<unknown> | unknown
  /** Changes a member's role. The row changes at once; a rejection puts it back. */
  onRoleChange?: (member: TeamMember, role: TeamRole) => Promise<unknown> | unknown
  /** Removes a member after the confirmation; the row leaves once it resolves. Without it, the demo offers Undo. */
  onRemoveMember?: (member: TeamMember) => Promise<unknown> | unknown
  /** Sends an invite again, restarting its week. Default: a demo wait. */
  onResendInvite?: (invite: TeamInvite) => Promise<unknown> | unknown
  /** Revokes an invite; the row leaves once it resolves. Without it, the demo offers Undo. */
  onRevokeInvite?: (invite: TeamInvite) => Promise<unknown> | unknown
}

const failed = (failure: unknown) => failure instanceof Error && failure.message && toast.error(failure.message)

function TeamMembers({
  theme,
  embedded = true,
  workspace: workspaceName = 'Halyard',
  seats = SEATS,
  brand,
  members: initialMembers = MEMBERS,
  invites: initialInvites = INVITES,
  roles = ROLES,
  headingLevel = 1,
  loading = false,
  error,
  onRetry,
  empty,
  copy: copyProp,
  onInvite,
  onRoleChange,
  onRemoveMember,
  onResendInvite,
  onRevokeInvite,
  className,
  ...rest
}: TeamMembersProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const workspace = brand?.name ?? workspaceName
  const titleId = useId()
  const Title = `h${headingLevel}` as const
  const Heading = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  const [members, setMembers] = useState(initialMembers)
  const [invites, setInvites] = useState(initialInvites)
  // New data from the app (after `loading`, or a refetch) replaces the rows.
  const [source, setSource] = useState({ initialMembers, initialInvites })
  if (source.initialMembers !== initialMembers || source.initialInvites !== initialInvites) {
    setSource({ initialMembers, initialInvites })
    setMembers(initialMembers)
    setInvites(initialInvites)
  }
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<TeamRole | 'all'>('all')
  const [inviting, setInviting] = useState(false)
  const [removing, setRemoving] = useState<TeamMember>()
  const filters = [{ value: 'all', label: copy.allRoles }, ...roles]
  const label = (role: TeamRole) => roleLabel(role, roles)

  const q = query.trim().toLowerCase()
  const shown = members.filter((m) => (filter === 'all' || m.role === filter) && (!q || m.name.toLowerCase().includes(q) || m.email.includes(q)))
  const seatsLeft = Math.max(0, seats - members.length - invites.length)

  const setRole = (member: TeamMember, role: TeamRole) => setMembers((list) => list.map((m) => (m.id === member.id ? { ...m, role } : m)))
  const changeRole = async (member: TeamMember, role: TeamRole) => {
    setRole(member, role)
    try {
      await onRoleChange?.(member, role)
    } catch (failure) {
      setRole(member, member.role)
      failed(failure)
      return
    }
    toast.success(copy.roleChanged(member.name, label(role)))
  }
  const revoke = async (invite: TeamInvite) => {
    try {
      await onRevokeInvite?.(invite)
    } catch (failure) {
      failed(failure)
      return
    }
    setInvites((list) => list.filter((i) => i.id !== invite.id))
    const undo = onRevokeInvite ? undefined : { label: copy.undo, onClick: () => setInvites((list) => [...list, invite]) }
    toast(copy.revoked(invite.email), { action: undo })
  }

  const invite = (
    <Button onClick={() => setInviting(true)}>
      <UserPlusIcon size={16} /> {copy.invitePeople}
    </Button>
  )

  const content = (
    <>
      <Seats members={members.length} invites={invites.length} seats={seats} copy={copy} />

      {error && (
        <Alert variant="danger">
          <AlertTitle>{copy.errorTitle}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          {onRetry && (
            <AlertAction>
              <Button size="sm" variant="outline" onClick={onRetry}>
                {copy.retry}
              </Button>
            </AlertAction>
          )}
        </Alert>
      )}

      {/* The team's height at an app's size: a search or a role filter scrolls the members in it, never resizing the page. */}
      <section aria-labelledby={`${titleId}-members`} className="flex h-137.5 flex-col overflow-hidden rounded-lg border border-line bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <Heading id={`${titleId}-members`} className="me-auto flex items-center gap-2 text-ui font-medium text-fg">
            {copy.teamHeading} <Badge variant="secondary">{members.length}</Badge>
          </Heading>
          <InputGroup className="w-full sm:w-56">
            <InputGroupAddon>
              <SearchIcon size={14} />
            </InputGroupAddon>
            <InputGroupInput type="search" aria-label={copy.searchLabel} placeholder={copy.searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
          </InputGroup>
          <Select items={filters} value={filter} onValueChange={(value) => setFilter(value as TeamRole | 'all')}>
            <SelectTrigger aria-label={copy.filterLabel} className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filters.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto yj-scrollbar">
          {loading ? (
            <div aria-busy className="flex flex-col">
              <span className="sr-only">{copy.loading}</span>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                  <Skeleton className="h-control-sm w-32" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            (empty ?? (
              <Empty className="py-10">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersIcon />
                  </EmptyMedia>
                  <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                  <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ))
          ) : shown.length > 0 ? (
            <MembersTable members={shown} roles={roles} copy={copy} onRoleChange={changeRole} onRemove={setRemoving} />
          ) : (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>{copy.noMatchTitle}</EmptyTitle>
                <EmptyDescription>{q ? copy.noMatch(query.trim(), filter === 'all' ? undefined : label(filter)) : copy.noRole(label(filter))}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery('')
                    setFilter('all')
                  }}
                >
                  {copy.clearFilters}
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </div>
      </section>

      <Collapse open={invites.length > 0}>
        <section aria-labelledby={`${titleId}-invites`} className="overflow-hidden rounded-lg border border-line bg-surface">
          <Heading id={`${titleId}-invites`} className="flex items-center gap-2 border-b border-line px-4 py-3 text-ui font-medium text-fg">
            {copy.invitesHeading} <Badge variant="secondary">{invites.length}</Badge>
          </Heading>
          <InvitesList
            invites={invites}
            roles={roles}
            copy={copy}
            onResendInvite={onResendInvite}
            onResend={(invite) => {
              setInvites((list) => list.map((i) => (i.id === invite.id ? { ...i, sent: 0 } : i)))
              toast.success(copy.resent(invite.email))
            }}
            onRevoke={revoke}
          />
        </section>
      </Collapse>
    </>
  )

  const overlays = (
    <>
      <InviteDialog
        open={inviting}
        onOpenChange={setInviting}
        seatsLeft={seatsLeft}
        workspace={workspace}
        roles={roles}
        copy={copy}
        taken={[...members.map((m) => m.email), ...invites.map((i) => i.email)]}
        onSend={onInvite}
        onInvite={(emails, role) => {
          const invitedBy = members.find((m) => m.you)?.name ?? ''
          setInvites((list) => [...list, ...emails.map((email, n) => ({ id: `i${Date.now()}-${n}`, email: email.toLowerCase(), role, invitedBy, sent: 0 }))])
          toast.success(copy.invitedToast(emails), { description: copy.invitedAs(label(role)) })
        }}
      />
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(next) => !next && setRemoving(undefined)}
        destructive
        title={copy.removeTitle(removing?.name ?? '', workspace)}
        description={copy.removeDescription}
        confirmLabel={copy.removeConfirm}
        pendingLabel={copy.removing}
        onConfirm={async () => {
          const gone = removing
          if (!gone) return
          await (onRemoveMember ? onRemoveMember(gone) : demo('TeamMembers: onRemoveMember', 600))
          const at = members.findIndex((m) => m.id === gone.id)
          setMembers((list) => list.filter((m) => m.id !== gone.id))
          const undo = onRemoveMember ? undefined : { label: copy.undo, onClick: () => setMembers((list) => [...list.slice(0, at), gone, ...list.slice(at)]) }
          toast(copy.removed(gone.name), { action: undo })
        }}
      />
      <Toaster />
    </>
  )

  if (embedded) {
    const view = (
      <AppPage
        {...rest}
        title={copy.title}
        description={copy.description(workspace)}
        actions={invite}
        headingLevel={headingLevel}
        width="fill"
        className={cn('text-fg', className)}
      >
        {content}
        {overlays}
      </AppPage>
    )
    return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
  }
  return (
    <ThemeScope theme={theme}>
      <div {...rest} className={cn('min-h-dvh bg-canvas text-fg', className)}>
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 md:px-8">
            {brand?.logo ?? (
              <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-ui-sm font-semibold text-on-accent">
                {workspace.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="font-semibold tracking-tight">{workspace}</span>
            <span aria-hidden className="text-fg-muted">/</span>
            <span className="truncate text-fg-muted">{copy.breadcrumb}</span>
            <Badge variant="outline" className="ms-auto">
              {copy.plan}
            </Badge>
          </div>
        </header>
        <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8 md:px-8">
          <Reveal inView={false} variant="rise" className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <Title className="text-xl font-semibold tracking-tight text-fg">{copy.title}</Title>
              <p className="text-ui text-fg-muted">{copy.description(workspace)}</p>
            </div>
            {invite}
          </Reveal>
          {content}
        </main>
        {overlays}
      </div>
    </ThemeScope>
  )
}

export { TeamMembers, type TeamMembersProps, type TeamMembersCopy, type TeamMember, type TeamInvite, type TeamRole, type TeamRoleOption }
