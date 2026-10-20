import type { ComponentType } from 'react'
import { BanknoteIcon, CodeXmlIcon, CreditCardIcon, FileTextIcon, MailIcon, MessagesIcon, PhoneCallIcon, ShieldAlertIcon, ShieldCheckIcon } from '@youj/icons'

type HelpIcon = ComponentType<{ size?: number; className?: string }>

/** A topic card under "Browse by topic". */
export interface HelpCategory {
  id: string
  title: string
  description: string
  /** How many articles it holds; counts up as it scrolls in. */
  count: number
  icon: HelpIcon
  /** The topic's page. Default `#<id>`. */
  href?: string
}

/** An article the search finds. */
export interface HelpArticle {
  id: string
  title: string
  /** A category's id; its title shows as a badge. */
  category: string
  /** Reading time. */
  minutes: number
  /** The article's page. Default `#<id>`. */
  href?: string
}

/** A popular question, answered in the accordion. */
export interface HelpQuestion {
  q: string
  a: string
}

/** A way to reach support, with its typical first reply. */
export interface HelpChannel {
  id: string
  title: string
  description: string
  icon: HelpIcon
  /** The typical first reply, in `unit`s. */
  reply: number
  unit: string
}

/** A choice under "What's this about?". */
export interface HelpTopic {
  value: string
  label: string
}

/** What `onSubmit` receives from the contact form. */
export interface HelpRequest {
  channel: string
  topic: string
  reference: string
  message: string
}

export const CATEGORIES: HelpCategory[] = [
  { id: 'payments', title: 'Payments', description: 'Accepting cards, wallets and bank debits.', count: 42, icon: CreditCardIcon },
  { id: 'payouts', title: 'Payouts', description: 'Schedules, currencies and bank accounts.', count: 27, icon: BanknoteIcon },
  { id: 'disputes', title: 'Disputes & refunds', description: 'Evidence, deadlines and partial refunds.', count: 19, icon: ShieldAlertIcon },
  { id: 'account', title: 'Account & security', description: 'Team access, 2FA and verification.', count: 31, icon: ShieldCheckIcon },
  { id: 'invoicing', title: 'Invoicing', description: 'Hosted invoices, reminders and tax.', count: 23, icon: FileTextIcon },
  { id: 'developers', title: 'Developers', description: 'API keys, webhooks and test mode.', count: 58, icon: CodeXmlIcon },
]

export const ARTICLES: HelpArticle[] = [
  { id: 'a1', title: 'When will my first payout arrive?', category: 'payouts', minutes: 3 },
  { id: 'a2', title: 'Change the bank account for payouts', category: 'payouts', minutes: 2 },
  { id: 'a3', title: 'Issue a full or partial refund', category: 'disputes', minutes: 2 },
  { id: 'a4', title: 'Respond to a dispute with evidence', category: 'disputes', minutes: 6 },
  { id: 'a5', title: 'Accept Apple Pay and Google Pay', category: 'payments', minutes: 4 },
  { id: 'a6', title: 'Why was a payment declined?', category: 'payments', minutes: 5 },
  { id: 'a7', title: 'Set up two-factor authentication', category: 'account', minutes: 2 },
  { id: 'a8', title: 'Invite teammates and set roles', category: 'account', minutes: 3 },
  { id: 'a9', title: 'Send an invoice with automatic reminders', category: 'invoicing', minutes: 4 },
  { id: 'a10', title: 'Collect sales tax and VAT on invoices', category: 'invoicing', minutes: 7 },
  { id: 'a11', title: 'Roll an API key without downtime', category: 'developers', minutes: 4 },
  { id: 'a12', title: 'Verify webhook signatures', category: 'developers', minutes: 5 },
  { id: 'a13', title: 'Refund a payment from the API', category: 'developers', minutes: 3 },
]

export const POPULAR = ['payout', 'refund', 'declined', 'webhook']

