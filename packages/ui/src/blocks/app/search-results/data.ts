/* Fixtures for Kestrel's search: the documents, people and projects of one
 * workspace, as a search index would return them. `updated` is days before
 * TODAY so the date facet reads the same on every day the block is opened.
 * Swap ITEMS for your search API; the shape is the common one (a type, a
 * title, an owner, tags, a last-updated time and type-specific fields). */

export type ResultType = 'document' | 'person' | 'project'

export interface Person {
  id: string
  name: string
  initials: string
  role: string
  team: string
  location: string
  /** UTC offset in hours, for the person's local time. */
  utc: number
  email: string
}

interface Base {
  id: string
  title: string
  /** Who owns it; a person result owns itself. */
  owner: string
  /** Days before TODAY. */
  updated: number
  tags: string[]
  href: string
}

export interface DocumentItem extends Base {
  type: 'document'
  path: string[]
  excerpt: string
  minutes: number
}

export interface PersonItem extends Base {
  type: 'person'
  bio: string
}

export interface ProjectItem extends Base {
  type: 'project'
  status: 'on-track' | 'at-risk' | 'done'
  /** 0–100. */
  progress: number
  members: string[]
  due: string
  summary: string
}

export type SearchItem = DocumentItem | PersonItem | ProjectItem

/** The block's item types, under its name. */
export type SearchPerson = Person
export type SearchDocumentItem = DocumentItem
export type SearchPersonItem = PersonItem
export type SearchProjectItem = ProjectItem
export type SearchResultType = ResultType

/** The day the fixtures are relative to. */
export const TODAY = new Date(Date.UTC(2026, 8, 27, 12))

export const PEOPLE: Record<string, Person> = {
  priya: { id: 'priya', name: 'Priya Raman', initials: 'PR', role: 'Product lead', team: 'Growth', location: 'London', utc: 1, email: 'priya@kestrel.so' },
  theo: { id: 'theo', name: 'Theo Almeida', initials: 'TA', role: 'Staff engineer', team: 'Platform', location: 'Lisbon', utc: 1, email: 'theo@kestrel.so' },
  mara: { id: 'mara', name: 'Mara Lindqvist', initials: 'ML', role: 'Design lead', team: 'Design systems', location: 'Stockholm', utc: 2, email: 'mara@kestrel.so' },
  jonah: { id: 'jonah', name: 'Jonah Okafor', initials: 'JO', role: 'Engineering manager', team: 'Onboarding', location: 'Lagos', utc: 1, email: 'jonah@kestrel.so' },
  sunhee: { id: 'sunhee', name: 'Sun-hee Park', initials: 'SP', role: 'Research lead', team: 'Research', location: 'Seoul', utc: 9, email: 'sunhee@kestrel.so' },
  ines: { id: 'ines', name: 'Inês Duarte', initials: 'ID', role: 'People partner', team: 'People ops', location: 'Porto', utc: 1, email: 'ines@kestrel.so' },
  eli: { id: 'eli', name: 'Eli Brandt', initials: 'EB', role: 'Support lead', team: 'Customer', location: 'Berlin', utc: 2, email: 'eli@kestrel.so' },
}

const doc = (d: Omit<DocumentItem, 'type' | 'href'>): DocumentItem => ({ ...d, type: 'document', href: `/docs/${d.id}` })
const project = (p: Omit<ProjectItem, 'type' | 'href'>): ProjectItem => ({ ...p, type: 'project', href: `/projects/${p.id}` })
const person = (id: string, updated: number, tags: string[], bio: string): PersonItem => ({
  id: `person-${id}`,
  type: 'person',
  title: PEOPLE[id]!.name,
  owner: id,
  updated,
  tags,
  bio,
  href: `/people/${id}`,
})

