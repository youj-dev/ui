import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { finalStates, lastReached, type StepTrackerAttempt, type StepTrackerItem, type StepTrackerScan, type StepTrackerStepState } from './data'

/** What the rail shows at a moment of the journey. */
export interface JourneyView {
  /** The stage the parcel is at: where the token is. */
  at: number
  states: StepTrackerStepState[]
  /** The token is going round the retry loop. */
  looping: boolean
  /** It has been round the loop: the loop stays drawn. */
  retried: boolean
  /** The journey is playing. */
  playing: boolean
}

export interface JourneyEvents {
  /** A delivery attempt failed; it will be retried. */
  missed: (attempt: StepTrackerAttempt) => void
  /** Delivered after this many attempts. */
  retried: (attempts: number) => void
  /** Refused at this stage, going back to the sender. */
  returned: (stage: StepTrackerScan) => void
  finished: () => void
}

const settled = (item: StepTrackerItem): JourneyView => ({
  at: lastReached(item),
  states: finalStates(item),
  looping: false,
  retried: item.scans.some((s) => s.attempts?.some((a) => !a.ok)),
  playing: false,
})
/** Ordered, nothing else yet: where a journey waits to be seen. */
const waiting = (item: StepTrackerItem): JourneyView => ({
  at: 0,
  states: item.scans.map((_, i) => (i === 0 ? 'done' : 'pending')),
  looping: false,
  retried: false,
  playing: false,
})

/**
 * Plays a parcel's journey, stage by stage, on the youj clock: the token
 * leaves for the next scan, arrives and works it, and finishes it. A missed
 * delivery flashes, takes the retry loop and tries again the next day; a
 * refused stage ends the road and skips the rest. `run` replays it; `start`
 * holds it at the order until the rail is seen. Under reduced motion it is
 * the finished journey from the start, and a replay changes nothing but the
 * announcement.
 */
export function useJourney(item: StepTrackerItem, run: number, start: boolean, events: JourneyEvents) {
  const k = useYouj()
  // Where the journey stands at its start: settled, waiting to be seen, or about to play.
  const opening = () => (k.reduced ? settled(item) : { ...waiting(item), playing: start })
  const [view, setView] = useState(opening)
  const on = useRef(events)
  useLayoutEffect(() => {
    on.current = events
  })

  // A new item, replay, start or clock goes back to the opening.
  const [seen, setSeen] = useState({ item, run, start, k })
  if (seen.item !== item || seen.run !== run || seen.start !== start || seen.k !== k) {
    setSeen({ item, run, start, k })
    setView(opening())
  }

  useEffect(() => {
    if (k.reduced || !start) return
    const states: StepTrackerStepState[] = item.scans.map((_, i) => (i === 0 ? 'done' : 'pending'))
    const show = (patch: Partial<JourneyView> = {}) => setView((v) => ({ ...v, ...patch, states: [...states] }))
    const timers: ReturnType<typeof setTimeout>[] = []
    let clock = 0
    const after = (ms: number, fn: () => void) => {
      clock += ms
      timers.push(setTimeout(fn, clock))
    }
    const travel = k.ms('deliberate')
    const work = k.ms('slow') * 1.5

    item.scans.forEach((stage, i) => {
      if (i === 0 || stage.outcome === 'skipped') return
      // The stage is in progress from the moment the token leaves for it.
      after(k.ms('fast'), () => {
        states[i] = 'active'
        show({ at: i })
      })
      // It arrives a travel later, and works the stage from there.
      clock += travel
      const misses = stage.attempts?.filter((a) => !a.ok) ?? []
      for (const attempt of misses) {
        after(work, () => {
          states[i] = 'failed'
          show()
          on.current.missed(attempt)
        })
        after(work * 0.6, () => show({ looping: true, retried: true }))
        after(travel * 1.8, () => {
          states[i] = 'active'
          show({ looping: false })
        })
      }
      after(work, () => {
        states[i] = stage.outcome === 'ok' ? 'done' : 'failed'
        if (stage.outcome === 'failed') for (let j = i + 1; j < states.length; j++) states[j] = 'skipped'
        show()
        if (stage.outcome === 'failed') on.current.returned(stage)
        else if (misses.length) on.current.retried(misses.length + 1)
      })
    })
    after(k.ms('slow'), () => {
      show({ playing: false })
      on.current.finished()
    })
    return () => timers.forEach(clearTimeout)
  }, [item, run, start, k])

  return view
}
