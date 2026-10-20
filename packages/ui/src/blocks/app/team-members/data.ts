/* Halyard's team: the people in the workspace, the invites still out, and the
 * seats the plan pays for. Pass yours through the block's props. */

/** A role's value, e.g. `admin`. `owner` is special: its row is locked and it's never offered in an invite or role change. */
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer' | (string & {})
export type Role = TeamRole

export interface TeamRoleOption {
  value: TeamRole
  label: string
  /** What the role can do, under the invite's role picker. */
  blurb?: string
}

export const ROLES: TeamRoleOption[] = [
  { value: 'owner', label: 'Owner', blurb: 'Billing, security and everything admins can do.' },
  { value: 'admin', label: 'Admin', blurb: 'Manage members, projects and integrations.' },
  { value: 'member', label: 'Member', blurb: 'Create and edit projects they can see.' },
  { value: 'viewer', label: 'Viewer', blurb: 'Read-only access. Can comment.' },
]

/** Roles an invite or a role change can grant: ownership moves through its own flow. */
export const assignable = (roles: TeamRoleOption[]) => roles.filter((r) => r.value !== 'owner')

export const roleLabel = (role: TeamRole, roles: TeamRoleOption[] = ROLES) => roles.find((r) => r.value === role)?.label ?? role

export interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  /** Minutes since last seen; 0 is online now. */
  active: number
  /** The signed-in person: marked You, can't be removed, and signs new invites. */
  you?: boolean
}
export type Member = TeamMember

export interface TeamInvite {
  id: string
  email: string
  role: Role
  invitedBy: string
  /** Days since it was sent. */
  sent: number
}
export type Invite = TeamInvite

export const SEATS = 12

export const MEMBERS: TeamMember[] = [
  { id: 'm1', name: 'Mara Okafor', email: 'mara@halyard.dev', role: 'owner', active: 0, you: true },
  { id: 'm2', name: 'Theo Lindqvist', email: 'theo@halyard.dev', role: 'admin', active: 12 },
  { id: 'm3', name: 'Priya Raman', email: 'priya@halyard.dev', role: 'member', active: 0 },
  { id: 'm4', name: 'Jonah Beck', email: 'jonah@halyard.dev', role: 'member', active: 60 * 5 },
  { id: 'm5', name: 'Aiko Tanaka', email: 'aiko@halyard.dev', role: 'member', active: 60 * 26 },
  { id: 'm6', name: 'Luis Ferreira', email: 'luis@halyard.dev', role: 'viewer', active: 60 * 24 * 9 },
  { id: 'm7', name: 'Sofia Marchetti', email: 'sofia@halyard.dev', role: 'admin', active: 45 },
  { id: 'm8', name: 'Kwame Asante', email: 'kwame@contractors.io', role: 'viewer', active: 60 * 24 * 3 },
]

export const INVITES: TeamInvite[] = [
  { id: 'i1', email: 'rhea@halyard.dev', role: 'member', invitedBy: 'Theo Lindqvist', sent: 2 },
  { id: 'i2', email: 'dan.oconnell@studio-north.com', role: 'viewer', invitedBy: 'Mara Okafor', sent: 6 },
]

/** Invites expire after a week. */
export const INVITE_TTL = 7

export const initials = (name: string) =>
  name
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')