export const ITEMS: SearchItem[] = [
  doc({ id: 'eng-onboarding', title: 'Engineering onboarding: your first two weeks', path: ['Engineering', 'Handbook'], owner: 'jonah', updated: 3, minutes: 8, tags: ['handbook', 'engineering'], excerpt: 'Day one is laptop, access and a pairing buddy. By the end of week two you ship a small change behind a flag and join the on-call shadow rotation.' }),
  project({ id: 'onboarding-v3', title: 'Onboarding v3: invite the team', owner: 'priya', updated: 1, status: 'on-track', progress: 62, members: ['priya', 'sunhee', 'mara', 'jonah'], due: 'Nov 14', tags: ['growth', 'planning'], summary: 'A setup flow that asks who you work with before what you work on. Ships to 10% of new workspaces on Oct 20.' }),
  person('jonah', 0, ['engineering', 'hiring'], 'Runs the Onboarding team: first-run setup, invites and the empty states that teach the product.'),
  doc({ id: 'onboarding-readout', title: 'Onboarding flow v3: research readout', path: ['Research', 'Studies'], owner: 'sunhee', updated: 12, minutes: 11, tags: ['research', 'growth'], excerpt: 'Twelve interviews with admins who churned in their first 30 days. Most never invited a teammate, and the empty workspace read as nothing to do here.' }),
  doc({ id: 'new-joiner-checklist', title: 'New joiner checklist', path: ['People', 'Handbook'], owner: 'ines', updated: 5, minutes: 4, tags: ['handbook', 'hiring'], excerpt: 'Contracts, equipment, payroll and the first-week calendar. Managers: book the 30-60-90 check-ins and an onboarding buddy before the start date.' }),
  project({ id: 'onboarding-buddies', title: 'Onboarding buddies for new engineers', owner: 'jonah', updated: 4, status: 'at-risk', progress: 35, members: ['jonah', 'theo', 'ines'], due: 'Oct 31', tags: ['engineering', 'hiring'], summary: 'Pair every new engineer with a buddy for their first month. Blocked on buddy capacity in Platform until the October hires start.' }),
  doc({ id: 'activation-metrics', title: 'Activation: when is a workspace onboarded?', path: ['Growth', 'Metrics'], owner: 'priya', updated: 26, minutes: 6, tags: ['growth', 'metrics'], excerpt: 'A workspace counts as onboarded when three people edit a doc within seven days of signup. Why onboarding stopped meaning first doc created.' }),
  person('priya', 1, ['growth', 'planning'], 'Leads activation and onboarding for new workspaces, and the Q4 planning cycle.'),
  doc({ id: 'q4-planning', title: 'Q4 planning: bets and non-goals', path: ['Company', 'Planning'], owner: 'priya', updated: 9, minutes: 12, tags: ['planning', 'growth'], excerpt: 'Three bets for Q4: onboarding that invites the team, a faster editor, and audit logs for enterprise. And what we are explicitly not doing.' }),
  doc({ id: 'design-onboarding', title: 'Design onboarding: tokens, libraries and review', path: ['Design', 'Handbook'], owner: 'mara', updated: 40, minutes: 7, tags: ['handbook', 'design'], excerpt: 'How the token contract flows from Figma variables into code, where the libraries live, and how design review runs on Thursdays.' }),
  person('eli', 6, ['customer'], 'Owns customer onboarding for the EMEA book and the help center.'),
  doc({ id: 'welcome-emails', title: 'Welcome email sequence: copy and timing', path: ['Growth', 'Lifecycle'], owner: 'priya', updated: 33, minutes: 5, tags: ['growth', 'lifecycle'], excerpt: 'Five emails over fourteen days, sent on what the admin has and hasn’t done. The onboarding checklist link doubled clicks in July.' }),
  doc({ id: 'support-playbook', title: 'Customer onboarding playbook', path: ['Customer', 'Playbooks'], owner: 'eli', updated: 70, minutes: 9, tags: ['customer', 'playbook'], excerpt: 'What to send on day 1, 7 and 30, which accounts get a live walkthrough, and when support hands an account to success.' }),
  person('ines', 11, ['hiring'], 'People partner for Engineering and Design. Runs new joiner onboarding and the interview loop.'),
  doc({ id: 'sso-scim', title: 'Setting up SSO and SCIM for enterprise', path: ['Engineering', 'Guides'], owner: 'theo', updated: 150, minutes: 8, tags: ['security', 'customer'], excerpt: 'Okta, Entra ID and Google Workspace: onboarding a customer’s identity provider, mapping groups to roles, and the test tenant.' }),
  project({ id: 'help-center', title: 'Help center rewrite', owner: 'eli', updated: 25, status: 'done', progress: 100, members: ['eli', 'mara'], due: 'Sep 5', tags: ['customer', 'playbook'], summary: 'Forty articles rewritten around jobs, not features, starting with onboarding guides for admins. Search deflection is up 18%.' }),
  doc({ id: 'incident-runbook', title: 'Incident response runbook', path: ['Engineering', 'Runbooks'], owner: 'theo', updated: 18, minutes: 10, tags: ['engineering', 'security'], excerpt: 'Declare early, name an incident lead, open a channel. Severity levels, who to page, and the template for the public status update.' }),
  project({ id: 'audit-logs', title: 'Enterprise audit logs', owner: 'theo', updated: 2, status: 'on-track', progress: 80, members: ['theo', 'eli'], due: 'Oct 24', tags: ['security', 'customer'], summary: 'Every workspace change, who made it and from where, exportable as CSV and streamed to a SIEM.' }),
  doc({ id: 'editor-budget', title: 'Editor performance budget', path: ['Engineering', 'RFCs'], owner: 'theo', updated: 22, minutes: 9, tags: ['engineering', 'rfc'], excerpt: 'Keystroke to paint under 16 ms on a 2019 laptop for documents up to 50 pages, the profiling setup, and three regressions fixed in August.' }),
  project({ id: 'faster-editor', title: 'Faster editor', owner: 'theo', updated: 6, status: 'on-track', progress: 48, members: ['theo', 'mara'], due: 'Dec 12', tags: ['engineering', 'rfc'], summary: 'Hold the editor performance budget on the largest 1% of documents: virtualised blocks and an incremental parser.' }),
  doc({ id: 'interview-loop', title: 'Engineering interview loop', path: ['People', 'Hiring'], owner: 'ines', updated: 210, minutes: 7, tags: ['hiring', 'engineering'], excerpt: 'Four stages and one take-home. What each interviewer owns, the rubric, and how a debrief reaches a decision within 48 hours.' }),
  doc({ id: 'design-review', title: 'Design review: how to ask for feedback', path: ['Design', 'Rituals'], owner: 'mara', updated: 95, minutes: 5, tags: ['design', 'handbook'], excerpt: 'Bring the problem, not the pixels. Say what kind of feedback you need, and who decides once the review is over.' }),
  person('mara', 3, ['design'], 'Leads Design systems: tokens, the Figma libraries and design review.'),
  person('theo', 2, ['engineering', 'security'], 'Platform: the editor, performance and enterprise security (SSO, SCIM, audit logs).'),
  doc({ id: 'research-repository', title: 'Research repository: tagging a study', path: ['Research', 'Handbook'], owner: 'sunhee', updated: 300, minutes: 4, tags: ['research', 'handbook'], excerpt: 'One study, one page: the question, who we spoke to, what we heard, and the tags that let the next team find it.' }),
  person('sunhee', 8, ['research'], 'Research lead. Runs the interview program and the research repository.'),
  project({ id: 'design-tokens', title: 'Design tokens 2.0', owner: 'mara', updated: 60, status: 'done', progress: 100, members: ['mara', 'theo'], due: 'Jul 30', tags: ['design'], summary: 'One token contract from Figma variables to CSS, with a light and dark mode per theme and a lint that rejects raw colors.' }),
]

export const TYPES: { value: ResultType; label: string; plural: string }[] = [
  { value: 'document', label: 'Document', plural: 'Documents' },
  { value: 'person', label: 'Person', plural: 'People' },
  { value: 'project', label: 'Project', plural: 'Projects' },
]

export const UPDATED = [
  { value: 'any', label: 'Any time', days: Infinity },
  { value: '7d', label: 'Past week', days: 7 },
  { value: '30d', label: 'Past month', days: 30 },
  { value: '90d', label: 'Past 3 months', days: 90 },
  { value: '1y', label: 'Past year', days: 365 },
] as const

export type Updated = (typeof UPDATED)[number]['value']

export const POPULAR = ['onboarding', 'incident runbook', 'q4 planning', 'design review', 'sso', 'interview loop']
export const RECENT = ['audit logs', 'editor performance', 'welcome email']

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
