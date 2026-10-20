/** A region sales covers, and who answers there. */
export interface ContactSalesRegion {
  id: string
  label: string
  /** The person the visitor will meet; `avatar` is an image URL, initials stand in without one. */
  contact: { name: string; role: string; location: string; avatar?: string }
}

/** A time that can be booked. */
export interface ContactSalesSlot {
  id: string
  /** When it starts, a Date or a timestamp in milliseconds (shown in the visitor's own time zone). */
  start: Date | number
  /** The region whose team takes it; left out, any region's. */
  region?: string
  /** Free places: 0 for taken. Default 1. */
  left?: number
}

export type ContactSalesMode = 'call' | 'message'

/** What the visitor filled in. */
export interface ContactSalesValues {
  mode: ContactSalesMode
  name: string
  email: string
  company: string
  /** One of `sizes`. */
  size: string
  /** A region's id. */
  region: string
  /** One of `topics`; empty when there are none. */
  topic: string
  message: string
  /** The booked time; `null` when sending a message. */
  slot: ContactSalesSlot | null
}

export type ContactSalesErrors = Partial<Record<'name' | 'email' | 'company' | 'slot' | 'message', string>>

export const REGIONS: ContactSalesRegion[] = [
  { id: 'americas', label: 'Americas', contact: { name: 'Dana Whitfield', role: 'Account executive', location: 'New York' } },
  { id: 'emea', label: 'Europe and Africa', contact: { name: 'Ines Duarte', role: 'Account executive', location: 'Dublin' } },
  { id: 'apac', label: 'Asia Pacific', contact: { name: 'Kenji Mori', role: 'Account executive', location: 'Sydney' } },
]

export const SIZES = ['1–10', '11–50', '51–200', '201–1,000', '1,000+']
export const TOPICS = ['Pricing for my team', 'A security review', 'Moving from another host', 'Something else']

const HOURS: Record<string, number[]> = { americas: [9, 10, 11, 14, 15, 16], emea: [9, 10, 11, 14, 15, 16], apac: [9, 10, 11, 13, 14, 15] }
const TAKEN = new Set(['americas-0-10', 'americas-1-9', 'americas-1-10', 'americas-3-14', 'emea-0-9', 'emea-2-14', 'apac-3-13'])

/** Five working days of slots (Tuesday to Friday, then the next Monday) for each region, in the viewer's own time zone so they read at the hours above wherever this renders; a few already taken. */
export const SLOTS: ContactSalesSlot[] = REGIONS.flatMap((region) =>
  [1, 2, 3, 4, 7].flatMap((offset, d) =>
    (HOURS[region.id] ?? []).map((hour) => ({
      id: `${region.id}-${d}-${hour}`,
      start: new Date(2026, 9, 5 + offset, hour, 0),
      region: region.id,
      left: TAKEN.has(`${region.id}-${d}-${hour}`) ? 0 : 1,
    })),
  ),
)

