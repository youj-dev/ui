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

/** A cookie listed under its category. */
export interface CookieConsentCookie {
  name: string
  purpose: string
  expires: string
}

/** A group of cookies the visitor can allow or refuse. */
export interface CookieConsentCategory {
  id: string
  title: string
  description: string
  /** Always on, and its switch is locked. */
  required?: boolean
  cookies: CookieConsentCookie[]
}

/** The visitor's choice: allowed or not, by category id. Required categories are always true. */
export type CookieConsentChoices = Record<string, boolean>

export const CATEGORIES: CookieConsentCategory[] = [
  {
    id: 'necessary',
    title: 'Strictly necessary',
    description: 'Keep you signed in, remember your basket and protect the checkout. The site doesn’t work without them.',
    required: true,
    cookies: [
      { name: 'crumb_session', purpose: 'Signed-in session', expires: 'Session' },
      { name: 'crumb_cart', purpose: 'Basket contents', expires: '30 days' },
      { name: '__csrf', purpose: 'Form protection', expires: 'Session' },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Count visits and see which pages people use, so we can bake a better site. Anonymised.',
    cookies: [
      { name: '_pa_id', purpose: 'Distinguishes visitors', expires: '1 year' },
      { name: '_pa_ses', purpose: 'Groups one visit', expires: '30 minutes' },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing',
    description: 'Measure our ads and show you ours elsewhere. Set by our advertising partners.',
    cookies: [
      { name: '_ads_click', purpose: 'Attributes an ad click', expires: '90 days' },
      { name: '_px_ret', purpose: 'Retargeting audience', expires: '180 days' },
    ],
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Remember your delivery area, language and the loaves you like.',
    cookies: [{ name: 'crumb_prefs', purpose: 'Region and language', expires: '1 year' }],
  },
]

/** Every category set to `on`, required ones always true. */
export const choicesFor = (categories: CookieConsentCategory[], on: boolean): CookieConsentChoices =>
  Object.fromEntries(categories.map((c) => [c.id, c.required ? true : on]))

export const DEFAULT_COPY = {
  title: 'A few cookies, if that’s all right',
  description: 'We use them to keep your basket, count visits and, with your say-so, measure our ads. Read the',
  policyLink: 'cookie policy',
  /** After the policy link. */
  policySuffix: '.',
  customize: 'Customize',
  rejectAll: 'Reject all',
  acceptAll: 'Accept all',
  allowAll: 'Allow all',
  saveChoices: 'Save choices',
  saved: 'Saved',
  /** The corner button's label, and the dialog's title. */
  preferences: 'Cookie preferences',
  dialogDescription: 'Choose which cookies Crumb & Co. may set. You can change this any time from the cookie button.',
  alwaysOn: 'Always on',
  toggleCookies: (open: boolean, count: number) => `${open ? 'Hide' : 'Show'} ${count} ${count === 1 ? 'cookie' : 'cookies'}`,
  cookieColumn: 'Cookie',
  purposeColumn: 'Purpose',
  expiresColumn: 'Expires',
  footnote: 'We never sell data, and we store your choice for six months.',
  announceNone: 'Only necessary cookies are on.',
  announceAll: 'All cookies are on.',
  announceSaved: 'Your cookie choices are saved.',
  /** Shown when saving fails without a message of its own. */
  saveFailed: 'We couldn’t save your choice. Try again.',
}

export type CookieConsentCopy = typeof DEFAULT_COPY
