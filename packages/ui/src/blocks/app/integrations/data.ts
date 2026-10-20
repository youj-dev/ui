import type { ReactNode } from 'react'

const CATEGORIES = ['Communication', 'Developer tools', 'Project management', 'Analytics', 'Payments', 'Storage']
type Category = string
type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'ink'

interface App {
  id: string
  name: string
  vendor: string
  /** One of the `categories`. */
  category: Category
  blurb: string
  /** The monogram's colour when there's no `logo`. */
  tone: Tone
  installs: number
  verified?: boolean
  /** What it can do, one line each. */
  abilities: string[]
  /** What it will be able to access, one line each. */
  permissions: string[]
  /** Your logo, drawn in the monogram's square. Default: the name's initials. */
  logo?: ReactNode
  /** The sheet's carousel slides (images, usually). Default: three drawn placeholders. */
  screenshots?: ReactNode[]
}

/** The banner above the grid, for one app. */
interface IntegrationFeature {
  /** The featured app's id. */
  id: string
  eyebrow: string
  title: string
  description: string
}

const APPS: App[] = [
  { id: 'parley', name: 'Parley', vendor: 'Parley Inc.', category: 'Communication', tone: 'accent', installs: 48_200, verified: true, blurb: 'Post runs, failures and approvals to channels, and approve steps from a thread.', abilities: ['Send run summaries to a channel', 'Approve gated steps with a reaction', 'Mention owners on failure'], permissions: ['Post messages to channels you pick', 'Read channel names', 'Read your profile'] },
  { id: 'relay-mail', name: 'Relay Mail', vendor: 'Relay', category: 'Communication', tone: 'warning', installs: 12_900, blurb: 'Transactional email with templates, retries and delivery webhooks.', abilities: ['Send templated email', 'Retry soft bounces', 'Track opens and clicks'], permissions: ['Send email on your behalf', 'Read delivery events'] },
  { id: 'echo', name: 'Echo Voice', vendor: 'Echo Labs', category: 'Communication', tone: 'danger', installs: 3_400, blurb: 'Call the on-call engineer when a workflow pages, and read the incident aloud.', abilities: ['Place calls from a step', 'Escalate after a timeout'], permissions: ['Place phone calls', 'Read on-call schedules'] },
  { id: 'forge', name: 'Forge', vendor: 'Forge Git', category: 'Developer tools', tone: 'ink', installs: 61_000, verified: true, blurb: 'Trigger workflows on push, pull request or tag, and report status checks back.', abilities: ['Trigger on push, PR or tag', 'Report status checks', 'Open PRs from a step'], permissions: ['Read repository contents', 'Write commit statuses', 'Create pull requests'] },
  { id: 'sentinel', name: 'Sentinel', vendor: 'Sentinel Systems', category: 'Developer tools', tone: 'danger', installs: 22_700, verified: true, blurb: 'Turn new error groups into workflow runs, with the stack trace attached.', abilities: ['Trigger on new error groups', 'Resolve issues from a step'], permissions: ['Read issues and events', 'Resolve issues'] },
  { id: 'pipeline', name: 'Pipeline CI', vendor: 'Pipeline', category: 'Developer tools', tone: 'success', installs: 9_800, blurb: 'Kick off builds, wait for them, and branch on the result.', abilities: ['Start builds', 'Wait for completion', 'Fetch artifacts'], permissions: ['Start and cancel builds', 'Read build logs'] },
  { id: 'tracklight', name: 'Tracklight', vendor: 'Tracklight', category: 'Project management', tone: 'accent', installs: 30_100, verified: true, blurb: 'Two-way sync between runs and issues: open, update and close from either side.', abilities: ['Create issues from failures', 'Sync status both ways', 'Link runs to issues'], permissions: ['Read and write issues', 'Read teams and projects', 'Receive webhooks'] },
  { id: 'kanso', name: 'Kanso Boards', vendor: 'Kanso', category: 'Project management', tone: 'success', installs: 7_600, blurb: 'Move cards when a workflow reaches a stage, and start one when a card moves.', abilities: ['Move cards between lists', 'Trigger on card moves'], permissions: ['Read and write boards'] },
  { id: 'chronicle', name: 'Chronicle', vendor: 'Chronicle Docs', category: 'Project management', tone: 'warning', installs: 5_200, blurb: 'Write run reports into a living doc, one section per release.', abilities: ['Append sections to a doc', 'Embed charts'], permissions: ['Edit docs you share with it'] },
  { id: 'lumen', name: 'Lumen', vendor: 'Lumen Analytics', category: 'Analytics', tone: 'warning', installs: 18_300, verified: true, blurb: 'Send workflow events to your product analytics and trigger on cohorts.', abilities: ['Track custom events', 'Trigger on cohort entry'], permissions: ['Write events', 'Read cohorts'] },
  { id: 'tally', name: 'Tally', vendor: 'Tally Metrics', category: 'Analytics', tone: 'ink', installs: 4_100, blurb: 'Push run durations and costs to dashboards, with alerts on regressions.', abilities: ['Emit metrics', 'Alert on thresholds'], permissions: ['Write metrics', 'Create alerts'] },
  { id: 'coinlane', name: 'Coinlane', vendor: 'Coinlane Payments', category: 'Payments', tone: 'success', installs: 26_400, verified: true, blurb: 'Start workflows on charges, refunds and disputes, and issue refunds from a step.', abilities: ['Trigger on payment events', 'Issue refunds', 'Look up customers'], permissions: ['Read payments and customers', 'Create refunds'] },
  { id: 'invoicely', name: 'Invoicely', vendor: 'Invoicely', category: 'Payments', tone: 'accent', installs: 6_900, blurb: 'Draft, send and chase invoices when a project milestone closes.', abilities: ['Draft and send invoices', 'Send reminders'], permissions: ['Create invoices', 'Read clients'] },
  { id: 'stash', name: 'Crate Drive', vendor: 'Crate', category: 'Storage', tone: 'accent', installs: 14_500, blurb: 'Save artifacts and exports to folders, and trigger on new files.', abilities: ['Upload files', 'Trigger on new files', 'Share links'], permissions: ['Read and write files in one folder'] },
  { id: 'vaultbox', name: 'Vaultbox', vendor: 'Vaultbox', category: 'Storage', tone: 'ink', installs: 2_800, blurb: 'Encrypted archive for audit logs, retained by policy.', abilities: ['Archive logs', 'Apply retention policies'], permissions: ['Write to archives', 'Read retention policies'] },
]

