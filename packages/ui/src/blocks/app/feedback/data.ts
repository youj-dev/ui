import type { ComponentType } from 'react'

/* Fixtures for Tern's in-product feedback. Every string is in DEFAULT_COPY
 * (override it through the block's `copy`); swap `wait` for your feedback API
 * through `onAnswer` and `onSend`. */

export const BRAND = { name: 'Tern' }

export const SCORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export type Band = 'detractor' | 'passive' | 'promoter'

/** The standard NPS bands: 0–6, 7–8, 9–10. */
export const bandOf = (score: number): Band => (score <= 6 ? 'detractor' : score <= 8 ? 'passive' : 'promoter')

export interface FeedbackFollowUp {
  question: string
  reasons: string[]
  placeholder: string
  thanks: { title: string; body: string }
}

export const followUpFor = (product: string): Record<Band, FeedbackFollowUp> => ({
  detractor: {
    question: 'Sorry it’s falling short. What got in the way?',
    reasons: ['Too slow', 'Hard to find things', 'Missing a feature', 'Bugs', 'Pricing'],
    placeholder: 'What happened, and what would have helped?',
    thanks: {
      title: 'Thank you for being straight with us',
      body: 'A product lead reads every low score. If you left a comment, expect a reply this week.',
    },
  },
  passive: {
    question: `What would make ${product} a 10 for you?`,
    reasons: ['Faster search', 'More integrations', 'Better reporting', 'Offline mode', 'Mobile app'],
    placeholder: 'The one thing we should change first…',
    thanks: {
      title: 'Thanks, that’s noted',
      body: 'Answers like yours go straight into next quarter’s planning.',
    },
  },
  promoter: {
    question: 'Glad to hear it. What do you like most?',
    reasons: ['Speed', 'Keyboard shortcuts', 'Clean design', 'Integrations', 'Team features'],
    placeholder: 'Anything else you’d tell the team?',
    thanks: {
      title: 'You just made our week',
      body: 'We share every answer like this with the people who built it.',
    },
  },
})

/** The key of a feedback type in `copy.kinds`: 'bug', 'idea' and 'praise' by default. */
export type FeedbackKind = string

export interface FeedbackKindCopy {
  /** The type's icon. Default: a bug, bulb or heart for bug, idea and praise, else a speech bubble. */
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
  prompt: string
  placeholder: string
  sent: string
}

export const kindsFor = (product: string): Record<string, FeedbackKindCopy> => ({
  bug: {
    label: 'Bug',
    prompt: 'What went wrong?',
    placeholder: 'What did you do, what happened, and what did you expect?',
    sent: 'We’ll email you at ines@tern.io as soon as it’s fixed.',
  },
  idea: {
    label: 'Idea',
    prompt: 'What’s your idea?',
    placeholder: `What would you like ${product} to do, and what would it save you?`,
    sent: 'We’ll let you know if it makes the roadmap.',
  },
  praise: {
    label: 'Praise',
    prompt: 'What’s working well?',
    placeholder: 'Tell us what you love. It goes straight to the people who built it.',
    sent: 'We’ll pass it on to the team who built it. Thank you.',
  },
})

export interface FeedbackEntry {
  kind: FeedbackKind
  message: string
  screenshot: File | null
}

/** Where the report was sent from, attached to every message. */
export const CONTEXT = 'app.tern.io/roadmap · Chrome 129 · macOS'

/** Every user-facing string of the block. The ones that name the product are functions of `brand.name`. */
export const DEFAULT_COPY = {
  // Embedded section
  embeddedTitle: 'Feedback',
  embeddedDescription: (product: string) => `Tell us how ${product} is working for you. Every message reaches the product team.`,
  // Survey
  surveyLabel: (product: string) => `${product} feedback survey`,
  inlineTitle: 'How are we doing?',
  inlineDescription: 'One question, twice a year. It shapes what we build next.',
  askStatus: 'Quick question · takes 20 seconds',
  sentStatus: 'Answer sent',
  dismissSurvey: 'Dismiss survey',
  question: (product: string) => `How likely are you to recommend ${product} to a friend or colleague?`,
  scaleHint: '0 means not likely at all, 10 means extremely likely.',
  scaleLow: 'Not likely',
  scaleHigh: 'Extremely likely',
  /** The follow-up question, quick reasons, placeholder and thanks for each NPS band. */
  followUp: followUpFor,
  addMore: 'Anything to add?',
  optional: 'Optional',
  notNow: 'Not now',
  send: 'Send',
  sending: 'Sending…',
  sent: 'Sent',
  sendFailed: 'Couldn’t send',
  youSaid: (score: number) => `You said ${score} / 10`,
  invite: 'Invite a teammate',
  inviteCopied: 'Invite link copied',
  inviteCopiedDescription: 'Anyone with it can join your workspace for 7 days.',
  changeAnswer: 'Change answer',
  done: 'Done',
  dismissed: 'Survey dismissed',
  dismissedDescription: 'We won’t ask again this quarter.',
  snoozed: 'We’ll ask again in 2 weeks',
  undo: 'Undo',
  // Feedback form and widget
  widgetButton: 'Feedback',
  formTitle: 'Send feedback',
  formDescription: 'Report a bug, pitch an idea, or tell us what’s working.',
  widgetDescription: (product: string) => `It goes straight to the ${product} team. We read every message.`,
  /** The label, prompt, placeholder and sent note for each feedback type. */
  kinds: kindsFor,
  kindLabel: 'Feedback type',
  tooShort: 'Add a few words so we can act on it.',
  attach: 'Attach a screenshot',
  attached: 'Screenshot attached',
  dropScreenshot: 'Drop a screenshot or',
  browse: 'browse',
  failedTitle: 'Couldn’t send your feedback',
  failedBody: 'Your message is still here. Check your connection and send it again.',
  /** Where the message is sent from, shown under the form. */
  context: CONTEXT,
  sentWith: 'Sent with ',
  sendingFeedback: 'Sending feedback',
  tryAgain: 'Try again',
  sentTitle: 'Sent. Thank you.',
  reference: (ref: string) => `Reference ${ref}`,
  sendAnother: 'Send another',
  close: 'Close',
}

export type FeedbackCopy = typeof DEFAULT_COPY

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

/** A reference for the sent message, as a support desk would issue. */
export const nextReference = (() => {
  let n = 2480
  return () => `FB-${++n}`
})()
