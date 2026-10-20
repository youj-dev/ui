'use client'

import { useCallback, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { useYouj } from '@youj/core'
import { useLocale } from '@youj/core/lib/youj/provider'
import { useComponentLabels, sessionTimeoutLabels } from '@youj/core/labels'
import { cn, listFormat, numberFormat } from '../../lib/utils'
import { useLiveRegion } from '../../hooks/use-announcer'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './alert-dialog'
import { AsyncButton } from './async-button'
import { Banner, BannerTitle } from './banner'
import { Button } from './button'

/* Warns before an inactive session signs out, for banking, admin and health
 * apps. `useSessionTimeout` holds the clock, `SessionTimeout` draws it.
 *
 * The clock is a timestamp, never a count of ticks: the last activity is a
 * `Date.now()`, and every check works out what is left from it, so a hidden
 * tab (whose timers are throttled or frozen) is right again the moment it
 * wakes. Activity (pointer, key, scroll, the tab coming back) is throttled
 * and, once the warning is up, ignored: only "Stay signed in" extends, so a
 * stray mouse move can't hide a sign-out the person hasn't read.
 *
 * Tabs share one clock over a BroadcastChannel: activity or "stay signed in"
 * in any tab resets all of them, and a sign-out in one signs out the rest
 * (without calling the callbacks again, since the tab that ended it did). No
 * BroadcastChannel, no sharing: each tab then times out on its own.
 *
 * The countdown follows GOV.UK and DWP guidance: the dialog opens with focus
 * on "Stay signed in", Escape means stay signed in, the ticking line is
 * hidden from screen readers, and a polite live region speaks it when the
 * warning starts, each minute, and at 30 and 15 seconds. Under reduced motion
 * the visible line is that same slow phrase instead of a ticking clock. */

const DEFAULT_WARN_BEFORE = 120_000

export type SessionActivityEvent = 'pointer' | 'key' | 'scroll' | 'visibility'
export type SessionStatus = 'active' | 'warning' | 'signedOut'

const EVENTS: Record<Exclude<SessionActivityEvent, 'visibility'>, { names: string[]; target: 'document' | 'window' }> = {
  pointer: { names: ['pointerdown', 'pointermove', 'wheel'], target: 'document' },
  key: { names: ['keydown'], target: 'document' },
  scroll: { names: ['scroll'], target: 'window' },
}

export interface UseSessionTimeoutOptions {
  /** How long a session may sit without activity before it ends, in ms. */
  timeout: number
  /** How long before the end the warning starts, in ms. Default 120000 (2 minutes). */
  warnBefore?: number
  /** What counts as activity. Default all four; `visibility` counts the tab being shown again. */
  events?: SessionActivityEvent[]
  /** Activity is noted at most this often, in ms. Default 1000. */
  throttle?: number
  /** Turn the clock off, say while the person is signed out. Default true. */
  enabled?: boolean
  /** The BroadcastChannel name that ties tabs together. Give each app its own. `false` keeps tabs apart. Default `youj-session-timeout`. */
  channel?: string | false
  /** Fires once when the warning starts. */
  onWarn?: () => void
  /** "Stay signed in": renew the session on the server. Awaited; if it rejects the warning stays up. */
  onExtend?: () => unknown
  /** Fires once when the session ends because of inactivity: sign out here. */
  onTimeout?: () => void
  /** Fires when the person chooses "Sign out now". Awaited. */
  onSignOut?: () => unknown
}

export interface SessionTimeoutState {
  status: SessionStatus
  /** Whole seconds left while `status` is `warning`, else 0. */
  secondsLeft: number
  /** Awaits `onExtend`, then restarts the clock in every tab. */
  extend: () => Promise<void>
  /** Awaits `onSignOut`, then ends the session in every tab. */
  signOut: () => Promise<void>
  /** Starts a fresh session, for after the person has signed in again. */
  reset: () => void
  /** Pretends the person has been idle until the warning starts. For demos and tests. */
  simulateIdle: () => void
}

type Message = { type: 'activity' | 'extend' | 'signout' | 'timeout'; at: number }

export function useSessionTimeout(options: UseSessionTimeoutOptions): SessionTimeoutState {
  const { timeout, warnBefore = DEFAULT_WARN_BEFORE, enabled = true, throttle = 1000, channel = 'youj-session-timeout' } = options
  const events: readonly SessionActivityEvent[] = options.events ?? ['pointer', 'key', 'scroll', 'visibility']
  const eventsKey = events.join()
  const warnAt = Math.min(warnBefore, timeout)

  const [state, setState] = useState<{ status: SessionStatus; secondsLeft: number }>({ status: 'active', secondsLeft: 0 })
  const last = useRef(0)
  const status = useRef<SessionStatus>('active')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastSent = useRef(0)
  const port = useRef<BroadcastChannel | null>(null)
  const warned = useRef(false)
  const latest = useRef(options)
  latest.current = options

  const send = useCallback((type: Message['type']) => port.current?.postMessage({ type, at: Date.now() } satisfies Message), [])

  const apply = useCallback((next: SessionStatus, secondsLeft = 0) => {
    status.current = next
    setState((prev) => (prev.status === next && prev.secondsLeft === secondsLeft ? prev : { status: next, secondsLeft }))
  }, [])

  /* Works out where the clock stands from the timestamp, then books the next look. */
  const check = useCallback(
    function check() {
      clearTimeout(timer.current)
      if (status.current === 'signedOut') return
      const left = timeout - (Date.now() - last.current)
      if (left <= 0) {
        apply('signedOut')
        send('timeout')
        latest.current.onTimeout?.()
        return
      }
      if (left <= warnAt) {
        apply('warning', Math.ceil(left / 1000))
        if (!warned.current) {
          warned.current = true
          latest.current.onWarn?.()
        }
        timer.current = setTimeout(check, Math.min(1000, left))
        return
      }
      warned.current = false
      apply('active')
      timer.current = setTimeout(check, left - warnAt)
    },
    [timeout, warnAt, apply, send],
  )

  const restart = useCallback(() => {
    last.current = Date.now()
    warned.current = false
    apply('active')
    check()
  }, [apply, check])

  const extend = useCallback(async () => {
    await latest.current.onExtend?.()
    if (status.current === 'signedOut') return
    send('extend')
    restart()
  }, [restart, send])

  const signOut = useCallback(async () => {
    await latest.current.onSignOut?.()
    clearTimeout(timer.current)
    apply('signedOut')
    send('signout')
  }, [apply, send])

  const simulateIdle = useCallback(() => {
    if (status.current !== 'active') return
    last.current = Date.now() - (timeout - warnAt)
    check()
  }, [timeout, warnAt, check])

  // biome-ignore lint/correctness/useExhaustiveDependencies: `events` is tracked by its joined key
  useEffect(() => {
    if (!enabled) return
    last.current = Date.now()
    apply('active')
    check()

    const note = () => {
      // Once the warning is up only "Stay signed in" extends.
      if (status.current !== 'active') return
      const now = Date.now()
      if (now - lastSent.current < throttle) return
      lastSent.current = now
      last.current = now
      send('activity')
      check()
    }
    const cleanups: Array<() => void> = []
    for (const [name, spec] of Object.entries(EVENTS)) {
      if (!events.includes(name as keyof typeof EVENTS)) continue
      const target = spec.target === 'document' ? document : window
      for (const event of spec.names) {
        target.addEventListener(event, note, { passive: true, capture: true })
        cleanups.push(() => target.removeEventListener(event, note, { capture: true }))
      }
    }
    // A hidden tab's timers can't be trusted: look again as it wakes, and count the return as activity only if the session is still live.
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      check()
      if (events.includes('visibility')) note()
    }
    document.addEventListener('visibilitychange', onVisible)
    cleanups.push(() => document.removeEventListener('visibilitychange', onVisible))

    if (channel && typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(channel)
      port.current = bc
      bc.onmessage = ({ data }: MessageEvent<Message>) => {
        if (status.current === 'signedOut') return
        if (data.type === 'signout' || data.type === 'timeout') {
          clearTimeout(timer.current)
          apply('signedOut')
        } else {
          // Activity or "stay signed in" in another tab is activity here too, even over the warning.
          last.current = Math.max(last.current, Math.min(data.at, Date.now()))
          warned.current = false
          check()
        }
      }
      cleanups.push(() => {
        bc.close()
        port.current = null
      })
    }
    return () => {
      clearTimeout(timer.current)
      for (const cleanup of cleanups) cleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `events` is tracked by its joined key
  }, [enabled, channel, throttle, eventsKey, apply, check, send])

  return { status: state.status, secondsLeft: state.secondsLeft, extend, signOut, reset: restart, simulateIdle }
}

/** The key that changes when the countdown should be spoken: at the start, each minute, then at 30 and 15 seconds. */
function announceStep(seconds: number) {
  return seconds <= 15 ? 15 : seconds <= 30 ? 30 : seconds <= 60 ? 60 : Math.ceil(seconds / 60) * 60
}

function clock(seconds: number, locale: string) {
  const two = numberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false })
  return `${numberFormat(locale, { useGrouping: false }).format(Math.floor(seconds / 60))}:${two.format(seconds % 60)}`
}

