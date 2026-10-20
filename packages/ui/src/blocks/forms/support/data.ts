import type { ComponentType } from 'react'
import { BugIcon, KeyIcon, LightbulbIcon, MessageIcon, ReceiptIcon } from '@youj/icons'
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

export interface SupportOption {
  value: string
  label: string
  /** Choosing it sets how soon the team answers, in working hours (a blocking bug sooner). */
  replyHours?: number
}

/** A field a topic adds. */
export interface SupportField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'segmented'
  required?: boolean
  description?: string
  placeholder?: string
  options?: SupportOption[]
  /** Where it starts (a segmented control always has one). */
  defaultValue?: string
}

export interface SupportTopic {
  id: string
  label: string
  description?: string
  icon?: ComponentType<{ size?: number; className?: string }>
  /** What this topic asks for, between the topic and the subject. */
  fields?: SupportField[]
  /** How soon the team answers it, in working hours. Default: `replyHours`. */
  replyHours?: number
  /** Offer to include the browser, system and app details (a bug). */
  diagnostics?: boolean
  subjectPlaceholder?: string
}

/** When the team works, on its own clock. */
export interface SupportHours {
  /** An IANA time zone: "Europe/Berlin". */
  timeZone: string
  /** Working days, 0 for Sunday to 6 for Saturday. */
  days: number[]
  /** The hour work starts and ends, 0–24, on the team's clock. */
  open: number
  close: number
}

/** A help article offered for what's typed in the subject. */
export interface SupportArticle {
  id: string
  title: string
  href: string
  /** A line on what it answers. */
  excerpt?: string
}

/** What `onSubmit` receives. */
export interface SupportTicket {
  topic: string
  /** Where the reply goes: the signed-in user's address, or the one typed. */
  email: string
  subject: string
  message: string
  /** The answers to the topic's own fields, by field id. */
  fields: Record<string, string>
  /** The files that finished uploading. */
  attachments: File[]
  /** The browser, system and app details, when the person chose to include them. */
  diagnostics: Record<string, string> | null
  /** When a reply is due, by the team's hours. */
  replyBy: Date
}

export const SUPPORT_TOPICS: SupportTopic[] = [
  {
    id: 'bug',
    label: 'Something’s broken',
    description: 'Errors, crashes, lost work',
    icon: BugIcon,
    diagnostics: true,
    subjectPlaceholder: 'The board won’t load after the update',
    fields: [
      {
        id: 'where',
        label: 'Where did it happen?',
        type: 'select',
        required: true,
        options: [
          { value: 'web', label: 'Web app' },
          { value: 'desktop', label: 'Desktop app' },
          { value: 'ios', label: 'iPhone or iPad' },
          { value: 'android', label: 'Android' },
          { value: 'api', label: 'The API' },
        ],
      },
      {
        id: 'impact',
        label: 'How bad is it?',
        type: 'segmented',
        defaultValue: 'annoying',
        options: [
          { value: 'annoying', label: 'Annoying' },
          { value: 'blocking', label: 'Blocking work', replyHours: 2 },
          { value: 'data', label: 'Data at risk', replyHours: 1 },
        ],
      },
    ],
  },
  {
    id: 'billing',
    label: 'Billing',
    description: 'Invoices, refunds, plans',
    icon: ReceiptIcon,
    subjectPlaceholder: 'I was charged twice in October',
    fields: [
      { id: 'invoice', label: 'Invoice number', type: 'text', placeholder: 'INV-2026-0042', description: 'On the invoice’s top line, if it’s about one.' },
    ],
  },
  {
    id: 'account',
    label: 'Account and access',
    description: 'Sign-in, two-factor, SSO',
    icon: KeyIcon,
    replyHours: 2,
    subjectPlaceholder: 'I lost the phone with my two-factor codes',
    fields: [
      {
        id: 'problem',
        label: 'What’s happening?',
        type: 'select',
        required: true,
        options: [
          { value: 'signin', label: 'I can’t sign in' },
          { value: 'two-factor', label: 'I lost my two-factor device' },
          { value: 'sso', label: 'Single sign-on isn’t working' },
          { value: 'owner', label: 'The workspace needs a new owner' },
        ],
      },
    ],
  },
  { id: 'idea', label: 'An idea', description: 'Requests and feedback', icon: LightbulbIcon, replyHours: 24, subjectPlaceholder: 'Let me group boards by client' },
  { id: 'other', label: 'Something else', description: 'Anything not above', icon: MessageIcon },
]

