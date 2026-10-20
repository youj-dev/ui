import type { ComponentType } from 'react'

/** The shape the floor draws for what's waiting to land: a cylinder, a stack of slabs or a crate. */
export type FirstSourceKind = 'database' | 'stream' | 'files'

/** One way in: a choice card, and the primary action once it's chosen. */
export interface FirstSourceOption {
  id: string
  /** The card's title. */
  label: string
  /** The formats or places it takes, separated by " · " (each stays whole). */
  description: string
  /** The primary action's label once this one is chosen. */
  action: string
  /** The icon on the card's disc. Default: the one for its `kind`. */
  icon?: ComponentType<{ size?: number; className?: string }>
  /** What waits over the floor: a cylinder (`database`), slabs (`stream`) or a crate (`files`). Default 'files'. */
  kind?: FirstSourceKind
}

export const SOURCES: FirstSourceOption[] = [
  { id: 'database', kind: 'database', label: 'Database', description: 'Postgres · MySQL · CDC', action: 'Connect database' },
  { id: 'stream', kind: 'stream', label: 'Event stream', description: 'Kafka · webhooks', action: 'Connect stream' },
  { id: 'files', kind: 'files', label: 'Files', description: 'CSV · Parquet · S3', action: 'Upload files' },
]

export const DEFAULT_COPY = {
  title: 'Warehouse',
  scope: 'acme-analytics · eu-west',
  /** The head's status line: how many tables there are. */
  status: '0 tables',
  heading: 'Nothing has landed yet',
  body: 'Connect a source and its tables land on this floor as they sync. A small database takes a few minutes the first time; after that, only what changed.',
  /** Names the choice for assistive tech. */
  sourceLabel: 'Where your data comes from',
  /** The footer's status line. */
  tier: 'Free tier · 10 GB',
  guide: 'Read the guide',
  connecting: 'Connecting',
  connected: 'Source connected',
}

export type FirstSourceCopy = typeof DEFAULT_COPY

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