/** "1 minute, 42 seconds", in the person's language, for a screen reader. */
function spoken(seconds: number, locale: string) {
  const parts: string[] = []
  const minutes = Math.floor(seconds / 60)
  if (minutes) parts.push(numberFormat(locale, { style: 'unit', unit: 'minute', unitDisplay: 'long' }).format(minutes))
  if (seconds % 60 || !minutes) parts.push(numberFormat(locale, { style: 'unit', unit: 'second', unitDisplay: 'long' }).format(seconds % 60))
  return listFormat(locale, { type: 'unit', style: 'long' }).format(parts)
}

interface SessionSignedOutProps extends Omit<ComponentProps<'section'>, 'title'> {
  /** Called by the Sign in again button. */
  onSignIn?: () => unknown
  /** Heading. Default "You've been signed out". */
  title?: ReactNode
  /** Explanation under the heading. */
  description?: ReactNode
  /** The button's label. Default "Sign in again". */
  signInLabel?: string
}

/** The page a session ends on: a warning band, the reason and a way back in. Focus lands on its heading. */
function SessionSignedOut({ onSignIn, title, description, signInLabel, className, ...props }: SessionSignedOutProps) {
  const labels = useComponentLabels(sessionTimeoutLabels)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  title ??= labels.sessionTimeoutDoneTitle
  return (
    <section data-slot="session-signed-out" className={cn('own:flex own:min-h-dvh own:flex-col own:bg-canvas', className)} {...props}>
      <Banner variant="warning" aria-label={typeof title === 'string' ? title : labels.sessionTimeoutDoneTitle}>
        <BannerTitle>{title}</BannerTitle>
      </Banner>
      <div className="own:mx-auto own:flex own:w-full own:max-w-md own:flex-1 own:flex-col own:items-start own:justify-center own:gap-4 own:px-6 own:py-12">
        <h1 ref={heading} tabIndex={-1} className="own:text-xl own:leading-7 own:font-semibold own:tracking-tight text-fg outline-none">
          {title}
        </h1>
        <p className="own:text-ui text-pretty own:text-fg-muted">{description ?? labels.sessionTimeoutDoneBody}</p>
        <Button data-slot="session-sign-in" onClick={() => onSignIn?.()}>
          {signInLabel ?? labels.sessionTimeoutSignIn}
        </Button>
      </div>
    </section>
  )
}