export const SUPPORT_HOURS: SupportHours = { timeZone: 'Europe/Berlin', days: [1, 2, 3, 4, 5], open: 9, close: 18 }

const ARTICLES: (SupportArticle & { topic: string; words: string })[] = [
  { id: 'a1', topic: 'bug', title: 'Boards that won’t load', href: '#help/boards-loading', excerpt: 'Clear the cache, check extensions, see what’s down.', words: 'board load loading blank slow update spinner' },
  { id: 'a2', topic: 'bug', title: 'Getting work back after a crash', href: '#help/recover', excerpt: 'Every change is kept for 30 days in History.', words: 'crash lost work deleted recover undo history' },
  { id: 'a3', topic: 'bug', title: 'Sync stuck on “Saving…”', href: '#help/sync', excerpt: 'What the sync dot means, and how to retry.', words: 'sync saving stuck offline save' },
  { id: 'a4', topic: 'billing', title: 'Why was I charged twice?', href: '#help/double-charge', excerpt: 'A pending hold drops off in three to five days.', words: 'charged twice double charge refund hold' },
  { id: 'a5', topic: 'billing', title: 'Download an invoice', href: '#help/invoices', excerpt: 'Settings, Billing, then the invoice’s menu.', words: 'invoice receipt download pdf vat' },
  { id: 'a6', topic: 'billing', title: 'Change or cancel your plan', href: '#help/plans', excerpt: 'Downgrades apply at the end of the period.', words: 'plan cancel downgrade upgrade seats' },
  { id: 'a7', topic: 'account', title: 'Lost your two-factor device', href: '#help/2fa-lost', excerpt: 'Use a backup code, or verify by email.', words: 'two-factor 2fa phone lost codes backup device' },
  { id: 'a8', topic: 'account', title: 'Fix single sign-on errors', href: '#help/sso', excerpt: 'The usual SAML mistakes and how to read the log.', words: 'sso saml okta single sign-on login sign in' },
  { id: 'a9', topic: 'idea', title: 'How we pick what to build', href: '#help/roadmap', excerpt: 'Every request is read and tallied.', words: 'idea feature request roadmap group board' },
]

/** The demo's help center: articles whose words match what's typed, the topic's first. */
export async function demoArticles(query: string, topic: string): Promise<SupportArticle[]> {
  await demo('SupportRequest: onSearchArticles', 300)
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2)
  const score = (a: (typeof ARTICLES)[number]) => words.filter((w) => `${a.title} ${a.words}`.toLowerCase().includes(w)).length + (a.topic === topic ? 0.5 : 0)
  return ARTICLES.filter((a) => score(a) >= 1)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 3)
    .map(({ id, title, href, excerpt }) => ({ id, title, href, excerpt }))
}

