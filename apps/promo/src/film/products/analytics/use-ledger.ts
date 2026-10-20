import { useEffect, useMemo, useRef, useState } from 'react'
import { useAnnouncer } from '@youj/react/hooks/use-announcer'
import { makeWeeks } from './data'
import { signed, span } from './format'

export interface LedgerOptions {
  /** Weeks back from this one: 1 is last week's memo, 0 the week in progress. */
  defaultWeek: number
  defaultDriver?: string
  /** How long a week takes to arrive, in ms. */
  latency: number
}

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
}

/**
 * The Ledger's state: which week is shown and which is on its way (the
 * masthead turns at once, the page follows once the week has loaded; a
 * second turn mid-load restarts the wait), which driver the page is turned
 * to, what's announced, and the keys: [ and ] turn the week, the arrows too
 * when nothing else wants them, and Escape goes back to the memo.
 */
export function useLedger({ defaultWeek, defaultDriver, latency }: LedgerOptions) {
  const [now] = useState(() => Date.now())
  const weeks = useMemo(() => makeWeeks(now), [now])
  const [target, setTarget] = useState(defaultWeek)
  const [shown, setShown] = useState(defaultWeek)
  const [driverId, setDriverId] = useState<string | null>(() => (weeks[defaultWeek]!.drivers.some((d) => d.id === defaultDriver) ? defaultDriver! : null))
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const headline = useRef<HTMLHeadingElement>(null)
  const { announce, announcer } = useAnnouncer()
  const week = weeks[shown]!
  const driver = week.drivers.find((d) => d.id === driverId) ?? null

  const turn = (next: number) => {
    if (next < 0 || next >= weeks.length || next === target) return
    setTarget(next)
    clearTimeout(timer.current)
    const land = () => {
      setShown(next)
      setDriverId(null)
      const w = weeks[next]!
      announce(`Week ${w.number}, ${span(w)}. ${w.headline}`)
    }
    if (latency > 0) timer.current = setTimeout(land, latency)
    else land()
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  const select = (id: string | null) => {
    setDriverId(id)
    const d = week.drivers.find((x) => x.id === id)
    announce(d ? `${d.name}, ${signed(d.amount)}. ${d.headline}` : `Back to the memo for week ${week.number}.`)
  }
  const back = () => {
    select(null)
    requestAnimationFrame(() => headline.current?.focus({ preventScroll: true }))
  }

  const keys = useRef({ turn, target, driverId, back })
  keys.current = { turn, target, driverId, back }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      const current = keys.current
      const free = event.target === document.body || event.target === document.documentElement || (event.target as HTMLElement).tabIndex === -1
      if (event.key === '[' || (free && event.key === 'ArrowLeft')) current.turn(current.target + 1)
      else if (event.key === ']' || (free && event.key === 'ArrowRight')) current.turn(current.target - 1)
      else if (event.key === 'Escape' && current.driverId) current.back()
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return { weeks, week, targetWeek: weeks[target]!, target, driver, loading: target !== shown, turn, select, back, headline, announcer }
}
