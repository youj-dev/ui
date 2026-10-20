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

/** What `onFinish` receives. */
export interface OnboardingSetup {
  name: string
  /** The picked theme preset's id, else the app's own preset's; undefined when neither is a preset. */
  theme?: string
  invites: string[]
}

export const slug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const DEFAULT_COPY = {
  page: 'Set up your workspace',
  stepper: 'Setup',
  stepWelcome: 'Welcome',
  stepWorkspace: 'Workspace',
  stepTheme: 'Theme',
  stepInvite: 'Invite',
  welcomeTitle: (product: string) => `Welcome to ${product}`,
  welcomeDescription: 'Three quick steps and your workspace is ready: name it, make it yours, and bring your team.',
  nameTitle: 'Name your workspace',
  nameDescription: 'Usually your company or team. You can change it later.',
  nameLabel: 'Workspace name',
  namePlaceholder: 'Northwind Labs',
  nameRequired: 'Give your workspace a name.',
  url: 'URL',
  /** The workspace URL's fixed start, before the slug. */
  urlPrefix: 'northwind.dev/',
  urlFallback: 'your-team',
  urlDescription: 'Made from the name.',
  themeTitle: 'Choose a theme',
  themeDescription: 'The whole app follows it: color, corners, density and how things move.',
  themeGroup: 'Theme preset',
  themePreview: 'Deploy',
  inviteTitle: 'Invite your team',
  inviteDescription: 'They’ll get an email to join. You can skip this and invite people later.',
  email: 'Email',
  emailPlaceholder: 'name@company.com',
  emailInvalid: 'Enter an email like name@company.com.',
  emailTaken: 'Already on the list.',
  add: 'Add',
  invites: 'Invites',
  remove: (address: string) => `Remove ${address}`,
  back: 'Back',
  start: 'Get started',
  continue: 'Continue',
  finishing: 'Setting up…',
  finished: 'Ready',
  finish: (invites: number) => (invites ? `Send ${invites} ${invites === 1 ? 'invite' : 'invites'} and finish` : 'Skip and finish'),
  failed: 'Something went wrong. Try again.',
  doneTitle: 'You’re all set',
  doneDescription: (name: string, invites: number) => `${name} is ready${invites ? `, and ${invites} ${invites === 1 ? 'invite is' : 'invites are'} on the way` : ''}.`,
  openDashboard: 'Open your dashboard',
}

export type OnboardingCopy = typeof DEFAULT_COPY