export function lastActive(minutes: number, copy: Pick<TeamMembersCopy, 'online' | 'minutesAgo' | 'hoursAgo' | 'yesterday' | 'daysAgo'> = DEFAULT_COPY): string {
  if (minutes === 0) return copy.online
  if (minutes < 60) return copy.minutesAgo(minutes)
  if (minutes < 60 * 24) return copy.hoursAgo(Math.round(minutes / 60))
  const days = Math.round(minutes / (60 * 24))
  return days === 1 ? copy.yesterday : copy.daysAgo(days)
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export const DEFAULT_COPY = {
  title: 'Team members',
  description: (workspace: string) => `Manage who has access to ${workspace} and what they can change.`,
  breadcrumb: 'Settings',
  plan: 'Team plan',
  invitePeople: 'Invite people',
  teamHeading: 'Team',
  searchLabel: 'Search members',
  searchPlaceholder: 'Search members',
  filterLabel: 'Filter by role',
  allRoles: 'All roles',
  noMatchTitle: 'No one matches',
  noMatch: (query: string, role?: string) => `Nobody${role ? ` with the ${role} role` : ''} matches “${query}”.`,
  noRole: (role: string) => `No one has the ${role} role.`,
  clearFilters: 'Clear filters',
  emptyTitle: 'No members yet',
  emptyDescription: 'Invite your team to start working together.',
  loading: 'Loading members…',
  errorTitle: 'Couldn’t load members',
  retry: 'Retry',
  // Table
  tableLabel: 'Members',
  memberColumn: 'Member',
  lastActiveColumn: 'Last active',
  roleColumn: 'Role',
  actionsColumn: 'Actions',
  you: 'You',
  roleFor: (name: string) => `Role for ${name}`,
  actionsFor: (name: string) => `Actions for ${name}`,
  copyEmail: 'Copy email',
  removeMember: 'Remove from team…',
  online: 'Online',
  minutesAgo: (n: number) => `${n} min ago`,
  hoursAgo: (n: number) => `${n} h ago`,
  yesterday: 'Yesterday',
  daysAgo: (n: number) => `${n} days ago`,
  // Toasts and the remove confirmation
  roleChanged: (name: string, role: string) => `${name} is now ${/^[aeiou]/i.test(role) ? 'an' : 'a'} ${role}`,
  removeTitle: (name: string, workspace: string) => `Remove ${name} from ${workspace}?`,
  removeDescription: 'They lose access right away and their seat frees up. Their projects and comments stay.',
  removeConfirm: 'Remove member',
  removing: 'Removing',
  removed: (name: string) => `Removed ${name}`,
  undo: 'Undo',
  // Pending invites
  invitesHeading: 'Pending invites',
  invitesLabel: 'Pending invites',
  invitedBy: (name: string) => `Invited by ${name} · `,
  expiresToday: 'expires today',
  expiresIn: (days: number) => `expires in ${plural(days, 'day', 'days')}`,
  resend: 'Resend',
  resendTo: (email: string) => `Resend invite to ${email}`,
  sending: 'Sending…',
  sent: 'Sent',
  revokeTo: (email: string) => `Revoke invite to ${email}`,
  revoked: (email: string) => `Invite to ${email} revoked`,
  resent: (email: string) => `Invite sent again to ${email}`,
  invitedToast: (emails: string[]) => (emails.length === 1 ? `Invited ${emails[0]}` : `Invited ${emails.length} people`),
  invitedAs: (role: string) => `As ${role}`,
  // Seats
  seatsLabel: 'Seats',
  ofSeats: (seats: number) => `of ${seats} seats`,
  allSeatsTaken: 'All seats taken',
  seatsMeter: 'Seats used',
  seatsUsed: (used: number, seats: number) => `${used} of ${seats} seats used`,
  membersStat: 'Members',
  invitedStat: 'Invited',
  freeStat: 'Free',
  // Invite dialog
  inviteTitle: (workspace: string) => `Invite to ${workspace}`,
  inviteDescription: 'They’ll get an email with a link to join. Invites expire after a week.',
  emailsLabel: 'Email addresses',
  emailsPlaceholder: 'name@company.com, …',
  addAnother: 'Add another…',
  emailsHint: 'Paste a list or press Enter after each address.',
  notEmail: (tag: string) => `“${tag}” isn’t an email address.`,
  alreadyIn: (tag: string, workspace: string) => `${tag} is already in ${workspace}.`,
  alreadyListed: (tag: string) => `${tag} is already on the list.`,
  seatsShort: (seatsLeft: number, extra: number) => `${seatsLeft === 0 ? 'No seats left' : `Only ${plural(seatsLeft, 'seat', 'seats')} left`}. Remove ${extra} or add seats.`,
  addOne: 'Add at least one email address.',
  roleLabel: 'Role',
  cancel: 'Cancel',
  invitesSent: (count: number) => (count === 1 ? 'Invite sent' : 'Invites sent'),
  sendInvites: (count: number) => (count > 1 ? `Send ${count} invites` : 'Send invite'),
}

export type TeamMembersCopy = typeof DEFAULT_COPY
