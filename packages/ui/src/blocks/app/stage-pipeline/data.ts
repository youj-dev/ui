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

export type StagePipelineLevel = 'info' | 'ok' | 'warn' | 'error'

export interface StagePipelineLine {
  text: string
  level?: StagePipelineLevel
  /** The stage fails on this line: the run stops and the stages after it are skipped. */
  fails?: boolean
}

export interface StagePipelineScript {
  id: string
  name: string
  /** How long it usually takes, ms: the rail fills toward it. */
  estimate: number
  /** What the stage prints, in order. The demo prints one line per beat. */
  lines: StagePipelineLine[]
}

/** What the run is: its name, where it is going and who or what ran it. Every field is shown as given. */
export interface StagePipelineRun {
  id: string
  /** The thing being run: "checkout-api". */
  name: string
  /** Where it is going: "production". */
  target: string
  /** Where it came from: "main". */
  source: string
  /** A reference, set in mono: "9f3c2ab". */
  revision: string
  /** One line about it, beside the status. */
  summary: string
  author: string
  runner: string
}

export interface StagePipelineLog extends StagePipelineLine {
  id: string
  /** Ms after the stage started. */
  at: number
}

export const RUN: StagePipelineRun = {
  id: '2481',
  name: 'checkout-api',
  target: 'production',
  source: 'main',
  revision: '9f3c2ab',
  summary: 'Cache the pricing table at the edge',
  author: 'mara',
  runner: 'eu-west-2',
}

export const STAGES: StagePipelineScript[] = [
  {
    id: 'build',
    name: 'Build',
    estimate: 75_000,
    lines: [
      { text: 'Restored cache node_modules (412 MB) in 3.8 s' },
      { text: 'pnpm install --frozen-lockfile' },
      { text: 'Lockfile is up to date, resolution step is skipped' },
      { text: 'Packages: +1,204 in 11.2 s' },
      { text: 'tsc -b: 318 files, 0 errors' },
      { text: 'vite build --mode production' },
      { text: '✓ 1,847 modules transformed' },
      { text: 'dist/assets/index-4f1c.js  182.4 kB │ gzip: 58.1 kB' },
      { text: 'dist/assets/vendor-a09e.js  311.7 kB │ gzip: 96.3 kB', level: 'warn' },
      { text: 'Image checkout-api:9f3c2ab pushed (sha256:7be1…c04d)' },
      { text: 'Build finished in 72.4 s', level: 'ok' },
    ],
  },
  {
    id: 'test',
    name: 'Test',
    estimate: 64_000,
    lines: [
      { text: 'vitest run --reporter=dot --shard=1/4' },
      { text: 'pricing/cache.test.ts  12 passed' },
      { text: 'pricing/edge.test.ts  9 passed' },
      { text: 'checkout/cart.test.ts  31 passed' },
      { text: 'checkout/tax.test.ts  18 passed' },
      { text: 'checkout/refund.test.ts  1 flaky, retried, passed', level: 'warn' },
      { text: 'payments/intent.test.ts  22 passed' },
      { text: 'payments/webhook.test.ts  14 passed' },
      { text: 'api/contract.test.ts  47 passed' },
      { text: 'Coverage 91.4% (threshold 85%)' },
      { text: 'Test Files  24 passed (24)' },
      { text: 'Tests  412 passed (412)', level: 'ok' },
    ],
  },
  {
    id: 'deploy',
    name: 'Deploy',
    estimate: 30_000,
    lines: [
      { text: 'Rolling out checkout-api:9f3c2ab to canary (5%)' },
      { text: 'canary: 3/3 pods ready' },
      { text: 'Health checks: p95 212 ms, error rate 0.02%' },
      { text: 'Shifting traffic 5% → 25%' },
      { text: 'Shifting traffic 25% → 50%' },
      { text: 'Health checks: p95 208 ms, error rate 0.01%' },
      { text: 'Staged on production, waiting for promotion', level: 'ok' },
    ],
  },
]

/** The same run, where one test breaks the build. */
export const FAILING_STAGES: StagePipelineScript[] = STAGES.map((stage) =>
  stage.id !== 'test'
    ? stage
    : {
        ...stage,
        lines: [
          ...stage.lines.slice(0, 4),
          { text: 'checkout/tax.test.ts  1 failed', level: 'error' },
          { text: '  ✗ applies the reduced rate to digital goods', level: 'error' },
          { text: '    expected 1.07 to be 1.05', level: 'error' },
          { text: 'Tests  1 failed | 88 passed (89)', level: 'error', fails: true },
        ],
      },
)

export const DEFAULT_COPY = {
  /** The card's title: the run's name. */
  title: (name: string) => name,
  /** The "/ subtitle" after it. */
  subtitle: (run: string, target: string) => `Run #${run} · ${target}`,
  more: 'More actions',
  rerun: 'Re-run pipeline',
  demoData: 'Demo data',
  copyRun: 'Copy run ID',
  copied: 'Run ID copied',
  state: { running: 'Running', passed: 'Ready to promote', failed: 'Failed', promoted: 'Live', rolledBack: 'Rolled back' } as Record<StagePipelineState, string>,
  total: 'Total',
  revision: 'Commit',
  source: 'Branch',
  stageLabel: 'Stage',
  stageOf: (current: number, total: number) => `${current} of ${total}`,
  log: (stage: string) => `${stage} log`,
  lines: (count: string, n: number) => (n === 1 ? `${count} line` : `${count} lines`),
  follow: 'Follow',
  pause: 'Pause',
  newLines: (n: number) => (n === 1 ? '1 new line' : `${n} new lines`),
  queuedLog: 'Waits for the stages before it.',
  skippedLog: 'Skipped: a stage before it failed.',
  /** `{ago}` is replaced by the time since the run started, kept in its own case. */
  started: 'Started {ago} ago',
  runner: (runner: string) => `runner ${runner}`,
  promote: 'Promote',
  /** Beside Promote while it waits: the run's last stage. */
  promoteAfter: (stage: string) => `Unlocks when ${stage.toLowerCase()} passes`,
  promoteBlocked: 'Fix the failed stage to promote',
  promoting: 'Promoting…',
  promoted: 'Promoted',
  rollBack: 'Roll back',
  rollingBack: 'Rolling back…',
  rolledBack: 'Rolled back',
  announcePromoted: 'Promoted to production',
  announceRolledBack: 'Rolled back to the previous release',
}

export type StagePipelineState = 'running' | 'passed' | 'failed' | 'promoted' | 'rolledBack'
export type StagePipelineCopy = typeof DEFAULT_COPY & {
  /** The locale durations and counts are written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