export const DEFAULT_COPY = {
  title: 'Contact support',
  description: 'A person reads every request.',
  topic: 'What do you need help with?',
  email: 'Your email',
  emailPlaceholder: 'name@company.com',
  topicMissing: 'Choose what it’s about.',
  emailMissing: 'Enter the email we should reply to.',
  emailInvalid: 'Enter an email like name@company.com.',
  subject: 'Subject',
  subjectMissing: 'Say in a few words what it’s about.',
  articles: 'These might answer it',
  /** Read after an article's title. */
  newTab: '(opens in a new tab)',
  message: 'What happened?',
  messagePlaceholder: 'What you did, what you expected, and what happened instead.',
  messageMissing: 'Tell us a little more: a sentence or two helps us help.',
  attachments: 'Attachments',
  attachmentsTitle: 'Add screenshots or files',
  uploading: 'Wait for the files to finish uploading.',
  diagnostics: 'Include technical details',
  /** What's included, read out with the checkbox: "Chrome 141 on macOS". */
  diagnosticsHint: (details: string) => `We’ll add ${details}, nothing else.`,
  optional: 'optional',
  choose: 'Choose…',
  required: (label: string) => `Answer “${label}”.`,
  /** The team is working: "Online now · replies by 3:45 PM". */
  online: (by: string) => `Online now · replies by ${by}`,
  /** The team is away: "Back Monday at 9:00 AM · replies by Monday at 11:00 AM". */
  away: (back: string, by: string) => `Back ${back} · replies by ${by}`,
  /** A day and time as said in the line: "tomorrow at 9:00 AM", "Monday at 10:00 AM". */
  dayAt: (day: string, time: string) => `${day} at ${time}`,
  send: 'Send request',
  sending: 'Sending…',
  sent: 'Sent',
  failed: 'Couldn’t send',
  invalid: 'Check the form',
  failedTitle: 'Your request didn’t send',
  failedDescription: 'Nothing is lost. Try again in a moment.',
  /** The confirmation's title, with the request's number when there is one. */
  doneTitle: (id?: string) => (id ? `Request ${id} is with the team` : 'Your request is with the team'),
  /** "We'll reply to ada@northwind.com by 3:45 PM." */
  doneDescription: (email: string, by: string) => `We’ll reply to ${email} by ${by}.`,
  another: 'Send another request',
  requests: 'See your requests',
}

export type SupportRequestCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale times are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/* ── The team's clock ───────────────────────────────────────────────────── */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const clocks = new Map<string, Intl.DateTimeFormat>()
/** The weekday and hour on the team's clock at an instant. */
function clock(at: Date, timeZone: string) {
  let format = clocks.get(timeZone)
  if (!format) {
    // lint-blocks-allow: reads a time zone's clock (weekday, hour) to count working time; never shown
    format = dateTimeFormat('en-US', { timeZone, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
    clocks.set(timeZone, format)
  }
  const parts = format.formatToParts(at)
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
  return { day: DAYS.indexOf(part('weekday')), hour: Number(part('hour')) + Number(part('minute')) / 60 }
}

export function isOpen(at: Date, hours: SupportHours) {
  const { day, hour } = clock(at, hours.timeZone)
  return hours.days.includes(day) && hour >= hours.open && hour < hours.close
}

const STEP = 15 * 60_000
/** The quarter hour on or after an instant. */
const quarter = (at: Date) => new Date(Math.ceil(at.getTime() / STEP) * STEP)

/** When the team is next working: now, if it is. */
export function backAt(now: Date, hours: SupportHours) {
  let at = quarter(now)
  for (let i = 0; i < 4 * 24 * 14 && !isOpen(at, hours); i++) at = new Date(at.getTime() + STEP)
  return at
}

/** When a reply is due: `replyHours` of the team's working time from now, in quarter hours. */
export function replyBy(now: Date, hours: SupportHours, replyHours: number) {
  let at = quarter(now)
  let left = replyHours * 4
  for (let i = 0; i < 4 * 24 * 28 && left > 0; i++) {
    if (isOpen(at, hours)) left--
    at = new Date(at.getTime() + STEP)
  }
  return at
}

/** The browser and system, read from the user agent: "Chrome 141", "macOS". */
export function environment(agent: string): Record<string, string> {
  const version = (pattern: RegExp) => pattern.exec(agent)?.[1]
  const edge = version(/Edg\/(\d+)/)
  const firefox = version(/Firefox\/(\d+)/)
  const chrome = version(/Chrome\/(\d+)/)
  const safari = /Safari/.test(agent) ? version(/Version\/(\d+)/) : undefined
  const browser = edge ? `Edge ${edge}` : firefox ? `Firefox ${firefox}` : chrome ? `Chrome ${chrome}` : safari ? `Safari ${safari}` : undefined
  const system = /iPhone|iPad/.test(agent) ? 'iOS' : /Android/.test(agent) ? 'Android' : /Mac OS X/.test(agent) ? 'macOS' : /Windows/.test(agent) ? 'Windows' : /Linux/.test(agent) ? 'Linux' : undefined
  return { ...(browser && { browser }), ...(system && { system }) }
}
