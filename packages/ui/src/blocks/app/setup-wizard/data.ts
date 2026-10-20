import { z } from 'zod'
import { dateTimeFormat } from '../../../lib/utils'

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

const startOfToday = () => new Date(new Date().setHours(0, 0, 0, 0))

export const DEFAULT_COPY = {
  section: 'People',
  title: 'Onboard a new hire',
  description: 'Set up their accounts, laptop and first day. It takes about five minutes.',
  progress: 'Profile',
  continue: 'Continue',
  send: 'Send invite',
  sent: 'Invite sent',
  saveDraft: 'Save draft',
  saving: 'Saving…',
  saved: 'Saved',
  unsaved: 'Unsaved changes',
  notSaved: 'Not saved yet',
  draftSaved: (time: string) => `Draft saved at ${time}`,
  draftRestored: 'Draft restored',
  failed: 'Something went wrong. Try again.',
  personalTitle: 'Personal details',
  personalDescription: 'Who’s joining, and how to reach them before day one.',
  roleTitle: 'Role',
  roleDescription: 'What they’ll do, with whom, and from when.',
  setupTitle: 'Accounts and equipment',
  setupDescription: 'Everything ready on their desk the morning they arrive.',
  reviewTitle: 'Review',
  reviewDescription: 'Check the details. We’ll email the invite as soon as you send it.',
  firstName: 'First name',
  firstNamePlaceholder: 'Maya',
  firstNameRequired: 'Enter their first name.',
  lastName: 'Last name',
  lastNamePlaceholder: 'Chen',
  lastNameRequired: 'Enter their last name.',
  email: 'Personal email',
  emailDescription: 'Where the invite goes. They’ll get a work address on day one.',
  emailPlaceholder: 'maya@example.com',
  emailRequired: 'Enter a personal email for the invite.',
  emailInvalid: 'Enter an email like maya@example.com.',
  phone: 'Mobile',
  phoneDescription: 'For the welcome text and building access.',
  phoneInvalid: 'Enter a phone number we can text on day one.',
  jobTitle: 'Job title',
  jobTitlePlaceholder: 'Product designer',
  jobTitleRequired: 'Enter their job title.',
  team: 'Team',
  teamPlaceholder: 'Choose a team',
  teamRequired: 'Choose the team they’re joining.',
  startDate: 'Start date',
  startDateDescription: 'Weekdays only.',
  startDateRequired: 'Pick their first day.',
  startDatePast: 'Pick a day from today onwards.',
  employment: 'Employment',
  fullTime: 'Full-time',
  partTime: 'Part-time',
  contract: 'Contract',
  laptop: 'Laptop',
  laptopDescription: 'Ships to arrive the Friday before they start.',
  laptopPlaceholder: 'Choose a laptop',
  laptopRequired: 'Choose a laptop, or that they’ll bring their own.',
  accounts: 'Accounts',
  accountsDescription: 'Google Workspace is always set up. Add the rest they’ll need.',
  /** The account every hire gets, listed first in the review. */
  baseAccount: 'Google Workspace',
  note: 'Welcome note',
  noteDescription: (left: number) => `Optional. Shown on their first login. ${left} characters left.`,
  notePlaceholder: 'A line or two from you',
  noteTooLong: 'Keep the note under 280 characters.',
  name: 'Name',
  edit: 'Edit',
  editSection: (title: string) => `Edit ${title.toLowerCase()}`,
  jobTitleShort: 'Title',
  starts: 'Starts',
  doneTitle: (firstName: string) => `${firstName} is all set`,
  doneDescription: (email: string, day: string, byod: boolean) =>
    `We’ve sent an invite to ${email}. Their ${byod ? 'accounts are' : 'laptop and accounts will be'} ready for ${day}.`,
  another: 'Onboard someone else',
  viewProfile: 'View profile',
}

export type WizardCopy = typeof DEFAULT_COPY

