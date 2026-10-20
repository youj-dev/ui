import { AUTH_COPY } from '../../auth/shell/copy'

/* The auth flow's steps, the way each one slides, its words and its demo
 * handlers. The step bodies' words are the auth pages' (auth/shell/copy.ts),
 * so a page and its step always read the same; the flow adds its own few. */

export const AUTH_VIEWS = ['sign-in', 'sign-up', 'forgot', 'forgot-sent', 'reset', 'reset-done', 'two-factor', 'magic-link-sent', 'signed-in'] as const
export type AuthView = (typeof AUTH_VIEWS)[number]

/** How far into the journey each step sits: a deeper step slides in from the end, a shallower one from the start. */
export const DEPTH: Record<AuthView, number> = {
  'sign-in': 0,
  'sign-up': 1,
  forgot: 1,
  'two-factor': 1,
  'magic-link-sent': 1,
  'forgot-sent': 2,
  reset: 3,
  'reset-done': 4,
  'signed-in': 5,
}

export const DEFAULT_COPY = {
  ...AUTH_COPY,
  signedInTitle: 'You’re signed in',
  signedInDescription: 'Your Northwind workspace is ready when you are.',
  openWorkspace: 'Open your workspace',
  /** What a screen reader hears as each step arrives. */
  announce: (title: string) => `${title}.`,
}
export type AuthFlowCopy = typeof DEFAULT_COPY

/** Each step's heading, which is also what's announced when it arrives. */
export const TITLE: Record<AuthView, (c: AuthFlowCopy) => string> = {
  'sign-in': (c) => c.signInTitle,
  'sign-up': (c) => c.signUpTitle,
  forgot: (c) => c.forgotTitle,
  'forgot-sent': (c) => c.checkEmailTitle,
  reset: (c) => c.resetTitle,
  'reset-done': (c) => c.resetDoneTitle,
  'two-factor': (c) => c.twoFactorTitle,
  'magic-link-sent': (c) => c.inboxTitle,
  'signed-in': (c) => c.signedInTitle,
}

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

/** The demo's sign-in asks for a second factor, so the whole journey can be walked. */
export async function demoSignIn(): Promise<'two-factor'> {
  await demo('AuthFlow: onSignIn', 1200)
  return 'two-factor'
}

/** The demo accepts any code but all zeros. */
export async function demoVerify(code: string) {
  await demo('AuthFlow: onVerifyCode', 900)
  return !/^0+$/.test(code)
}
