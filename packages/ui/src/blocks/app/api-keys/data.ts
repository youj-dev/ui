export type Env = 'live' | 'test'
export type Access = 'none' | 'read' | 'write'

export const RESOURCES = ['Charges', 'Customers', 'Payouts', 'Webhooks']
export type Resource = string
/** Access per resource; a resource left out has none. */
export type Scopes = Record<Resource, Access>

export interface ApiKey {
  id: string
  /** What uses the key, as its owner named it. */
  name: string
  env: Env
  /** The secret's last four characters; the rest is never shown again. */
  last4: string
  scopes: Scopes
  createdBy: string
  /** When it last signed a request, in epoch ms; null if never. */
  lastUsed: number | null
  /** One of the `expiries` values. */
  expires: string
  /** Requests a day over the last seven days, oldest first. */
  traffic: number[]
}

/** What the create dialog sends to `onCreate`. */
export interface ApiKeyDraft {
  name: string
  env: Env
  scopes: Scopes
  expires: string
}

export interface ApiKeyExpiry {
  value: string
  label: string
}

export interface ApiKeysNavLink {
  label: string
  href: string
  /** The page you're on. */
  current?: boolean
}

export const EXPIRY: ApiKeyExpiry[] = [
  { value: 'never', label: 'Never' },
  { value: '30d', label: 'In 30 days' },
  { value: '90d', label: 'In 90 days' },
  { value: '1y', label: 'In a year' },
]

export const HOUR = 3_600_000
/** The demo's fixed "now", so relative times render the same on server and client. */
export const NOW = Date.UTC(2026, 8, 30, 12)
const FULL: Scopes = { Charges: 'write', Customers: 'write', Payouts: 'write', Webhooks: 'write' }

export const KEYS: ApiKey[] = [
  { id: 'k1', name: 'Production server', env: 'live', last4: '3f9a', scopes: FULL, createdBy: 'Mira Okafor', lastUsed: NOW - 0.05 * HOUR, expires: 'never', traffic: [812, 940, 1020, 988, 1204, 1410, 1388] },
  { id: 'k2', name: 'Billing worker', env: 'live', last4: 'c21e', scopes: { Charges: 'write', Customers: 'read', Payouts: 'none', Webhooks: 'none' }, createdBy: 'Tomás Reyes', lastUsed: NOW - 2 * HOUR, expires: '1y', traffic: [320, 290, 402, 380, 366, 410, 395] },
  { id: 'k3', name: 'Analytics export', env: 'live', last4: '7b04', scopes: { Charges: 'read', Customers: 'read', Payouts: 'read', Webhooks: 'none' }, createdBy: 'Mira Okafor', lastUsed: NOW - 26 * HOUR, expires: '90d', traffic: [40, 38, 0, 44, 52, 12, 6] },
  { id: 'k4', name: 'Zapier (legacy)', env: 'live', last4: 'e880', scopes: { Charges: 'read', Customers: 'write', Payouts: 'none', Webhooks: 'write' }, createdBy: 'Jun Park', lastUsed: null, expires: '30d', traffic: [0, 0, 0, 0, 0, 0, 0] },
]

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

const ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
/** Demo only: your server mints the secret and returns it once. */
export const secret = () => `sk_demo_${Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) => ALPHABET[n % ALPHABET.length]).join('')}`

export function lastUsed(at: number | null, now: number, ago: Intl.RelativeTimeFormat, copy: Pick<ApiKeysCopy, 'never' | 'justNow'>) {
  if (at === null) return copy.never
  const minutes = Math.round((at - now) / 60_000)
  if (minutes > -1) return copy.justNow
  if (minutes > -60) return ago.format(minutes, 'minute')
  if (minutes > -60 * 24) return ago.format(Math.round(minutes / 60), 'hour')
  return ago.format(Math.round(minutes / 1440), 'day')
}

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

export function scopeSummary(scopes: Scopes, resources: string[], fullAccess: string): { label: string; tone: 'default' | 'secondary' | 'warning' }[] {
  const access = (r: string) => scopes[r] ?? 'none'
  const granted = resources.filter((r) => access(r) !== 'none')
  if (granted.every((r) => access(r) === 'write') && granted.length === resources.length) return [{ label: fullAccess, tone: 'warning' }]
  return granted.map((r) => ({ label: `${r.toLowerCase()}:${access(r)}`, tone: access(r) === 'write' ? 'default' : 'secondary' }))
}

