import type { ChatSource, ChatSuggestion, ChatTextStream } from '../../../components/ui/chat'

/* Fixtures for Atlas, the analyst in Orbit's growth workspace: the chats in
 * the sidebar, the scripts its replies play from, and the copy. Everything is
 * plain data, so swapping the scripts for your model's stream leaves the
 * block's parts alone. */

export interface ToolRun {
  id: string
  name: string
  args: Record<string, unknown>
  status: 'running' | 'success' | 'error'
  result?: unknown
  error?: string
  /** How long it ran, in ms. */
  duration?: number
}

export interface Attachment {
  id: string
  name: string
  /** Bytes. */
  size?: number
}

export interface Turn {
  id: string
  role: 'user' | 'assistant'
  /** The text; while it streams, it grows in `stream`. */
  text: string
  stream?: ChatTextStream
  streaming?: boolean
  /** Asked, and nothing has come back yet. */
  waiting?: boolean
  /** Stopped part-way. */
  stopped?: boolean
  reasoning?: { text: string; stream?: ChatTextStream; streaming: boolean; duration?: number }
  tools?: ToolRun[]
  sources?: ChatSource[]
  attachments?: Attachment[]
  at: Date
  feedback?: 'up' | 'down' | null
}

export type ChatGroup = 'pinned' | 'today' | 'week'

export interface Chat {
  id: string
  title: string
  group: ChatGroup
  /** When it was last touched, as the sidebar shows it. */
  when: string
  turns: Turn[]
  /** Follow-ups offered under its last answer. */
  followUps: string[]
}

export interface Script {
  reasoning: string
  tools: { name: string; args: Record<string, unknown>; result?: unknown; error?: string; ms: number }[]
  text: string
  sources: ChatSource[]
  followUps: string[]
}

