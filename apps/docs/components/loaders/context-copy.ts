import type { LoaderEntry } from './catalog'

/* The screen a loader is shown in when the stage's view is In context (./context draws them): a screen where a large
 * loader is the natural thing to wait on, chosen by its category: a deploy's status page, an upload's processing card,
 * an assistant thinking, a dashboard's chart while its numbers come, an app's launch screen. Each keeps the loader as
 * large as it is on its own, the screen's words few. Plain data, so the hero can name what the stage shows before the
 * screens' code has arrived. */

export type ContextKind = 'build' | 'upload' | 'assistant' | 'dashboard' | 'splash'

export interface ContextCopy {
  kind: ContextKind
  /** The screen's title: the project, the panel, the app. */
  title: string
  /** A word at the title bar's end: the environment, the plan, the range. */
  badge?: string
  /** What it's waiting on: under the loader when its own label isn't shown. */
  status: string
  /** One line of detail: the commit, the file's size and step, what the assistant is reading, the metrics. */
  detail: string
  /** How far along a build or an upload is. */
  progress?: number
  /** A build's steps, done up to the one under way. */
  steps?: readonly string[]
  /** The file an upload is processing. */
  file?: string
  /** What the assistant was asked. */
  prompt?: string
  /** A dashboard's figures, waiting on their numbers. */
  figures?: readonly string[]
}

const SPLASH: ContextCopy = { kind: 'splash', title: 'Acme', status: 'Preparing your workspace', detail: 'v4.2.0 · eu-west-1' }

/** Each category's screen and its words. */
const BY_CATEGORY: Record<string, ContextCopy> = {
  software: { kind: 'build', title: 'acme/web', badge: 'Production', status: 'Building', detail: 'main · a1c9e3f · Tighten the checkout flow', progress: 62, steps: ['Install', 'Build', 'Deploy'] },
  interface: { kind: 'build', title: 'nightly-import', badge: 'Scheduled', status: 'Sorting and merging', detail: '14,203 records · started 2 min ago', progress: 48, steps: ['Fetch', 'Merge', 'Index'] },
  geometry: { kind: 'upload', title: 'Upload', status: 'Processing tower.glb', detail: '24.6 MB · generating previews', progress: 68, file: 'tower.glb' },
  mechanics: { kind: 'upload', title: 'Upload', status: 'Converting housing.step', detail: '48.2 MB · meshing 1,204 faces', progress: 35, file: 'housing.step' },
  orbs: { kind: 'assistant', title: 'Assistant', badge: 'Pro', status: 'Thinking', detail: 'Reading 14 incident reports', prompt: 'Summarize last week’s incident reports' },
  science: { kind: 'assistant', title: 'Research', badge: 'Lab', status: 'Analyzing', detail: 'Comparing three assays', prompt: 'Compare the three assays and flag the outliers' },
  signal: { kind: 'dashboard', title: 'Analytics', badge: 'Last 30 days', status: 'Loading results', detail: 'Traffic · revenue · retention', figures: ['Visitors', 'Revenue', 'Conversion'] },
  waves: { kind: 'dashboard', title: 'Network', badge: 'Live', status: 'Fetching live data', detail: 'Latency by region', figures: ['p50 latency', 'p95 latency', 'Errors'] },
  depth: SPLASH,
  glyph: { kind: 'splash', title: 'Workspace', status: 'Signing you in', detail: 'Secured · single sign-on' },
}

/** The screen a loader is shown in, and its words. */
export const contextFor = (entry: Pick<LoaderEntry, 'category'>): ContextCopy => BY_CATEGORY[entry.category] ?? SPLASH

const KIND_NAME: Record<ContextKind, string> = {
  build: 'a deploy’s status page',
  upload: 'an upload’s processing card',
  assistant: 'an assistant thinking',
  dashboard: 'a dashboard’s chart',
  splash: 'an app’s launch screen',
}

/** What the stage shows, in words: `Build in a deploy’s status page: Building.` */
export const contextLabel = (name: string, copy: ContextCopy) => `${name} in ${KIND_NAME[copy.kind]}: ${copy.status}.`
