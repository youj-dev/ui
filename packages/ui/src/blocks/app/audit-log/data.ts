import { dateTimeFormat } from '../../../lib/utils'
/* Fixtures for the audit log: who did what to which thing, from where, and
 * whether it went through. Swap EVENTS for your audit API; the shape is the
 * common one (actor, action, target, context, result, before/after). */

/** How an event ended: its badge, and whether the summary counts it as one to look at. */
export interface AuditResult {
  id: string
  label: string
  tone: 'success' | 'warning' | 'danger' | 'neutral' | 'accent'
  /** Counted in the summary's `flagged` (the demo: denied and failed). */
  flagged?: boolean
}

/** A kind of event, a choice in the Type filter. Without a tone, an outlined badge. */
export interface AuditCategory {
  id: string
  label: string
  tone?: AuditResult['tone']
}

const VARIANT = { success: 'success', warning: 'warning', danger: 'danger', neutral: 'secondary', accent: 'default' } as const
/** The badge variant for a tone; no tone is the quiet outline. */
export const toneVariant = (tone: AuditResult['tone'] | undefined) => (tone ? VARIANT[tone] : 'outline')

export interface AuditActor {
  id: string
  name: string
  email: string
  kind: 'user' | 'api-key' | 'system'
}
/** The earlier name of AuditActor. */
export type Actor = AuditActor

export interface AuditEvent {
  id: string
  /** ISO time, UTC. */
  time: string
  /** A key of the `actors` record. */
  actor: string
  action: string
  /** A `categories` id; one it doesn't know shows as itself. */
  category: string
  summary: string
  target: string
  ip: string
  location: string
  userAgent: string
  /** A `results` id. */
  result: string
  changes?: { field: string; from: string; to: string }[]
}

export const ACTORS: Record<string, AuditActor> = {
  maya: { id: 'usr_8f2k', name: 'Maya Chen', email: 'maya@northwind.io', kind: 'user' },
  jonas: { id: 'usr_3mq9', name: 'Jonas Weber', email: 'jonas@northwind.io', kind: 'user' },
  priya: { id: 'usr_7xa1', name: 'Priya Raman', email: 'priya@northwind.io', kind: 'user' },
  leo: { id: 'usr_2bd4', name: 'Leo Martins', email: 'leo@northwind.io', kind: 'user' },
  deploy: { id: 'key_9tz0', name: 'deploy-bot', email: 'API key · ci', kind: 'api-key' },
  system: { id: 'sys', name: 'Northwind', email: 'Automatic', kind: 'system' },
}

export const CATEGORIES: AuditCategory[] = [
  { id: 'members', label: 'Members' },
  { id: 'security', label: 'Security' },
  { id: 'billing', label: 'Billing' },
  { id: 'projects', label: 'Projects' },
  { id: 'auth', label: 'Sign-in' },
]

export const RESULTS: AuditResult[] = [
  { id: 'success', label: 'Success', tone: 'success' },
  { id: 'denied', label: 'Denied', tone: 'warning', flagged: true },
  { id: 'failed', label: 'Failed', tone: 'danger', flagged: true },
]

const PLACES = [
  { ip: '84.17.42.101', location: 'Berlin, DE', ua: 'Chrome 141 · macOS' },
  { ip: '203.0.113.24', location: 'Bengaluru, IN', ua: 'Firefox 143 · Windows' },
  { ip: '198.51.100.7', location: 'Lisbon, PT', ua: 'Safari 19 · iOS' },
  { ip: '34.120.8.66', location: 'us-east-1', ua: 'northwind-cli/4.2.0' },
  { ip: '192.0.2.200', location: 'Singapore, SG', ua: 'curl/8.9.1' },
]

type Seed = [minutesAgo: number, actor: string, action: string, category: string, summary: string, target: string, place: number, result: string, changes?: AuditEvent['changes']]