export const GROUPS: { id: ChatGroup; label: string }[] = [
  { id: 'pinned', label: 'Pinned' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Previous 7 days' },
]

export const MODELS = [
  { value: 'deep', label: 'Atlas Deep', hint: 'Thinks first' },
  { value: 'fast', label: 'Atlas Fast', hint: 'Answers straight away' },
] as const

export type ModelId = (typeof MODELS)[number]['value']

export const USER = { name: 'Maya Chen', initials: 'MC', team: 'Growth' }

const SOURCES = {
  incident: { title: 'INC-2291: Card form timeouts on Android', url: 'https://orbit.dev/incidents/2291', snippet: 'Card tokenisation calls timed out for 9% of Android sessions between Oct 14 and Oct 16.' },
  release: { title: 'Release notes: Android 4.12', url: 'https://orbit.dev/releases/android-4-12', snippet: 'New card form with inline validation. Payment SDK upgraded to 7.3.' },
  dashboard: { title: 'Checkout funnel dashboard', url: 'https://metrics.orbit.dev/d/checkout', snippet: 'Daily sessions, step conversion and drop-off by platform.' },
  sdk: { title: 'Payment SDK 7.3 changelog', url: 'https://docs.payments.dev/changelog/7-3', snippet: 'Default network timeout lowered from 30 s to 8 s.' },
  pricing: { title: 'Seat pricing research, Q3', url: 'https://orbit.dev/docs/seat-pricing', snippet: 'Twelve peers compared on seat price, minimums and annual discounts.' },
  churn: { title: 'Downgrade survey, September', url: 'https://orbit.dev/docs/downgrade-survey', snippet: '214 answers. Top reason: paying for seats nobody uses.' },
} satisfies Record<string, ChatSource>

/* The opening question's answer: what plays in when the workspace opens. */
const CHECKOUT: Script = {
  reasoning:
    'The drop starts on **Oct 14**. I should split conversion by platform first, then look for anything that shipped that day: releases, incidents, config changes. If one platform explains it, compare its steps before and after.',
  tools: [
    { name: 'query_metrics', args: { metric: 'checkout_conversion', range: 'Oct 7 – Oct 20', split: 'platform' }, result: { web: '−0.2 pts', ios: '+0.1 pts', android: '−4.8 pts' }, ms: 1240 },
    { name: 'search_docs', args: { query: 'android checkout Oct 14' }, result: ['INC-2291', 'Release notes: Android 4.12'], ms: 860 },
  ],
  text: `Checkout conversion fell from **3.9%** to **3.1%** in the week of Oct 14, and almost all of it is **Android** [3].

| Platform | Before | After | Change |
| --- | --- | --- | --- |
| Web | 4.2% | 4.0% | −0.2 pts |
| iOS | 3.8% | 3.9% | +0.1 pts |
| Android | 3.6% | 1.8% | −1.8 pts |

The timing lines up with **Android 4.12**, which shipped a new card form on Oct 14 [2]. The same day, card tokenisation started timing out for about 9% of Android sessions [1]. The release also upgraded the payment SDK, which lowered its network timeout to 8 seconds [4].

**Most likely cause:** slower networks now hit the shorter timeout at the card step. Raising the timeout, or retrying once, should recover most of the drop.`,
  sources: [SOURCES.incident, SOURCES.release, SOURCES.dashboard, SOURCES.sdk],
  followUps: ['Draft an update for #payments', 'Compare the card step before and after', 'How much revenue did this cost us?'],
}

const SCRIPTS: { match: RegExp; script: Script }[] = [
  {
    match: /draft|update|post|slack|write|note/i,
    script: {
      reasoning: 'A short update for the payments channel: what happened, the likely cause, and the fix, with links. Keep it skimmable.',
      tools: [{ name: 'search_docs', args: { query: 'INC-2291 owner' }, result: { owner: 'Payments', on_call: 'Dev Patel' }, ms: 720 }],
      text: `Here's a draft for **#payments**:

> **Android checkout is down 1.8 pts since Oct 14.** It lines up with 4.12's card form and the payment SDK's new 8-second timeout [1]. About 9% of Android sessions time out at the card step [2].
>
> **Proposed fix:** raise the timeout to 20 s and retry once in 4.12.1. Dev is on call for payments. Can we ship it this week?

Want me to post it, or tag the release owner too?`,
      sources: [SOURCES.sdk, SOURCES.incident],
      followUps: ['Make it shorter', 'Add the revenue impact', 'Tag the release owner'],
    },
  },
  {
    match: /revenue|cost|money|impact|lost/i,
    script: {
      reasoning: 'Lost orders are the Android sessions that reached the card step times the drop in conversion, times the average order value over the period.',
      tools: [
        { name: 'run_sql', args: { table: 'orders', where: "platform = 'android'", range: 'Oct 14 – Oct 20' }, error: 'The warehouse took too long to answer.', ms: 2400 },
        { name: 'run_sql', args: { table: 'orders_daily', where: "platform = 'android'", range: 'Oct 14 – Oct 20' }, result: { sessions: 48210, aov: '$64.20' }, ms: 980 },
      ],
      text: `Roughly **$56,000** in the week, or about **870 orders**.

- 48,210 Android sessions reached checkout.
- Conversion fell 1.8 points, so about 870 fewer orders.
- At an average order of $64.20, that's $55,850.

The first query timed out on the raw orders table, so I used the daily rollup instead [1]. It rounds to the day, which is fine at this scale.`,
      sources: [SOURCES.dashboard],
      followUps: ['Split it by country', 'Draft an update for #payments'],
    },
  },
  {
    match: /compare|before|after|step|funnel/i,
    script: {
      reasoning: 'Compare each checkout step on Android for the week before and the week after Oct 14.',
      tools: [{ name: 'query_metrics', args: { metric: 'checkout_step_conversion', platform: 'android', compare: 'week over week' }, result: { cart: '0.0 pts', address: '−0.3 pts', card: '−11.9 pts', review: '+0.2 pts' }, ms: 1100 }],
      text: `Only the **card step** moved [1]:

| Step | Week before | Week after |
| --- | --- | --- |
| Cart → address | 71.4% | 71.4% |
| Address → card | 83.0% | 82.7% |
| Card → review | 78.6% | 66.7% |
| Review → paid | 92.1% | 92.3% |

Every other step is within normal noise, which points straight at the new card form.`,
      sources: [SOURCES.dashboard],
      followUps: ['How much revenue did this cost us?', 'Draft an update for #payments'],
    },
  },
]

const FALLBACK = (prompt: string): Script => ({
  reasoning: 'Search the workspace for anything related, then answer from what comes back.',
  tools: [{ name: 'search_docs', args: { query: prompt.slice(0, 48) }, result: ['Checkout funnel dashboard'], ms: 900 }],
  text: `I looked through the workspace for "${prompt.slice(0, 80)}" and the closest match is the **checkout funnel dashboard** [1]. It covers daily sessions, step conversion and drop-off by platform.

Tell me which metric or date range you care about and I'll pull the numbers.`,
  sources: [SOURCES.dashboard],
  followUps: ['Compare the card step before and after', 'How much revenue did this cost us?'],
})

/** What Atlas does with a prompt. The same prompt always plays the same way. */
export const scriptFor = (prompt: string): Script => SCRIPTS.find((s) => s.match.test(prompt))?.script ?? FALLBACK(prompt)

/** The opening chat's last question, answered live when the workspace opens. */
export const OPENING = { chat: 'checkout', script: CHECKOUT, at: new Date(2026, 9, 21, 9, 41) }

/** "Split it by country" → ["Split", " it", " by", " country"]. */
export const tokenize = (text: string) => text.match(/\s*\S{1,5}|\s+/g) ?? []

const day = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m)

/** A finished answer, as history. */
export const answer = (id: string, script: Script, at: Date): Turn => ({
  id,
  role: 'assistant',
  text: script.text,
  at,
  reasoning: { text: script.reasoning, streaming: false, duration: 3 }, // youj-allow: seconds of thinking, shown in the label (fixture)
  tools: script.tools.map((t, i) => ({ id: `${id}-t${i}`, name: t.name, args: t.args, status: t.error ? 'error' : 'success', result: t.result, error: t.error, duration: t.ms })),
  sources: script.sources,
  feedback: null,
})