export const NAV: ApiKeysNavLink[] = ['Overview', 'API keys', 'Webhooks', 'Events', 'Logs'].map((label) => ({ label, href: '#', current: label === 'API keys' }))

/** New keys start with these grants; a resource not named here starts at none. */
export const NEW_KEY_SCOPES: Scopes = { Charges: 'read', Customers: 'read', Payouts: 'none', Webhooks: 'none' }

export const DEFAULT_COPY = {
  title: 'API keys',
  description: (product: string) => `Secret keys authenticate your server with ${product}. Keep them out of client code and repositories.`,
  environment: 'Environment',
  live: 'Live',
  test: 'Test',
  createKey: 'Create key',
  health: 'Key health',
  liveKeys: 'Live keys',
  testKeys: 'Test keys',
  active: 'active',
  requests: 'Requests',
  lastWeek: 'last 7 days',
  unused: 'Unused',
  unusedNote: 'no calls in 24 h',
  /** Names the table's region, from the environment's label. */
  keysRegion: (envLabel: string) => `${envLabel} keys`,
  emptyTitle: (env: Env) => `No ${env} keys yet`,
  emptyDescription: 'Test keys hit the sandbox: no money moves, and webhooks fire against fixtures.',
  emptyAction: (env: Env) => `Create a ${env} key`,
  loading: 'Loading keys',
  footnote: 'Restricted keys can only call the resources you grant. Rotate any key you suspect has leaked.',
  revokeTitle: (name: string) => `Revoke “${name}”?`,
  revokeDescription: 'Requests signed with it start failing with 401 right away. This can’t be undone.',
  revokeConfirm: 'Revoke key',
  table: 'Secret keys',
  name: 'Name',
  key: 'Key',
  scopes: 'Scopes',
  createdBy: 'Created by',
  lastUsed: 'Last used',
  traffic: '7 days',
  actions: 'Actions',
  actionsFor: (name: string) => `Actions for ${name}`,
  noExpiry: 'No expiry',
  expiresIn: (label: string) => `Expires ${label.toLowerCase()}`,
  ending: 'ending ',
  fullAccess: 'Full access',
  trafficLabel: (name: string, total: string) => `${name}: ${total} requests in 7 days`,
  copyId: 'Copy key ID',
  roll: 'Roll secret…',
  revoke: 'Revoke…',
  never: 'Never',
  justNow: 'Just now',
  newKey: (env: Env) => `New ${env} key`,
  newKeyDescription: (product: string) => `Keys sign server-side requests to the ${product} API.`,
  ready: (name: string) => `“${name}” is ready`,
  readyDescription: 'Use it as a bearer token from your server. Never ship it to a browser.',
  namePlaceholder: 'e.g. Checkout service',
  nameRequired: 'Name the key after what uses it.',
  permissions: 'Permissions',
  permissionsDescription: 'Grant the least this key needs. Write includes read.',
  permissionsGroup: 'Permissions by resource',
  resourceAccess: (resource: string) => `${resource} access`,
  none: 'None',
  read: 'Read',
  write: 'Write',
  permissionRequired: 'Grant at least one permission.',
  expires: 'Expires',
  cancel: 'Cancel',
  minting: 'Minting…',
  created: 'Created',
  you: 'You',
  copyNow: 'Copy this secret now',
  shownOnce: (product: string) => `It’s shown once. ${product} stores only a hash, so a lost secret means rolling the key.`,
  secret: 'Secret key',
  copySecret: 'Copy',
  copied: 'Copied',
  copyFailed: 'Copy failed',
  saved: 'I’ve saved it',
  rolledTitle: (name: string) => `New secret for “${name}”`,
  rolledDescription: 'The old secret keeps working for 24 hours, so you can deploy the new one first.',
  errorTitle: 'Couldn’t load your keys',
  retry: 'Retry',
  failed: 'Something went wrong. Try again.',
  brandBadge: 'developers',
  nav: 'Developers',
}

export type ApiKeysCopy = typeof DEFAULT_COPY
