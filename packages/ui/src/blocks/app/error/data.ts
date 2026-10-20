import type { ElementType, ReactNode } from 'react'

export type ErrorScreenServiceState = 'operational' | 'degraded' | 'outage'

/** A service on the 500 page's status card. */
export interface ErrorScreenService {
  name: string
  state: ErrorScreenServiceState
}

/** A step of the maintenance window. */
export interface ErrorScreenStep {
  label: string
  state: 'done' | 'active' | 'pending'
}

export type ErrorScreenBrand = { name: string; logo?: ReactNode }

/** The element internal links render as, e.g. Next.js `Link`. */
export type LinkComponent = ElementType

export const SERVICES: ErrorScreenService[] = [
  { name: 'Dashboard', state: 'outage' },
  { name: 'REST API', state: 'degraded' },
  { name: 'Webhooks', state: 'operational' },
  { name: 'Edge network', state: 'operational' },
]

export const STEPS: ErrorScreenStep[] = [
  { label: 'Snapshot every database', state: 'done' },
  { label: 'Upgrade to Postgres 18', state: 'active' },
  { label: 'Verify replicas and bring traffic back', state: 'pending' },
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

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const DEFAULT_COPY = {
  statusPage: 'Status page',
  /** The small line over the 500's headline beside a picture; the code is set large without one. */
  errorCode: (code: string) => `Error ${code}`,
  // 500
  code: '500',
  serverTitle: 'Something broke on our side',
  serverDescription:
    'The server hit an error it couldn’t recover from. Your work is saved. We’ve been alerted and are on it; trying again usually helps.',
  retry: 'Try again',
  retrying: 'Retrying…',
  backOnline: 'Back online',
  stillDown: 'Still down',
  currentStatus: 'Current status',
  updated: 'Updated 2 min ago',
  serviceStates: { operational: 'Operational', degraded: 'Degraded', outage: 'Outage' } as Record<ErrorScreenServiceState, string>,
  incident: 'Incident',
  copyIdLabel: (id: string) => `Copy incident ID ${id}`,
  copyId: 'Copy',
  copied: 'Copied',
  copyFailed: 'Couldn’t copy',
  /** Beside the incident ID. Empty hides it. */
  contactSupport: 'Contact support',
  // Maintenance
  maintenanceBadge: 'Scheduled maintenance',
  timeLeft: 'Time left',
  backIn: (minutes: number) => `Back in about ${minutes} minute${minutes === 1 ? '' : 's'}`,
  maintenanceTitle: 'We’re upgrading our databases',
  maintenanceDescription: 'Northwind is read-only for this window. Nothing is lost, and anything queued sends as soon as we’re back.',
  started: (time: string) => `Started ${time}`,
  backBy: (time: string) => `Back by ${time}`,
  progress: 'Maintenance progress',
  stepStates: { done: '(done)', active: '(in progress)', pending: '(up next)' } as Record<ErrorScreenStep['state'], string>,
  subscribeLabel: 'Email me when it’s back',
  emailPlaceholder: 'you@company.com',
  subscribe: 'Notify me',
  subscribing: 'Adding…',
  subscribed: 'We’ll email you',
  subscribeRetry: 'Try again',
  invalidEmail: 'Enter an email like you@company.com.',
  subscribeFailed: 'Couldn’t add you. Try again.',
  // Launch
  launchTitle: 'Something new is on its way',
  launchDescription: 'Northwind 2 is a faster, calmer workspace. An early-access code gets you in before everyone else.',
  launching: 'Launching soon',
  live: 'We’re live',
  opens: (when: string) => `Opens ${when}`,
  opened: (when: string) => `Opened ${when}`,
  codeLabel: 'Have an early access code? Get in early',
  codePlaceholder: 'Your code',
  getIn: 'Get in',
  admitted: 'You’re in. Taking you there…',
  codeFailed: 'That code didn’t work.',
}

export type ErrorScreenCopy = typeof DEFAULT_COPY
