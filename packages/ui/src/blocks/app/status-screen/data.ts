export type StatusScreenStatus = '401' | '403' | '503' | 'loading'

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

/** Seconds before each automatic retry on the 503, the last one repeating. */
export const RETRY_DELAYS = [5, 15, 30, 60]

export const DEFAULT_COPY = {
  home: 'Back to home',
  /** The small line over the headline beside a picture; the code is set large without one. */
  errorCode: (code: string) => `Error ${code}`,
  // 401
  unauthorizedTitle: 'Sign in to continue',
  unauthorizedDescription: 'This page is for signed-in members. Sign in and we’ll bring you straight back.',
  signIn: 'Sign in',
  /** Under the buttons when `returnTo` is set. */
  returnHint: (path: string) => `You’ll return to ${path} after signing in.`,
  // 403
  forbiddenTitle: 'You don’t have access to this',
  forbiddenDescription: 'You’re signed in, but your role can’t open this page. Ask a workspace admin to give you access.',
  permissionLabel: 'Needs permission',
  requestAccess: 'Request access',
  requesting: 'Requesting…',
  requested: 'Request sent',
  requestFailed: 'Couldn’t send',
  /** After the request is sent. */
  requestedHint: 'We’ve asked your workspace admins. You’ll get an email when they decide.',
  signedInAs: (account: string) => `Signed in as ${account}`,
  switchAccount: 'Switch account',
  // 503
  unavailableTitle: 'We’re temporarily unavailable',
  unavailableDescription: 'The service is overloaded or restarting, and nothing you did caused it. Your work is safe; we’ll keep trying for you.',
  retry: 'Try now',
  retrying: 'Retrying…',
  backOnline: 'Back online',
  stillDown: 'Still down',
  statusPage: 'Status page',
  /** The countdown to the next automatic retry. */
  retryIn: (seconds: number) => `Trying again in ${seconds}s`,
  retryHint: 'Usually back within a few minutes.',
  // loading
  loadingTitle: 'Getting things ready',
  loadingDescription: 'Opening your workspace and fetching the latest from your team. This takes a few seconds.',
  loadingLabel: 'Loading progress',
  /** After `slowAfter`. */
  loadingSlow: 'This is taking longer than usual.',
  reload: 'Reload',
}

export type StatusScreenCopy = typeof DEFAULT_COPY
