import type { MouseEventHandler, ReactNode } from 'react'

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

/** A person shown in the avatar stack of people waiting. */
export interface WaitlistPerson {
  id: string
  name: string
  /** A photo URL. Default: their initials. */
  src?: string
}

/** What joining resolves to: the visitor's place and their referral link. */
export interface WaitlistPlace {
  position: number
  /** The referral link to copy and share, without `https://`. */
  referralLink: string
}

/** The header's link, rendered through `linkComponent`. */
export interface WaitlistCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** The product the page launches. */
export interface WaitlistBrand {
  name: string
  logo?: ReactNode
}

export const PEOPLE: WaitlistPerson[] = [
  { id: 'm', name: 'Mira Chen' },
  { id: 't', name: 'Tomás Rivera' },
  { id: 'a', name: 'Aiko Tanaka' },
  { id: 'n', name: 'Noor Haddad' },
  { id: 's', name: 'Sam Okoro' },
  { id: 'l', name: 'Lea Novak' },
]

export const CTA: WaitlistCta = { label: 'Read the manifesto', href: '#' }

/** The demo's place: #1,284 and a link from the email's name. */
export const demoPlace = (email: string): WaitlistPlace => ({
  position: 1284,
  referralLink: 'aperture.cam/r/' + (email.split('@')[0] || 'you').toLowerCase().replace(/[^a-z0-9]/g, ''),
})

export const DEFAULT_COPY = {
  badge: 'Private beta · opens this winter',
  title: 'See every frame before you shoot it.',
  description: 'Aperture previews light, lens and motion blur live on your phone, so the shot you plan is the shot you get.',
  timerLabel: 'Time until launch',
  days: 'Days',
  hours: 'Hours',
  minutes: 'Minutes',
  seconds: 'Seconds',
  emailLabel: 'Email',
  emailPlaceholder: 'you@studio.com',
  emailInvalid: 'Enter an email like you@studio.com.',
  /** Shown when joining fails without a message of its own. */
  joinFailed: 'We couldn’t add you. Try again in a moment.',
  join: 'Join the waitlist',
  joining: 'Joining…',
  joined: 'You’re in',
  /** The button's label after a failed join. */
  joinError: 'Check your email',
  placeLabel: 'Your place in line',
  saving: 'Saving your spot',
  placeIntro: 'You’re on the list. Your place:',
  shareHint: 'Move up 100 places for every friend who joins with your link.',
  copyLink: 'Copy link',
  copied: 'Copied',
  share: 'Share',
  emailFriend: 'Email a friend',
  waitingLabel: 'People waiting',
  /** After the live count of people waiting. */
  waiting: 'photographers and filmmakers are waiting',
}

export type WaitlistCopy = typeof DEFAULT_COPY
