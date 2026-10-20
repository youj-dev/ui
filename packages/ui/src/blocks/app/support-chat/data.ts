/* Tern's support desk: the people on it, what the assistant knows, the help
 * articles and the conversations you've had. Replies are scripted and
 * deterministic, so the block plays the same way every time; the block's
 * `onSend` swaps `replyTo` for your chat backend (Intercom, Zendesk, your own). */

export type Sender = 'user' | 'bot' | 'agent' | 'system'

export interface SupportAgent {
  id: string
  name: string
  first: string
  role: string
  presence: 'online' | 'away'
}

export const TEAM: SupportAgent[] = [
  { id: 'mira', name: 'Mira Chen', first: 'Mira', role: 'Support engineer', presence: 'online' },
  { id: 'jonas', name: 'Jonas Weber', first: 'Jonas', role: 'Support engineer', presence: 'online' },
  { id: 'aiko', name: 'Aiko Tanaka', first: 'Aiko', role: 'Solutions', presence: 'away' },
]
export const MIRA = TEAM[0]!
export const JONAS = TEAM[1]!

export interface SupportUser {
  name: string
  /** How the widget greets them. */
  first: string
  email?: string
}

export const BRAND = { name: 'Tern' }
export const USER: SupportUser = { name: 'Sam Okafor', first: 'Sam', email: 'sam@northwind.dev' }

export interface SupportAttachment {
  id: string
  name: string
  type?: string
  size?: number
  url?: string
}

export interface SupportMessage {
  id: string
  from: Sender
  /** Who wrote it, for agents. */
  agent?: SupportAgent
  text: string
  attachments?: SupportAttachment[]
  at: Date
}

/** Where the conversation is: the assistant, waiting for a person, with a person, closed, or taking an email while the team is away. */
export type SupportStage = 'bot' | 'queue' | 'agent' | 'ended' | 'offline'

export interface SupportThread {
  id: string
  title: string
  stage: SupportStage
  /** The person on it, once one joined. */
  agent?: SupportAgent
  messages: SupportMessage[]
  /** Quick replies offered under the last message. */
  suggestions: string[]
  /** Already rated, for a closed conversation. */
  rated?: number
  unread?: number
  /** When it last moved, as the list shows it. */
  when: string
}

const at = (iso: string) => new Date(iso)

export const THREADS: SupportThread[] = [
  {
    id: 'c-2231',
    title: 'Segment source keeps pausing',
    stage: 'agent',
    agent: MIRA,
    unread: 2,
    when: '2h',
    messages: [
      { id: 'h1', from: 'user', text: 'Our Segment source paused again overnight. Third time this week.', at: at('2026-09-27T08:41:00Z') },
      { id: 'h2', from: 'agent', agent: MIRA, text: 'Sorry about that. It pauses because the source still uses the API key you rotated on Monday.', at: at('2026-09-27T09:02:00Z') },
      {
        id: 'h3',
        from: 'agent',
        agent: MIRA,
        text: 'I’ve switched it to the new key and replayed the backlog. Can you confirm events show up on your side?',
        attachments: [{ id: 'a-log', name: 'segment-replay-0927.log', type: 'text/plain', size: 18_430 }],
        at: at('2026-09-27T09:03:00Z'),
      },
    ],
    suggestions: ['Yes, they’re flowing again', 'Still nothing on my side'],
  },
  {
    id: 'c-2107',
    title: 'VAT ID on the Q3 invoice',
    stage: 'ended',
    agent: JONAS,
    when: 'Aug 28',
    messages: [
      { id: 'v1', from: 'user', text: 'Can you add our VAT ID to the Q3 invoice?', at: at('2026-08-28T13:20:00Z') },
      { id: 'v2', from: 'agent', agent: JONAS, text: 'Done: TRN-0007 is reissued with DE 294 118 553. You’ll find it under Billing → Invoices.', at: at('2026-08-28T13:26:00Z') },
      { id: 'v3', from: 'user', text: 'Perfect, thanks!', at: at('2026-08-28T13:27:00Z') },
      { id: 'v4', from: 'system', text: 'Jonas closed the conversation', at: at('2026-08-28T13:30:00Z') },
    ],
    suggestions: [],
  },
]

export interface SupportArticle {
  id: string
  title: string
  topic: string
  minutes: number
}

export const ARTICLES: SupportArticle[] = [
  { id: 'missing-events', title: 'Events aren’t showing up in dashboards', topic: 'Data', minutes: 3 },
  { id: 'rotate-key', title: 'Reconnect a source after rotating an API key', topic: 'Data', minutes: 2 },
  { id: 'invite', title: 'Invite teammates and set their roles', topic: 'Workspace', minutes: 2 },
  { id: 'billing-email', title: 'Change your billing email or VAT ID', topic: 'Billing', minutes: 1 },
  { id: 'invoices', title: 'Download invoices as PDF', topic: 'Billing', minutes: 1 },
  { id: 'public-link', title: 'Share a dashboard with a public link', topic: 'Dashboards', minutes: 2 },
  { id: 'sso', title: 'Set up single sign-on with Okta', topic: 'Security', minutes: 5 },
]

