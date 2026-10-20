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

export type InviteStatus = 'valid' | 'expired' | 'member'

export interface InvitePerson {
  name: string
  email: string
  avatar?: string
}

export interface Invite {
  workspace: string
  /** An image for the workspace; its initial on the accent otherwise. */
  logo?: string
  inviter: InvitePerson
  /** The address the invite was sent to. */
  email: string
  role: string
  roleDescription: string
  memberCount: number
  /** A few faces from the workspace. */
  members: InvitePerson[]
  /** When it lapses (valid) or lapsed (expired), already phrased: "in 6 days", "3 days ago". */
  expires: string
  /** For `member`: when you joined, already phrased. */
  joined?: string
}

export interface AcceptInviteDetails {
  mode: 'sign-in' | 'create'
  email: string
  password: string
  name?: string
}

export const DEMO_INVITE: Invite = {
  workspace: 'Northwind Labs',
  inviter: { name: 'Ana Ruiz', email: 'ana@northwind.dev' },
  email: 'sam.lee@northwind.dev',
  role: 'Editor',
  roleDescription: 'Can create and edit projects, docs and boards.',
  memberCount: 24,
  members: [
    { name: 'Ana Ruiz', email: 'ana@northwind.dev' },
    { name: 'Theo Lindqvist', email: 'theo@northwind.dev' },
    { name: 'Mara Okafor', email: 'mara@northwind.dev' },
    { name: 'Jonah Beck', email: 'jonah@northwind.dev' },
  ],
  expires: 'in 6 days',
  joined: 'March 4',
}

/** Every string the page shows. Pass any of them through `copy` to rewrite or translate it. */
export const DEFAULT_COPY = {
  brand: 'Northwind',
  joinTitle: (workspace: string) => `Join ${workspace}`,
  joinDescription: (inviter: string, workspace: string) => `${inviter} invited you to collaborate in ${workspace}.`,
  invitedAs: 'Invited as',
  role: 'Role',
  members: 'Members',
  memberCount: (count: number) => `${count} ${count === 1 ? 'member' : 'members'}`,
  expires: 'Expires',
  choice: 'How do you want to join?',
  signInTab: 'I have an account',
  createTab: 'I’m new here',
  email: 'Email',
  password: 'Password',
  passwordRequired: 'Enter your password.',
  fullName: 'Full name',
  fullNamePlaceholder: 'Sam Lee',
  nameRequired: 'Enter your name.',
  newPassword: 'Choose a password',
  newPasswordHint: 'At least 8 characters.',
  passwordTooShort: 'Use at least 8 characters.',
  signInAndJoin: 'Sign in and join',
  createAndJoin: 'Create account and join',
  joining: 'Joining…',
  joinFailed: 'Couldn’t join',
  wrongAccount: (inviter: string) => `Not you? Ask ${inviter} to invite the address you use.`,
  joinedTitle: (workspace: string) => `You’re in ${workspace}`,
  joinedDescription: (role: string, inviter: string) => `You joined as ${role}. We’ve let ${inviter} know.`,
  open: (workspace: string) => `Open ${workspace}`,
  expiredTitle: 'This invite has expired',
  expiredDescription: (workspace: string, inviter: string, when: string) => `Your invite to ${workspace} lapsed ${when}. Ask ${inviter} for a new one; it’ll arrive by email.`,
  requestNew: 'Request a new invite',
  requesting: 'Sending…',
  requested: 'Request sent',
  signIn: 'Go to sign in',
  memberTitle: (workspace: string) => `You’re already in ${workspace}`,
  memberDescription: (email: string, role: string, joined: string) => `You’re signed in as ${email}, a ${role} since ${joined}. There’s nothing more to do.`,
  switchAccount: 'Use another account',
}
export type AcceptInviteCopy = typeof DEFAULT_COPY

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}