const SEEDS: Seed[] = [
  [4, 'maya', 'member.role_updated', 'members', 'Changed Leo Martins’s role to Admin', 'leo@northwind.io', 0, 'success', [{ field: 'role', from: 'Member', to: 'Admin' }]],
  [11, 'deploy', 'project.deployed', 'projects', 'Deployed storefront to production', 'storefront', 3, 'success'],
  [19, 'system', 'auth.login_failed', 'auth', 'Blocked a sign-in with a wrong password', 'jonas@northwind.io', 4, 'failed'],
  [27, 'priya', 'api_key.created', 'security', 'Created API key “analytics-export”', 'key_4hc8', 1, 'success', [{ field: 'scopes', from: '—', to: 'read:events, read:projects' }]],
  [46, 'jonas', 'billing.plan_changed', 'billing', 'Tried to change the plan to Enterprise', 'Northwind', 0, 'denied'],
  [58, 'maya', 'member.invited', 'members', 'Invited sam@acme.co as Member', 'sam@acme.co', 0, 'success'],
  [83, 'leo', 'auth.login', 'auth', 'Signed in with a passkey', 'leo@northwind.io', 2, 'success'],
  [95, 'priya', 'sso.updated', 'security', 'Required SSO for every member', 'Okta', 1, 'success', [{ field: 'enforce_sso', from: 'false', to: 'true' }]],
  [122, 'deploy', 'project.env_updated', 'projects', 'Updated 3 environment variables on storefront', 'storefront', 3, 'success', [{ field: 'STRIPE_KEY', from: '••••a91', to: '••••c07' }]],
  [148, 'jonas', 'project.deleted', 'projects', 'Tried to delete project legacy-api', 'legacy-api', 0, 'denied'],
  [171, 'maya', 'member.removed', 'members', 'Removed Tomás Ruiz from the workspace', 'tomas@northwind.io', 0, 'success'],
  [204, 'system', 'billing.invoice_paid', 'billing', 'Paid invoice INV-2026-09 ($1,284.00)', 'INV-2026-09', 3, 'success'],
  [260, 'priya', 'api_key.revoked', 'security', 'Revoked API key “old-zapier”', 'key_1lm2', 1, 'success'],
  [312, 'leo', 'export.downloaded', 'projects', 'Downloaded a CSV of 18,204 orders', 'orders', 2, 'success'],
  [388, 'system', 'auth.login_failed', 'auth', 'Blocked 5 sign-ins from an unknown device', 'maya@northwind.io', 4, 'failed'],
  [455, 'maya', 'settings.updated', 'security', 'Set session length to 12 hours', 'Workspace', 0, 'success', [{ field: 'session_ttl', from: '30 days', to: '12 hours' }]],
  [530, 'jonas', 'member.role_updated', 'members', 'Tried to make himself an Owner', 'jonas@northwind.io', 0, 'denied', [{ field: 'role', from: 'Member', to: 'Owner' }]],
  [610, 'deploy', 'project.deployed', 'projects', 'Deployed docs to production', 'docs', 3, 'success'],
  [742, 'priya', 'billing.card_updated', 'billing', 'Replaced the card on file', 'Visa ••4242', 1, 'success', [{ field: 'card', from: 'Visa ••1881', to: 'Visa ••4242' }]],
  [905, 'leo', 'auth.login', 'auth', 'Signed in with Google', 'leo@northwind.io', 2, 'success'],
  [1130, 'maya', 'member.invited', 'members', 'Invited 4 people from @acme.co', 'acme.co', 0, 'success'],
  [1402, 'deploy', 'project.deployed', 'projects', 'Deployment of storefront failed its checks', 'storefront', 3, 'failed'],
  [1688, 'priya', 'audit.exported', 'security', 'Exported the audit log', 'Audit log', 1, 'success'],
  [2011, 'system', 'billing.plan_renewed', 'billing', 'Renewed the Scale plan for October', 'Northwind', 3, 'success'],
  [2440, 'jonas', 'auth.login', 'auth', 'Signed in with a password', 'jonas@northwind.io', 0, 'success'],
  [2890, 'maya', 'project.created', 'projects', 'Created project partner-portal', 'partner-portal', 0, 'success'],
  [3320, 'leo', 'api_key.created', 'security', 'Created API key “mobile-staging”', 'key_6pw3', 2, 'success'],
  [3975, 'system', 'auth.login_failed', 'auth', 'Blocked a sign-in from a Tor exit node', 'priya@northwind.io', 4, 'failed'],
]

/** "Now" for the fixtures, so the log reads the same on every render. */
export const NOW = Date.UTC(2026, 8, 27, 14, 30)

export const EVENTS: AuditEvent[] = SEEDS.map(([ago, actor, action, category, summary, target, place, result, changes], i) => ({
  id: `evt_${(0x5f3a91 + i * 7919).toString(36)}`,
  time: new Date(NOW - ago * 60_000).toISOString(),
  actor,
  action,
  category,
  summary,
  target,
  ip: PLACES[place]!.ip,
  location: PLACES[place]!.location,
  userAgent: PLACES[place]!.ua,
  result,
  changes,
}))

const formats = new Map<string, Intl.DateTimeFormat>()
/** "Sep 27, 14:26", in UTC, so the server and the browser agree. */
export function formatTime(iso: string, locale: string) {
  let format = formats.get(locale)
  if (!format) {
    format = dateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' })
    formats.set(locale, format)
  }
  return format.format(new Date(iso))
}

/** An actor by id; an unknown id reads as itself, so a missing entry never breaks a row. */
export const actorOf = (actors: Record<string, AuditActor>, id: string): AuditActor => actors[id] ?? { id, name: id, email: '', kind: 'user' }

export const DEFAULT_COPY = {
  title: 'Audit log',
  summary: (events: number, flagged: number) => `${events} events in the last 3 days · ${flagged} denied or failed`,
  retention: 'Kept for 365 days',
  tableLabel: 'Audit events',
  noun: 'events',
  searchPlaceholder: 'Search events, people, IPs…',
  exportFilename: 'audit-log',
  emptyTitle: 'No events yet',
  emptyDescription: 'Changes to the workspace show up here as they happen.',
  timeZone: 'UTC',
  time: 'Time (UTC)',
  date: 'Date',
  actor: 'Actor',
  event: 'Event',
  type: 'Type',
  result: 'Result',
  location: 'Location',
  action: 'Action',
  target: 'Target',
  client: 'Client',
  changes: 'Changes',
  changedTo: ' to ',
  raw: 'Raw event',
  copyRaw: 'Copy event JSON',
  close: 'Close',
}

export type AuditLogCopy = typeof DEFAULT_COPY

/** The event as the API returns it: what the raw view shows and copies. */
export function rawEvent(event: AuditEvent, actors: Record<string, AuditActor> = ACTORS) {
  const actor = actorOf(actors, event.actor)
  return JSON.stringify(
    {
      id: event.id,
      occurred_at: event.time,
      action: event.action,
      actor: { id: actor.id, type: actor.kind, name: actor.name },
      target: event.target,
      result: event.result,
      context: { ip: event.ip, location: event.location, user_agent: event.userAgent },
      ...(event.changes ? { changes: Object.fromEntries(event.changes.map((c) => [c.field, { from: c.from, to: c.to }])) } : {}),
    },
    null,
    2,
  )
}