export const articleHref = (article: SupportArticle) => `https://tern.io/help/${article.id}`

export const OPENERS = ['My events stopped showing up', 'Change my billing email', 'Talk to a person']

/** Every user-facing string of the widget; the ones naming the product take `brand.name`. */
export const DEFAULT_COPY = {
  widgetLabel: (product: string) => `${product} support`,
  homeTitle: (product: string) => `${product} Support`,
  hello: (first: string) => `Hi ${first},`,
  helpPrompt: 'how can we help?',
  botName: (product: string) => `${product} Assistant`,
  /** The assistant's opening line in a new conversation (Markdown). */
  greeting: (first: string, bot: string) =>
    `Hi ${first}, I’m **${bot}**. I can answer most questions about data, dashboards and billing right away, and bring in the team whenever you’d like.`,
  /** Quick replies a new conversation starts with. */
  openers: OPENERS,
  offlineReply: 'The team is away right now, back Monday at 9:00 CET. Leave your email and we’ll reply there, usually within a few hours of opening.',
  replyTime: 'Typically replies in under 4 min',
  backAt: 'Back Monday at 9:00 CET',
  /** What the person you hand off to says first. */
  handoffGreeting: (user: string, agent: string) =>
    `Hi ${user}, ${agent} here. I’ve read the thread: your Segment source paused at 09:12 when its API key was rotated. I’ve reconnected it, and 18,240 events are replaying now.`,
  handoffSuggestions: ['They’re in now, thanks', 'Can you raise our event limit?'],
  openChat: (unread: number) => `Open support chat${unread ? `, ${unread} unread` : ''}`,
  closeChat: 'Close support chat',
  close: 'Close',
  dismiss: 'Dismiss',
  teaserFrom: (product: string) => ` from ${product}`,
  messageTeam: 'Message the team',
  supportTeam: 'Support team',
  teamHere: 'The team is here',
  teamAway: 'The team is away',
  continueConversation: 'Continue the conversation',
  sendMessage: 'Send us a message',
  leaveMessage: 'Leave us a message',
  recent: 'Recent conversations',
  yourConversation: 'Your conversation',
  justNow: 'Now',
  you: 'You',
  unreadCount: (count: number) => `${count} unread`,
  findAnswer: 'Find an answer',
  searchHelp: 'Search help articles',
  searchPlaceholder: 'Search for help',
  articlesFound: (count: number) => `${count} ${count === 1 ? 'article' : 'articles'} found`,
  popular: 'Popular',
  popularArticles: 'Popular articles',
  results: 'Results',
  minutesRead: (minutes: number) => `${minutes} min read`,
  noArticles: (query: string) => `Nothing matches “${query}”.`,
  askTeam: 'Ask the team instead',
  backHome: 'Back to home',
  conversation: 'Conversation',
  quickReplies: 'Quick replies',
  finding: 'Finding someone on the team…',
  withAgent: (role: string) => `${role} · Online`,
  support: 'Support',
  closed: 'Conversation closed',
  away: (backAt: string) => `Team away · ${backAt}`,
  botStatus: 'AI assistant · the team can join anytime',
  joined: (name: string) => `${name} joined the conversation`,
  closedBy: (first: string) => `${first} closed the conversation`,
  replyTo: (email: string) => `We’ll reply to ${email}`,
  messageLabel: (first?: string) => (first ? `Message ${first}` : 'Message'),
  placeholder: (first?: string) => (first ? `Reply to ${first}…` : 'Ask a question…'),
  typing: (name: string) => `${name} is typing…`,
  attachments: 'Attachments',
  emailTitle: 'Get the reply by email',
  email: 'Email',
  emailPlaceholder: 'you@company.com',
  notifyMe: 'Notify me',
  emailHint: 'We only use it for this conversation.',
  emailInvalid: 'That doesn’t look like an email address.',
  emailMissing: 'Enter the email we should reply to.',
  allSet: 'You’re all set',
  willReply: (email: string) => `We’ll reply to ${email}. You can close this window.`,
  rated: (subject: string) => `You rated ${subject}`,
  rateAsk: (subject: string) => `How was your conversation with ${subject}?`,
  verdicts: ['', 'Not helpful', 'Could be better', 'Okay', 'Good', 'Great'],
  tapStar: 'Tap a star',
  note: 'Anything we could do better? (optional)',
  sendFeedback: 'Send feedback',
  thanks: 'Thanks, it goes straight to the team.',
  newConversation: 'Start a new conversation',
  sendFailed: (reason: string) => `Couldn’t send: ${reason}`,
}