/** Each step's zod schema, with its messages from `copy`. */
export const makeSchemas = (c: WizardCopy) => ({
  personal: z.object({
    firstName: z.string().trim().min(1, c.firstNameRequired),
    lastName: z.string().trim().min(1, c.lastNameRequired),
    email: z.string().trim().min(1, c.emailRequired).email(c.emailInvalid),
    phone: z.string().refine((v) => /^\+\d{8,15}$/.test(v), c.phoneInvalid),
  }),
  role: z.object({
    title: z.string().trim().min(2, c.jobTitleRequired),
    team: z.string().min(1, c.teamRequired),
    type: z.enum(['full-time', 'part-time', 'contract']),
    startDate: z
      .date()
      .nullable()
      .refine((d) => d !== null, c.startDateRequired)
      .refine((d) => !d || d >= startOfToday(), c.startDatePast),
  }),
  setup: z.object({
    laptop: z.string().min(1, c.laptopRequired),
    slack: z.boolean(),
    github: z.boolean(),
    figma: z.boolean(),
    note: z.string().max(280, c.noteTooLong),
  }),
})

const schemas = makeSchemas(DEFAULT_COPY)
export const personalSchema = schemas.personal
export const roleSchema = schemas.role
export const setupSchema = schemas.setup

export type Personal = z.input<typeof personalSchema>
export type Role = z.input<typeof roleSchema>
export type Setup = z.input<typeof setupSchema>
export type NewHire = Personal & Role & Setup

export const EMPTY: NewHire = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  title: '',
  team: '',
  type: 'full-time',
  startDate: null,
  laptop: '',
  slack: true,
  github: false,
  figma: false,
  note: '',
}

export const TEAMS: Record<string, string> = {
  design: 'Design',
  engineering: 'Engineering',
  marketing: 'Marketing',
  operations: 'Operations',
  sales: 'Sales',
  support: 'Customer support',
}

export const typesFor = (c: WizardCopy): Record<Role['type'], string> => ({ 'full-time': c.fullTime, 'part-time': c.partTime, contract: c.contract })

export const LAPTOPS: Record<string, string> = {
  pro: 'MacBook Pro 14″',
  air: 'MacBook Air 13″',
  byod: 'They’ll bring their own',
}

/** An account the setup step can switch on; the ids are the hire's three account fields. */
export interface NewHireAccount {
  id: 'slack' | 'github' | 'figma'
  label: string
  description: string
}

export const ACCOUNTS: NewHireAccount[] = [
  { id: 'slack', label: 'Slack', description: 'Added to #general and their team’s channel' },
  { id: 'github', label: 'GitHub', description: 'A seat in the Northwind organization' },
  { id: 'figma', label: 'Figma', description: 'An editor seat in the design team' },
]

/** The fields a finished profile needs; the progress bar counts them. */
const REQUIRED: (keyof NewHire)[] = ['firstName', 'lastName', 'email', 'phone', 'title', 'team', 'startDate', 'laptop']

export function completeness(v: NewHire) {
  const filled = REQUIRED.filter((key) => {
    const value = v[key]
    if (key === 'phone') return /^\+\d{8,15}$/.test(String(value))
    return value instanceof Date || (typeof value === 'string' && value.trim() !== '')
  }).length
  return Math.round((filled / REQUIRED.length) * 100)
}

export const formatDay = (date: Date | null, locale: string) =>
  date ? dateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(date) : '—'

/** "+14155550132" as "+1 415 555 0132"; others as given. */
export const formatPhone = (e164: string) => {
  const us = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164)
  return us ? `+1 ${us[1]} ${us[2]} ${us[3]}` : e164
}

export const formatTime = (date: Date, locale: string) => dateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(date)

/** The next Monday at least a week out: a believable first day. */
export function nextStart(from = new Date()) {
  const day = new Date(from)
  day.setHours(0, 0, 0, 0)
  day.setDate(day.getDate() + 7 + ((8 - day.getDay()) % 7))
  return day
}

/** A draft saved earlier, with everything filled in, so it opens ready to review. */
export const sampleDraft = (): Partial<NewHire> => ({
  firstName: 'Maya',
  lastName: 'Chen',
  email: 'maya.chen@example.com',
  phone: '+14155550132',
  title: 'Product designer',
  team: 'design',
  type: 'full-time',
  startDate: nextStart(),
  laptop: 'pro',
  slack: true,
  github: false,
  figma: true,
  note: 'Welcome aboard, Maya! Your first week is mostly coffee and context. We’re so glad you’re here.',
})