interface SessionTimeoutProps extends UseSessionTimeoutOptions {
  /** The app, or a function of the session (`status`, `secondsLeft`, `extend`, `simulateIdle`…). Replaced by the signed-out page once the session ends, so nothing stays on screen. */
  children?: ReactNode | ((session: SessionTimeoutState) => ReactNode)
  /** Called by the signed-out page's Sign in again button: go to your sign-in. */
  onSignIn?: () => unknown
  /** Replaces the signed-out page. `false` shows none. */
  signedOut?: ReactNode | false
}

function SessionTimeout({ children, onSignIn, signedOut, ...options }: SessionTimeoutProps) {
  const labels = useComponentLabels(sessionTimeoutLabels)
  const k = useYouj()
  const locale = useLocale()
  const session = useSessionTimeout(options)
  const { status, secondsLeft } = session
  const live = useLiveRegion()
  const stay = useRef<HTMLButtonElement>(null)

  // What is spoken only changes at the announcement steps; reduced motion shows that same slow phrase.
  const step = status === 'warning' ? announceStep(secondsLeft) : 0
  const [heard, setHeard] = useState({ step: 0, seconds: 0 })
  if (step !== heard.step) setHeard({ step, seconds: secondsLeft })
  const first = useRef(true)
  // biome-ignore lint/correctness/useExhaustiveDependencies: speak once per step
  useEffect(() => {
    if (!step) {
      first.current = true
      return
    }
    // The dialog's own description says the first one as it opens.
    if (first.current) first.current = false
    else live.announce(labels.sessionTimeoutWarning(spoken(heard.seconds, locale)))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- speak once per step
  }, [step])

  if (status === 'signedOut' && signedOut !== false) {
    return <>{signedOut ?? <SessionSignedOut onSignIn={onSignIn} />}</>
  }

  const words = spoken(heard.seconds, locale)
  return (
    <>
      {typeof children === 'function' ? children(session) : children}
      <span role="status" aria-live="polite" ref={live.politeRef} className="sr-only" data-slot="session-timeout-announcer" />
      <AlertDialog
        open={status === 'warning'}
        // Escape is the only way out besides the buttons, and it means "stay signed in".
        onOpenChange={(open) => {
          if (!open) session.extend().catch(() => {})
        }}
      >
        <AlertDialogContent size="default" initialFocus={stay} data-slot="session-timeout-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{labels.sessionTimeoutTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {/* The ticking line is for eyes; the sentence screen readers get changes only at the announcement steps. */}
              <span className="sr-only">{labels.sessionTimeoutWarning(words)} </span>
              <span aria-hidden data-slot="session-timeout-countdown" className="own:block own:text-fg own:tabular-nums">
                {labels.sessionTimeoutWarning(k.reduced ? words : clock(secondsLeft, locale))}
              </span>
              <span className="own:mt-1 own:block">{labels.sessionTimeoutReason}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" data-slot="session-timeout-sign-out" onClick={() => void session.signOut()}>
              {labels.sessionTimeoutSignOut}
            </Button>
            <AsyncButton ref={stay} data-slot="session-timeout-stay" onAction={session.extend}>
              {labels.sessionTimeoutStay}
            </AsyncButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export { SessionTimeout, SessionSignedOut, type SessionTimeoutProps, type SessionSignedOutProps }