export type SupportChatCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** What happens next: the assistant answers, hands off, or a person replies. */
export type SupportReply =
  | { kind: 'bot'; text: string; suggestions?: string[]; close?: boolean }
  /** The assistant says `text`, the conversation waits in the queue, then `agent` (default: the first of the team) joins and says `greeting`. Offline, the assistant takes an email instead. */
  | { kind: 'handoff'; text: string; agent?: SupportAgent; greeting?: string; suggestions?: string[] }
  | { kind: 'agent'; text: string; suggestions?: string[]; attachments?: SupportAttachment[]; close?: boolean; agent?: SupportAgent }

const has = (text: string, pattern: RegExp) => pattern.test(text.toLowerCase())

/** The scripted desk: the same words always get the same reply. */
export function replyTo(text: string, stage: SupportStage, hasFiles = false): SupportReply {
  if (stage === 'agent') {
    if (has(text, /limit|raise|more events|upgrade/))
      return {
        kind: 'agent',
        text: 'Growth includes 5M events a month and you’re at 4.1M, so you’re fine for now. If you want headroom, I can start a 14-day Scale trial on the workspace.',
        suggestions: ['Start the trial', 'Not now, thanks'],
      }
    if (has(text, /start the trial/))
      return { kind: 'agent', text: 'Done: Scale is on until Oct 11, no card change needed. I’ll close this out, but reply here anytime.', suggestions: [], close: true }
    if (has(text, /still|nothing|not working|missing/))
      return {
        kind: 'agent',
        text: 'Thanks for checking. I can see 18,240 events replaying right now; they should all land within ten minutes. Here’s the replay log.',
        attachments: [{ id: 'a-replay', name: 'replay-progress.csv', type: 'text/csv', size: 6_210 }],
        suggestions: ['They’re in now, thanks', 'Can you raise our event limit?'],
      }
    if (has(text, /thank|flowing|works|in now|that’s all|that's all|not now|perfect/))
      return { kind: 'agent', text: 'Anytime! I’ll close this out, but reply here if anything comes up.', suggestions: [], close: true }
    return {
      kind: 'agent',
      text: hasFiles ? 'Got the file, thanks. Looking at it now.' : 'Got it. I’ve added that to your ticket and will follow up here in a moment.',
      suggestions: ['Can you raise our event limit?', 'That’s all, thanks'],
    }
  }
  if (has(text, /person|human|agent|someone|talk to|get a person/))
    return { kind: 'handoff', text: 'Sure. I’m bringing in someone from the team and sharing this conversation, so you won’t have to repeat yourself.' }
  if (has(text, /event|missing|source|showing up|segment/))
    return {
      kind: 'bot',
      text: 'Events usually land in dashboards within a minute. When they stop, it’s almost always the source:\n\n1. Open **Data → Sources** and look for a **Paused** badge.\n2. If the API key was rotated, choose **Reconnect** and paste the new one.\n3. Anything missed in the last 72 hours replays on its own.\n\nMore in [Events aren’t showing up](https://tern.io/help/missing-events).',
      suggestions: ['That fixed it', 'Still missing, get a person'],
    }
  if (has(text, /bill|invoice|vat|email/))
    return {
      kind: 'bot',
      text: 'Change it in **Settings → Billing → Billing details**. The next invoice goes to the new address; past invoices stay where they were sent, and you can download any of them as PDF from the same page.',
      suggestions: ['That’s all, thanks', 'Talk to a person'],
    }
  if (has(text, /never mind/)) return { kind: 'bot', text: 'No problem. I’m right here if anything else comes up.', suggestions: OPENERS.slice(0, 2) }
  if (has(text, /fixed|thank|that’s all|that's all/))
    return { kind: 'bot', text: 'Glad that’s sorted. I’ll close this conversation; you can reopen it from the home screen anytime.', suggestions: [], close: true }
  if (hasFiles)
    return { kind: 'bot', text: 'Thanks, I’ve added that to the conversation. Someone on the team can take a look; shall I bring them in?', suggestions: ['Talk to a person', 'Never mind'] }
  return { kind: 'bot', text: 'I don’t have a good answer for that yet. Want me to bring in someone from the team?', suggestions: ['Talk to a person', 'Never mind'] }
}

/** How long each beat takes, in ms: typing before a reply, a token of a streamed one, waiting in the queue. */
export const TIMING = { think: 900, token: 32, queue: 2200, agentTyping: 1600, close: 900 }

/** Splits a reply into the tokens it streams in: words with their trailing space. */
export const tokens = (text: string) => text.match(/\S+\s*/g) ?? []

export const fileSize = (bytes: number | undefined, locale: string) => {
  if (bytes === undefined) return ''
  const [unit, value, digits] =
    bytes < 1024 ? (['byte', bytes, 0] as const) : bytes < 1024 ** 2 ? (['kilobyte', bytes / 1024, 0] as const) : (['megabyte', bytes / 1024 ** 2, 1] as const)
  return value.toLocaleString(locale, { style: 'unit', unit, unitDisplay: 'short', maximumFractionDigits: digits })
}
