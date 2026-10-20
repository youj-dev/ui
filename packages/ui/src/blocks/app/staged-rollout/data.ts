/* Fixtures and types for the staged-rollout card: a handful of items (feature
 * flags in the demo), each rolled out to a share of an audience per
 * environment, with the figures the card shows for the selected one. Pass
 * yours through the block's props. */

/** Where an item is rolled out: an environment, a region, a ring of devices. */
export interface StagedRolloutEnvironment {
  id: string
  label: string
  /** The name on a row's chip. Default: the label. */
  short?: string
  /** How many could be exposed there. */
  audience: number
}

export interface StagedRolloutItem {
  /** The key code reads it by, set in mono. */
  key: string
  name: string
  /** The share of the audience with it on, 0–100, by environment id. */
  rollout: Record<string, number>
  /** The watched rate among those who have it, 0–1: errors per request, refunds per order. */
  rate: number
}

export const ENVIRONMENTS: StagedRolloutEnvironment[] = [
  { id: 'production', label: 'Production', short: 'prod', audience: 124_800 },
  { id: 'staging', label: 'Staging', short: 'stg', audience: 1_240 },
  { id: 'development', label: 'Development', short: 'dev', audience: 86 },
]

/** An item past this rate is failing its guardrail: its figure turns to the warning tone. */
export const GUARDRAIL = 0.01

export const ITEMS: StagedRolloutItem[] = [
  { key: 'checkout-v2', name: 'New checkout flow', rollout: { production: 10, staging: 100, development: 100 }, rate: 0.0021 },
  { key: 'semantic-search', name: 'Semantic search', rollout: { production: 50, staging: 100, development: 100 }, rate: 0.0009 },
  { key: 'inbox-summaries', name: 'Inbox summaries', rollout: { production: 5, staging: 50, development: 100 }, rate: 0.0134 },
  { key: 'usage-billing', name: 'Usage-based billing', rollout: { production: 1, staging: 10, development: 100 }, rate: 0.0004 },
  { key: 'edge-cache', name: 'Edge cache', rollout: { production: 100, staging: 100, development: 100 }, rate: 0.0002 },
]

export const DEFAULT_COPY = {
  title: 'Rollout',
  more: 'More rollout actions',
  copyKey: 'Copy flag key',
  auditLog: 'View audit log',
  environment: 'Environment',
  ruler: 'Rolled out to',
  status: { off: 'Off', rolling: 'Rolling out', live: 'Everyone', stopped: 'Killed' },
  exposed: 'Users exposed',
  rate: 'Error rate',
  guardrail: (limit: string) => `guardrail ${limit}`,
  items: 'Flags',
  itemCount: (count: number, rolling: number) => `${count} flags · ${rolling} rolling out`,
  chipState: (environment: string, share: string) => `${environment}: ${share}`,
  select: (name: string) => `${name}, show its rollout`,
  saved: 'Saved',
  /** `{from}` and `{to}` are the saved and the new share. */
  unsaved: 'Unsaved · {from} → {to}',
  stop: 'Kill switch',
  stopped: (name: string) => `${name} killed: rolled back to 0%`,
  restore: (share: string) => `Restore ${share}`,
  apply: 'Apply rollout',
  applying: 'Applying…',
  applied: 'Applied',
}

export type StagedRolloutCopy = typeof DEFAULT_COPY & {
  /** The locale counts and rates are written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

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
