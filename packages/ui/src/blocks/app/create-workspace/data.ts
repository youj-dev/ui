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

export interface Option {
  value: string
  label: string
}

export interface CreateWorkspaceResult {
  name: string
  slug: string
  logo?: File
  teamSize: string
  useCase: string
  invites: string[]
  role: string
}

export type SlugStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'taken'

/** Every string the flow shows. Pass any of them through `copy` to rewrite or translate it. */
export const DEFAULT_COPY = {
  brand: 'Northwind',
  title: 'Create a workspace',
  subtitle: 'A home for your team’s projects, docs and people. It takes a minute.',
  stepWorkspace: 'Workspace',
  stepWorkspaceDescription: 'Name it after your company or team. You can change all of this later.',
  stepTeam: 'Your team',
  stepTeamDescription: 'So we can set sensible defaults. It isn’t shared with anyone.',
  stepInvite: 'Invite your team',
  stepInviteDescription: 'Workspaces work better together. Invites are valid for 7 days.',
  name: 'Workspace name',
  namePlaceholder: 'Northwind Labs',
  nameRequired: 'Give your workspace a name.',
  url: 'Workspace URL',
  urlPrefix: 'app.northwind.dev/',
  slugHint: 'Lowercase letters, numbers and hyphens.',
  slugChecking: 'Checking availability…',
  slugAvailable: (slug: string) => `${slug} is available.`,
  slugTaken: (slug: string) => `${slug} is taken. Try another.`,
  slugInvalid: 'Use 3–40 lowercase letters, numbers or hyphens, not starting or ending with a hyphen.',
  logo: 'Logo',
  logoHint: 'Optional',
  teamSize: 'Team size',
  teamSizePlaceholder: 'How many people?',
  teamSizeRequired: 'Choose a team size.',
  useCase: 'What will you use it for?',
  useCasePlaceholder: 'Choose one',
  useCaseRequired: 'Choose what you’ll use it for.',
  emails: 'Email addresses',
  emailsPlaceholder: 'name@company.com, …',
  emailsHint: 'Press Enter or comma after each, or paste a list.',
  emailInvalid: (value: string) => `“${value}” isn’t an email address.`,
  role: 'Role',
  invitesRequired: 'Add at least one email, or skip for now.',
  back: 'Back',
  next: 'Continue',
  skip: 'Skip for now',
  sendInvites: (count: number) => (count ? `Send ${count} ${count === 1 ? 'invite' : 'invites'}` : 'Send invites'),
  creating: 'Creating…',
  created: 'Created',
  doneTitle: (name: string) => `${name} is ready`,
  doneDescription: (url: string, invites: number) =>
    invites ? `It lives at ${url}, and ${invites} ${invites === 1 ? 'invite is' : 'invites are'} on the way.` : `It lives at ${url}. You can invite people from Settings any time.`,
  open: 'Open workspace',
  teamSizes: [
    { value: '1', label: 'Just me' },
    { value: '2-10', label: '2–10 people' },
    { value: '11-50', label: '11–50 people' },
    { value: '51-200', label: '51–200 people' },
    { value: '200+', label: 'More than 200' },
  ] as Option[],
  useCases: [
    { value: 'engineering', label: 'Engineering & product' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operations', label: 'Operations' },
    { value: 'personal', label: 'Personal projects' },
  ] as Option[],
  roles: [
    { value: 'member', label: 'Member' },
    { value: 'admin', label: 'Admin' },
    { value: 'viewer', label: 'Viewer' },
  ] as Option[],
}
export type CreateWorkspaceCopy = typeof DEFAULT_COPY

export const toSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 40)

export const validSlug = (slug: string) => /^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/.test(slug)

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const TAKEN = new Set(['acme', 'admin', 'api', 'app', 'northwind', 'settings', 'www'])

/** The demo's availability check. Swap in a request to your API. */
export async function demoCheckSlug(slug: string) {
  await demo('CreateWorkspace: checkSlug', 450)
  return !TAKEN.has(slug)
}

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}
