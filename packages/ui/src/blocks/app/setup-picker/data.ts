export type SetupShape = 'single' | 'replicated' | 'regions'

/** One choice card and the drawing it shows. */
export interface SetupOption {
  /** What `onContinue` and `defaultShape` receive. */
  id: string
  /** The drawing: 'single' (one node), 'replicated' (three in a zone) or 'regions' (one per region). Default: `id` when it names one, else 'single'. */
  shape?: SetupShape
  title: string
  /** A mono line: what the shape costs and gives you. */
  detail: string
  /** The sentence under the choices once it's picked. */
  summary: string
}

export const DEFAULT_COPY = {
  title: 'New database',
  subtitle: 'acme-orders',
  step: 'Step 2 of 3',
  question: 'How should it run?',
  lead: 'Pick a shape for now. You can move between them later without downtime.',
  legend: 'Deployment shape',
  options: [
    { id: 'single', title: 'Single node', detail: '1 zone · from $19/mo', summary: 'One primary in one zone: fine for staging and small apps. Backups run nightly.' },
    { id: 'replicated', title: 'Replicated', detail: '3 zones · auto-failover', summary: 'A primary and two replicas across zones. If the primary fails, a replica takes over in seconds.' },
    { id: 'regions', title: 'Multi-region', detail: '3 regions · reads < 80 ms', summary: 'A copy in each region, reads served from the nearest one. Writes go to the primary region.' },
  ] as SetupOption[],
  back: 'Back',
  next: 'Continue',
  saving: 'Saving',
  saved: 'Saved',
  chosen: (title: string) => `${title} chosen`,
}

export type SetupPickerCopy = typeof DEFAULT_COPY

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
