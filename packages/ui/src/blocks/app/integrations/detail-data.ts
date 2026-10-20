import { APPS, type App } from './data'

type ConnectionStatus = 'connected' | 'paused' | 'disconnected'

/** A sample of what the connected app posts into your workspace. */
interface IntegrationPreview {
  /** Who the message is from, as the app's name. */
  from: string
  /** The message's headline. */
  title: string
  /** Its body, one paragraph. */
  body: string
  /** A small action label under the body ("Open run"). */
  action?: string
}

/** The connection's facts, shown in the Details list. */
interface IntegrationConnection {
  status: ConnectionStatus
  /** The workspace it is connected to. */
  workspace: string
  /** Epoch ms. */
  connectedAt: number
  /** Epoch ms; null if it has never been used. */
  lastUsed: number | null
}

/** One permission the app was granted, with a switch to take it back. */
interface IntegrationPermission {
  id: string
  label: string
  description: string
  on: boolean
}

const DETAIL_APP = APPS[0] as App

const DETAIL_PREVIEW: IntegrationPreview = {
  from: 'Parley',
  title: 'Deploy to production failed',
  body: 'Run 482 stopped at “Migrate database”. Priya Raman owns this workflow and was mentioned.',
  action: 'Open run',
}

const DETAIL_CONNECTION: IntegrationConnection = {
  status: 'connected',
  workspace: 'Northwind',
  connectedAt: Date.UTC(2026, 7, 14, 9),
  lastUsed: Date.UTC(2026, 8, 30, 11, 20),
}

const DETAIL_PERMISSIONS: IntegrationPermission[] = [
  { id: 'post', label: 'Post messages to channels you pick', description: 'Run summaries and failures arrive in the channels you choose.', on: true },
  { id: 'channels', label: 'Read channel names', description: 'Lets you pick a channel from a list instead of typing its name.', on: true },
  { id: 'profile', label: 'Read your profile', description: 'Matches workflow owners to their accounts so they can be mentioned.', on: false },
]

const DETAIL_COPY = {
  breadcrumbs: 'Breadcrumb',
  back: 'Integrations',
  verified: 'Verified',
  by: (vendor: string) => `by ${vendor}`,
  previewTitle: 'What it posts',
  previewLabel: (name: string) => `A message from ${name}`,
  detailsTitle: 'Details',
  status: 'Status',
  statuses: { connected: 'Connected', paused: 'Paused', disconnected: 'Disconnected' } satisfies Record<ConnectionStatus, string>,
  statusMenu: (status: string) => `Connection: ${status}. Change it`,
  pause: 'Pause',
  resume: 'Resume',
  reconnect: 'Reconnect',
  disconnect: 'Disconnect',
  workspace: 'Workspace',
  connected: 'Connected',
  lastUsed: 'Last used',
  never: 'Never',
  permissionsTitle: 'Permissions',
  permissionsDescription: 'Turn off anything it no longer needs. Workflows that rely on it will stop at that step.',
  failed: 'Something went wrong. Try again.',
}

type IntegrationDetailCopy = typeof DETAIL_COPY

export {
  DETAIL_APP,
  DETAIL_CONNECTION,
  DETAIL_COPY,
  DETAIL_PERMISSIONS,
  DETAIL_PREVIEW,
  type ConnectionStatus,
  type IntegrationConnection,
  type IntegrationDetailCopy,
  type IntegrationPermission,
  type IntegrationPreview,
}