const TONE: Record<Tone, string> = {
  accent: 'bg-accent-subtle text-accent-text',
  success: 'bg-success-subtle text-success-text',
  warning: 'bg-warning-subtle text-warning-text',
  danger: 'bg-danger-subtle text-danger-text',
  ink: 'bg-fg text-canvas',
}

const FEATURED: IntegrationFeature = {
  id: 'tracklight',
  eyebrow: 'New · two-way sync',
  title: 'Tracklight now updates issues as runs change',
  description: 'Failures open issues, fixes close them, and comments flow both ways.',
}

const INSTALLED = ['parley', 'forge', 'lumen']

const DEFAULT_COPY = {
  title: 'Integrations',
  description: 'Connect the tools your workflows touch.',
  tagline: 'Workflow automation',
  installedCount: 'installed',
  search: 'Search integrations',
  searchPlaceholder: (count: number) => `Search ${count} integrations`,
  show: 'Show',
  all: 'All',
  installed: 'Installed',
  categories: 'Categories',
  allCategories: 'All',
  /** The noun after the count over the grid. */
  count: (count: number) => (count === 1 ? 'integration' : 'integrations'),
  inCategory: (category: string) => ` in ${category}`,
  list: 'Integrations',
  loading: 'Loading integrations',
  emptyTitle: 'Nothing matches',
  emptyInstalled: 'None of your installed apps match. Try All.',
  emptyAll: 'Try another word, or request an integration.',
  verified: 'Verified',
  installs: (count: string) => `${count} installs`,
  byVendor: (vendor: string, installs: string) => `by ${vendor} · ${installs} installs`,
  screenshots: (name: string) => `${name} screenshots`,
  screenshot: (n: number, total: number) => `Screenshot ${n} of ${total}`,
  abilities: 'What it can do',
  permissions: 'It will be able to',
  install: (name: string) => `Install ${name}`,
  installing: 'Installing…',
  uninstall: 'Uninstall',
  removing: 'Removing…',
  removed: 'Removed',
  featured: 'Featured',
  manage: 'Manage',
  seeHow: 'See how it works',
  errorTitle: 'Couldn’t load integrations',
  retry: 'Retry',
  failed: 'Something went wrong. Try again.',
}

type IntegrationsCopy = typeof DEFAULT_COPY

export { APPS, CATEGORIES, DEFAULT_COPY, FEATURED, INSTALLED, TONE, type App, type Category, type IntegrationFeature, type IntegrationsCopy, type Tone }