export const DEFAULT_COPY = {
  eyebrow: 'Talk to sales',
  title: 'Tell us what you’re building',
  description: 'A real person replies, usually the same day. Pick a time that suits you and we’ll bring someone who has run your kind of migration.',
  proof: ['A 30-minute call, no slides', 'A solutions engineer on the line for anything technical', 'A written plan and a quote within two working days'],
  /** The card's first step. */
  pickTitle: 'Pick a time',
  pickDescription: '30 minutes on video',
  region: 'Where are you based?',
  /** Who the region's team puts forward: "You’ll meet Ines Duarte". */
  meet: (name: string) => `You’ll meet ${name}`,
  /** Under the name: "Account executive, Dublin". */
  meetRole: (role: string, location: string) => `${role}, ${location}`,
  daysLabel: 'Day',
  /** A day as read out, with the count's plural category (Intl.PluralRules): "Tuesday, October 6, 5 times open". */
  dayLabel: (day: string, open: number, plural: Intl.LDMLPluralRule) => `${day}, ${open === 0 ? 'no times open' : plural === 'one' ? `${open} time open` : `${open} times open`}`,
  /** The times of the chosen day: "Times on Tuesday, October 6". */
  timesLabel: (day: string) => `Times on ${day}`,
  /** A taken time, read out after it: "10:00 AM, taken". */
  taken: (time: string) => `${time}, taken`,
  timezone: 'Times are in your time zone.',
  /** No times for the region: "No open times for Asia Pacific this week." */
  noTimes: (region: string) => `No open times for ${region} this week.`,
  slotMissing: 'Pick a time for the call, or send a message instead.',
  next: 'Continue',
  /** The button once a time is picked: "Continue with Tue, Oct 6, 10:00 AM". */
  nextWith: (when: string) => `Continue with ${when}`,
  toMessage: 'Rather write? Send a message',
  /** The second step. */
  detailsTitle: 'Your details',
  detailsDescription: 'So the right person comes prepared.',
  change: 'Change time',
  /** Under the chosen time: "30 minutes with Ines Duarte". */
  withWhom: (name: string) => `30 minutes with ${name}`,
  name: 'Your name',
  email: 'Work email',
  emailPlaceholder: 'you@company.com',
  company: 'Company',
  size: 'Company size',
  topic: 'What’s it about?',
  /** Writing instead of a call. */
  messageTitle: 'Send a message',
  messageDescription: 'A reply within one working day, from your region’s team.',
  /** Who replies, over their role: "Ines Duarte will reply". */
  replies: (name: string) => `${name} will reply`,
  messageLabel: 'Anything we should know?',
  messageHint: 'Optional. What you’re running today, what’s not working.',
  toCall: 'Rather talk? Book a call',
  nameMissing: 'Enter your name.',
  emailMissing: 'Enter your work email.',
  emailInvalid: 'That doesn’t look like an email. Try you@company.com.',
  emailPersonal: 'Use your work email, so we can find your team.',
  companyMissing: 'Enter your company.',
  messageTooLong: (max: number) => `Keep it under ${max} characters.`,
  failedTitle: 'We couldn’t send that',
  failedDescription: 'Everything you typed is still here. Try again in a moment, or write to sales@northwind.dev.',
  submitCall: 'Book the call',
  submitMessage: 'Send the message',
  pending: 'Sending…',
  success: 'Sent',
  failed: 'Couldn’t send',
  invalid: 'Check the form',
  finePrint: 'By sending this you agree to our privacy policy.',
  /** The confirmation. */
  doneTitleCall: 'Your call is booked',
  doneTitleMessage: 'Message sent',
  /** "Thursday, October 8 at 10:00 AM with Dana Whitfield." */
  doneCall: (when: string, name: string) => `${when} with ${name}.`,
  /** "Dana Whitfield will reply within one working day." */
  doneMessage: (name: string) => `${name} will reply within one working day.`,
  /** Where the confirmation went: "A calendar invite is on its way to ada@analytical.dev." */
  doneSent: (email: string, mode: ContactSalesMode) => (mode === 'call' ? `A calendar invite is on its way to ${email}.` : `A copy is on its way to ${email}.`),
  doneNext: 'What happens next',
  doneSteps: ['We’ll send a short note on what to prepare, so the call is useful.', 'Afterwards, a written plan and a quote within two working days.'],
  again: 'Start over',
  /** The visitor can also reach us directly. */
  directTitle: 'Prefer email or phone?',
  directEmail: 'sales@northwind.dev',
  directPhone: '+1 (415) 555-0142',
}
export type ContactSalesCopy = typeof DEFAULT_COPY

export const PERSONAL = /@(gmail|googlemail|yahoo|hotmail|outlook|icloud|proton|protonmail|aol)\./i

/** The steps of the card: a time, then the details; or a message; then the confirmation. */
export type ContactSalesStep = 'time' | 'details' | 'message' | 'done'
