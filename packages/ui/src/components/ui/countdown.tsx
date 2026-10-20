'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type HTMLAttributes, type ReactNode } from 'react'
import { Counter } from '@youj/motion'
import { useLocale } from '@youj/core/lib/youj/provider'
import { cn, listFormat, numberFormat } from '../../lib/utils'

/** What's left, split into whole units (seconds round up, so zero lands exactly on `to`). `total` is in ms. */
export interface CountdownTime {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
}

/** Each unit with the count it wraps at, so 00 → 59 is one step back on the wheels. */
const UNITS = [
  { key: 'days', unit: 'day', cycle: undefined },
  { key: 'hours', unit: 'hour', cycle: 24 },
  { key: 'minutes', unit: 'minute', cycle: 60 },
  { key: 'seconds', unit: 'second', cycle: 60 },
] as const

const TWO_DIGITS: Intl.NumberFormatOptions = { minimumIntegerDigits: 2, useGrouping: false }

function split(total: number): CountdownTime {
  const s = Math.max(0, Math.ceil(total / 1000))
  return { days: Math.floor(s / 86_400), hours: Math.floor(s / 3600) % 24, minutes: Math.floor(s / 60) % 60, seconds: s % 60, total: Math.max(0, total) }
}

/* The spoken text changes at most once a minute: the two largest units while
 * there are days or hours, whole minutes under an hour, then one phrase for
 * the last minute. A polite live region reading every second would drown the page. */
function spoken(time: CountdownTime, locale: string): string {
  if (time.total <= 0) return 'Time’s up'
  const parts = time.days ? [['day', time.days], ['hour', time.hours]] : time.hours ? [['hour', time.hours], ['minute', time.minutes]] : [['minute', time.minutes]]
  const words = parts.filter(([, n]) => n).map(([unit, n]) => numberFormat(locale, { style: 'unit', unit: unit as string, unitDisplay: 'long' }).format(n as number))
  return words.length ? `${listFormat(locale, { type: 'unit', style: 'long' }).format(words)} left` : 'Under a minute left'
}

/** The unit's name as a caption, as Intl writes it after a count ("days", "Tage", "дней"). Fixed, so a caption doesn't change width at 1. */
function unitName(unit: string, locale: string) {
  return numberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).formatToParts(10).find((p) => p.type === 'unit')?.value ?? unit
}

const subscribeNothing = () => () => {}

export interface CountdownProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** When time runs out: a Date, ms since the epoch, or an ISO string. */
  to: Date | number | string
  /** Called once when time runs out, straight after mount if `to` has already passed. */
  onComplete?: () => void
  /** The text read and announced. Default English, e.g. "6 days, 4 hours left", changing at most once a minute. */
  formatLabel?: (time: CountdownTime) => string
  /** A BCP 47 locale for the digits and unit names. Default: the YoujProvider locale. */
  locale?: string
  /** The caption under each unit. Default: the unit's name from Intl in the locale. */
  labels?: Partial<Record<'days' | 'hours' | 'minutes' | 'seconds', ReactNode>>
  /** Stop ticking and hold the last reading, e.g. while it is off screen. Default false. */
  paused?: boolean
}

/**
 * Days, hours, minutes and seconds to a moment, in tabular figures, ticking on
 * the second boundary. Each unit is motion's rolling Counter: a changed digit
 * turns down on its wheel (59 → 00 wraps one step, the tens of a minute hold
 * 0–5), right to left in a short ripple when several change at once. The
 * server and hydration render show held zeros: the time is only read in the
 * browser, so the markup never disagrees. Reduced motion: digits change in
 * place.
 */
function Countdown({ to, onComplete, formatLabel, locale: localeProp, labels, paused = false, className, ...props }: CountdownProps) {
  const locale = useLocale(localeProp)
  const target = to instanceof Date ? to.getTime() : typeof to === 'number' ? to : Date.parse(to)
  const hydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  )
  const [now, setNow] = useState(() => (hydrated ? Date.now() : null))
  const [live, setLive] = useState(false)
  const ready = now !== null
  const left = ready && Number.isFinite(target) ? target - now : 0
  const done = ready && left <= 0
  const time = split(left)

  useEffect(() => {
    if (paused) return
    let id: ReturnType<typeof setTimeout> | undefined
    const tick = () => {
      const t = Date.now()
      setNow(t)
      const rest = target - t
      // Wake exactly when the rounded-up second changes; a timer that fires early just schedules the remainder.
      if (rest > 0) id = setTimeout(tick, rest % 1000 || 1000)
    }
    tick()
    return () => clearTimeout(id)
  }, [target, paused])

  // The region starts announcing after the first real reading, so the page load itself isn't read out.
  useEffect(() => {
    if (ready) setLive(true)
  }, [ready])

  const completeRef = useRef(onComplete)
  completeRef.current = onComplete
  useEffect(() => {
    if (done) completeRef.current?.()
  }, [done])

  return (
    <div
      role="timer"
      data-slot="countdown"
      data-state={!ready ? 'pending' : done ? 'complete' : 'running'}
      className={cn('group/countdown own:inline-flex items-start gap-2 own:text-4xl own:font-semibold own:tracking-tight own:tabular-nums sm:gap-3 own:sm:text-5xl', className)}
      {...props}
    >
      <span className="sr-only" aria-live={live ? 'polite' : 'off'} aria-atomic="true">
        {ready ? (formatLabel ? formatLabel(time) : spoken(time, locale)) : ''}
      </span>
      {UNITS.map((u) => (
        <span key={u.key} aria-hidden data-slot="countdown-unit" data-unit={u.key} className="own:flex flex-col items-center gap-2">
          <span
            dir="ltr"
            className={cn(
              'own:flex overflow-clip rounded-lg border border-line bg-surface px-[0.2em] py-[0.12em] own:leading-none own:text-fg shadow-xs',
              'transition-colors yj-duration-slow ease-standard group-data-[state=complete]/countdown:text-fg-muted group-data-[state=pending]/countdown:text-fg-muted',
            )}
          >
            <Counter mode="roll" value={time[u.key]} format={TWO_DIGITS} locale={locale} cycle={u.cycle} inView={false} />
          </span>
          <span className="own:text-ui-xs own:font-medium own:tracking-[0.08em] own:text-fg-muted own:uppercase">{labels?.[u.key] ?? unitName(u.unit, locale)}</span>
        </span>
      ))}
    </div>
  )
}

export { Countdown }
