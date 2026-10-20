/* A fictional account's reach after a takeover: pass yours through the block's props. */

export type RadialNetworkTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** A kind of thing in the graph, with its color: Identity, Devices… */
export interface RadialNetworkKind {
  id: string
  label: string
  tone: RadialNetworkTone
}

/** Something the center reaches. */
export interface RadialNetworkNode {
  id: string
  /** As your tooling names it, set in mono in its tooltip: "lt-moreau". */
  name: string
  /** A `RadialNetworkKind` id. */
  kind: string
  /** The node it is reached through, one hop in. Default: the center. */
  via?: string
  /** A `RadialNetworkState` id. Default: none, a plain node. */
  state?: string
  /** Why it is in that state, in its tooltip: "Readable with the new token". */
  note?: string
}

/** Where it starts: the compromised account, host or key. */
export interface RadialNetworkCenter {
  id: string
  name: string
  /** Up to three characters in the center's disc. Default: the name's initials. */
  short?: string
  kind: string
  /** A `RadialNetworkState` id. Default: none, a plain node. */
  state?: string
}

/** A state a node can be in: how it is ringed, and whether the foot counts it. */
export interface RadialNetworkState {
  id: string
  label: string
  /** The ring the node wears, and how the link into it is drawn. Default: none. */
  ring?: 'solid' | 'dashed'
  /** The ring's color. Default 'danger'. */
  tone?: 'accent' | 'info' | 'success' | 'warning' | 'danger'
  /** Counted in the foot, in this order. */
  count?: boolean
  /** The foot's figure for it in the state's color. */
  emphasis?: boolean
}

export const STATES: RadialNetworkState[] = [
  { id: 'compromised', label: 'Compromised', ring: 'solid', tone: 'danger', count: true, emphasis: true },
  { id: 'at-risk', label: 'At risk', ring: 'dashed', tone: 'danger', count: true },
  { id: 'clean', label: 'Clean' },
]

export const KINDS: RadialNetworkKind[] = [
  { id: 'identity', label: 'Identity', tone: 'chart-3' },
  { id: 'devices', label: 'Devices', tone: 'chart-1' },
  { id: 'cloud', label: 'Cloud', tone: 'chart-5' },
  { id: 'mail', label: 'Mail', tone: 'chart-4' },
  { id: 'network', label: 'Network', tone: 'chart-2' },
]

export const CENTER: RadialNetworkCenter = { id: 'a.moreau', name: 'a.moreau', short: 'AM', kind: 'identity', state: 'compromised' }

export const NODES: RadialNetworkNode[] = [
  { id: 'mailbox', name: 'mailbox', kind: 'mail', state: 'compromised', note: 'Forwards to an outside address' },
  { id: 'sso', name: 'sso-session', kind: 'identity', state: 'compromised', note: 'Opened from an unknown laptop' },
  { id: 'token', name: 'prod-eu-token', kind: 'cloud', state: 'compromised', note: 'Created at 09:19' },
  { id: 'laptop', name: 'lt-moreau', kind: 'devices', state: 'compromised', note: 'Packing an archive' },
  { id: 'vpn', name: 'vpn-gw-2', kind: 'network', state: 'clean' },
  { id: 'calendar', name: 'team-calendar', kind: 'mail', state: 'clean' },
  { id: 'finance', name: 'finance-shared', via: 'mailbox', kind: 'mail', state: 'at-risk', note: 'Gets the forwarded mail' },
  { id: 'okafor', name: 'j.okafor', via: 'mailbox', kind: 'identity', state: 'clean' },
  { id: 'payroll', name: 'payroll-app', via: 'sso', kind: 'identity', state: 'at-risk', note: 'Trusts the same session' },
  { id: 'hr', name: 'hr-portal', via: 'sso', kind: 'identity', state: 'clean' },
  { id: 'exports', name: 'invoice-exports', via: 'token', kind: 'cloud', state: 'at-risk', note: 'Readable with the new token' },
  { id: 'analytics', name: 'analytics-db', via: 'token', kind: 'cloud', state: 'at-risk', note: 'Same role as the token' },
  { id: 'backups', name: 'backup-vault', via: 'token', kind: 'cloud', state: 'at-risk', note: 'Listed once, not read' },
  { id: 'builds', name: 'build-share', via: 'laptop', kind: 'devices', state: 'clean' },
  { id: 'printer', name: 'printer-3f', via: 'laptop', kind: 'network', state: 'clean' },
  { id: 'proxy', name: 'dmz-proxy', via: 'vpn', kind: 'network', state: 'clean' },
  { id: 'logs', name: 'logs-bucket', via: 'vpn', kind: 'cloud', state: 'clean' },
  { id: 'rooms', name: 'room-booking', via: 'calendar', kind: 'mail', state: 'clean' },
]

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  title: 'Blast radius',
  subtitle: (center: string) => `From ${center}`,
  hopsLabel: 'Rings',
  hops: (n: number) => `${n} ${plural(n, 'hop', 'hops')}`,
  graphLabel: (center: string) => `What ${center} reaches`,
  statesLabel: 'States',
  kindsLabel: 'Kinds',
  total: 'Entities',
  loadingLabel: 'Loading the graph',
  errorTitle: 'Couldn’t load the graph.',
  retry: 'Retry',
  emptyTitle: 'Nothing reached',
  emptyDescription: 'What the center touches shows up here.',
}

export type RadialNetworkCopy = typeof DEFAULT_COPY
