import type { ReactNode } from 'react'
import { GitBranchIcon, GlobeIcon, RocketIcon, UserPlusIcon, WandIcon } from '@youj/icons'

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

export interface ChecklistStep {
  id: string
  title: string
  /** A line of why, under the open step's title. */
  description: string
  /** The button that does the step. */
  action: string
  /** Sits before the action's label. */
  icon?: ReactNode
}

export const stepsFor = (product: string): ChecklistStep[] => [
  { id: 'workspace', title: 'Create your workspace', description: 'Name it and pick a region close to your users.', action: 'Create workspace', icon: <WandIcon size={14} /> },
  { id: 'repo', title: 'Connect a repository', description: `${product} builds every push and gives each branch its own preview URL.`, action: 'Connect repository', icon: <GitBranchIcon size={14} /> },
  { id: 'deploy', title: 'Ship your first deploy', description: 'Promote a preview to production. Rollbacks are one click.', action: 'Deploy now', icon: <RocketIcon size={14} /> },
  { id: 'invite', title: 'Invite your team', description: 'Reviewers can comment right on a preview, no account needed.', action: 'Invite teammates', icon: <UserPlusIcon size={14} /> },
  { id: 'domain', title: 'Add a custom domain', description: `Point your DNS at ${product}; certificates renew themselves.`, action: 'Add domain', icon: <GlobeIcon size={14} /> },
]

export const DEFAULT_COPY = {
  /** The card's name when it has no visible title (standalone, minimized or dismissed). */
  region: 'Getting started',
  title: (product: string) => `Get started with ${product}`,
  stepsDone: (count: number, total: number) => `${count} of ${total} steps done`,
  minimize: 'Minimize',
  pill: 'Get started',
  pillCount: (count: number, total: number) => `${count} of ${total}`,
  openPill: (_count: number, _total: number) => 'Open the checklist',
  done: 'Done',
  /** Read after a done step's title. */
  doneSr: ' (done)',
  working: 'Working…',
  failed: 'Something went wrong. Try again.',
  allSet: 'You’re all set',
  allSetBody: (product: string) => `${product} is building, previewing and serving your app. Nice work.`,
  dismiss: 'Dismiss',
  show: 'Show getting started',
  announceStep: (title: string, count: number, total: number) => `${title} done. ${count} of ${total} complete.`,
  announceAll: 'All set up. Every step is done.',
  /** The standalone demo's hidden page heading. */
  page: (product: string) => `${product} dashboard`,
}

export type ChecklistCopy = typeof DEFAULT_COPY