export const FAQ: HelpQuestion[] = [
  { q: 'How long do payouts take?', a: 'Standard payouts land in two business days in the US and EU, and in three in most other regions. Instant payouts arrive within 30 minutes for a 1% fee.' },
  { q: 'Can I refund a payment after it has been paid out?', a: 'Yes. The refund comes out of your Harbor balance; if the balance is short, we debit the bank account on file and email you first.' },
  { q: 'What does a dispute cost?', a: 'A $15 dispute fee, returned in full if you win. Submitting evidence is free, and you have seven days to respond.' },
  { q: 'Is test mode free?', a: 'Always. Test mode has every feature of live mode, including webhooks and payouts to test bank accounts, and never moves money.' },
  { q: 'Which currencies can I settle in?', a: 'You can settle in 18 currencies. Payments in other currencies are converted at the mid-market rate plus 1%.' },
]

export const CHANNELS: HelpChannel[] = [
  { id: 'chat', title: 'Live chat', description: 'Weekdays, 6am–10pm ET', icon: MessagesIcon, reply: 2, unit: 'minutes' },
  { id: 'email', title: 'Email', description: 'Every day, all year', icon: MailIcon, reply: 4, unit: 'hours' },
  { id: 'phone', title: 'Phone', description: 'Scale and Enterprise plans', icon: PhoneCallIcon, reply: 45, unit: 'seconds' },
]

export const TOPICS: HelpTopic[] = [
  { value: 'payouts', label: 'Payouts' },
  { value: 'payments', label: 'A payment' },
  { value: 'disputes', label: 'A dispute or refund' },
  { value: 'account', label: 'My account' },
  { value: 'other', label: 'Something else' },
]

export const HELP_CENTER_COPY = {
  brandSuffix: 'Help',
  status: 'All systems normal',
  statusLink: ', view status',
  title: 'How can we help?',
  description: 'Answers on payments, payouts and everything between, from the team that runs them.',
  search: 'Search help articles',
  searchPlaceholder: 'Search for payouts, refunds, API keys…',
  clearSearch: 'Clear search',
  popular: 'Popular:',
  results: 'Search results',
  resultCount: (n: number, query: string) => `${n} ${n === 1 ? 'article' : 'articles'} for ${query}`,
  minutes: (n: number) => `${n} min`,
  noResultsBefore: (query: string) => `No articles match “${query}”. Try a shorter word, or `,
  noResultsLink: 'ask the team',
  noResultsAfter: '.',
  topics: 'Browse by topic',
  articles: (n: number) => (n === 1 ? ' article' : ' articles'),
  faqTitle: 'Popular questions',
  faqDescription: 'What merchants asked most this month.',
  contactTitle: 'Still stuck?',
  contactDescription: 'Real people, most of them former merchants. Pick how you’d like to talk.',
  channel: 'Contact channel',
  typicalReply: 'Typical first reply',
  sending: 'Sending your request',
  doneTitle: 'We’ve got it',
  ticket: 'Ticket',
  doneBody: (topic: string, channel: string, reply: number, unit: string) =>
    `is in the queue for ${topic.toLowerCase()}. Expect a ${channel.toLowerCase()} reply within about ${reply} ${unit}; we’ll also email a copy.`,
  another: 'Send another request',
  form: 'Support request',
  topic: 'What’s this about?',
  topicPlaceholder: 'Choose a topic',
  topicRequired: 'Choose what this is about.',
  reference: 'Payment or payout ID',
  referencePlaceholder: 'po_1Nx…',
  referenceHint: 'Optional, but it saves a round trip.',
  message: 'Message',
  messagePlaceholder: 'What happened, and what did you expect?',
  messageTooShort: 'Tell us a little more: at least 20 characters.',
  attachments: 'Attachments',
  attachmentsTitle: 'Drop screenshots or PDFs',
  attachmentsHint: 'Up to 3 files · 10 MB each',
  replyBy: (channel: string) => `We reply by ${channel} and copy you on email.`,
  replyChannel: { chat: 'chat', email: 'email', phone: 'phone' } as Record<string, string>,
  send: 'Send request',
  sendFailed: 'Couldn’t send it. Try again.',
}
export type HelpCenterCopy = typeof HELP_CENTER_COPY

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