const ask = (id: string, text: string, at: Date, attachments?: Attachment[]): Turn => ({ id, role: 'user', text, at, attachments })

/** The sidebar's chats. `answered`: the opening question already has its answer (no live reply). */
export function makeChats(answered = false): Chat[] {
  return [
    {
      id: 'checkout',
      title: 'Checkout conversion dip',
      group: 'pinned',
      when: '9:41',
      turns: [
        ask('c1', 'Why did checkout conversion drop last week?', day(21, 9, 40), [{ id: 'f1', name: 'checkout-funnel-oct.csv', size: 48_200 }]),
        ...(answered ? [answer('c2', CHECKOUT, day(21, 9, 41))] : []),
      ],
      followUps: answered ? CHECKOUT.followUps : [],
    },
    {
      id: 'pricing',
      title: 'Seat pricing benchmarks',
      group: 'today',
      when: '8:15',
      turns: [
        ask('p1', 'How does our seat price compare with similar tools?', day(21, 8, 12)),
        answer(
          'p2',
          {
            reasoning: 'Pull the Q3 pricing research and place our $12 seat among the peers.',
            tools: [{ name: 'search_docs', args: { query: 'seat pricing Q3' }, result: ['Seat pricing research, Q3'], ms: 640 }],
            text: 'At **$12 a seat** we sit in the middle of the twelve peers in the Q3 research [1]. The median is $11, the range $8 to $20. Most peers give 15–20% off for annual billing; we give 10%.',
            sources: [SOURCES.pricing],
            followUps: [],
          },
          day(21, 8, 15),
        ),
      ],
      followUps: ['What would 20% off annual cost us?', 'Which peers have minimums?'],
    },
    {
      id: 'churn',
      title: 'Why teams downgrade',
      group: 'week',
      when: 'Mon',
      turns: [
        ask('d1', 'What are the top reasons teams downgrade?', day(19, 16, 2)),
        answer(
          'd2',
          {
            reasoning: 'Summarize the September downgrade survey by reason.',
            tools: [{ name: 'search_docs', args: { query: 'downgrade survey september' }, result: ['Downgrade survey, September'], ms: 710 }],
            text: 'From 214 answers in September [1]:\n\n1. **Unused seats** (41%): paying for people who left or never joined.\n2. **Budget cuts** (27%).\n3. **Missing SSO on the Team plan** (14%).\n\nThe first one is the easiest to act on: a monthly seat review email could catch it early.',
            sources: [SOURCES.churn],
            followUps: [],
          },
          day(19, 16, 3),
        ),
      ],
      followUps: ['Draft the seat review email', 'How many teams asked for SSO?'],
    },
    {
      id: 'onboarding',
      title: 'Onboarding funnel by plan',
      group: 'week',
      when: 'Sun',
      turns: [
        ask('o1', 'Where do new Team plan workspaces stall in onboarding?', day(18, 11, 20)),
        answer(
          'o2',
          {
            reasoning: 'Split onboarding completion by step for workspaces created on the Team plan in the last 30 days.',
            tools: [{ name: 'query_metrics', args: { metric: 'onboarding_step_completion', plan: 'team', range: '30d' }, result: { invite: '48%', connect: '71%', first_report: '64%' }, ms: 1020 }],
            text: 'Most stall at **inviting teammates**: only 48% of new Team workspaces invite anyone in their first week [1]. Those that do are twice as likely to build a first report.',
            sources: [SOURCES.dashboard],
            followUps: [],
          },
          day(18, 11, 21),
        ),
      ],
      followUps: ['Which invite prompts work best?'],
    },
  ]
}

export const SUGGESTIONS: ChatSuggestion[] = [
  { label: 'Explain a drop', description: 'Find what changed when a metric moved', prompt: 'Why did checkout conversion drop last week?' },
  { label: 'Compare steps', description: 'Before and after, step by step', prompt: 'Compare the card step before and after Oct 14' },
  { label: 'Size the impact', description: 'Turn a change into revenue', prompt: 'How much revenue did the Android drop cost us?' },
  { label: 'Write an update', description: 'A short note for a channel', prompt: 'Draft an update for #payments about the checkout drop' },
]

export const COPY = {
  product: 'Atlas',
  workspace: 'Orbit · Growth',
  newChat: 'New chat',
  search: 'Search chats',
  chats: 'Chats',
  noMatch: (q: string) => `No chats match “${q}”.`,
  openChats: 'Open chats',
  share: 'Share',
  model: 'Model',
  attach: 'Attach files',
  label: 'Message Atlas',
  placeholder: 'Ask about your metrics, docs or tickets…',
  footnote: 'Atlas can make mistakes. Check the numbers that matter.',
  greeting: 'What should we look into?',
  description: 'Atlas reads your metrics, docs and tickets, and shows its work.',
  followUps: 'Follow-ups',
  answered: 'Atlas answered.',
  stopped: 'Stopped.',
  emptyChat: 'Nothing here yet. Ask a question to start.',
}
