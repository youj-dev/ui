'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSoundCue } from '@youj/core'
import { PlayIcon, RotateCcwIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { ShareRing } from '../../../components/ui/share-ring'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import type { ProcedureCopy, ProcedureStep } from './data'

interface Timer {
  /** Seconds left while paused; while running, when it ends. */
  left: number
  endsAt?: number
}

/** The steps' timers: one clock ticks while any runs, and a timer that runs out sounds and is announced. */
function useTimers(steps: ProcedureStep[], onDone: (step: ProcedureStep) => void) {
  const [started, setTimers] = useState<Record<string, Timer>>(() =>
    Object.fromEntries(steps.flatMap((s) => (s.timer ? [[s.id, { left: s.timer }]] : []))),
  )
  const [now, setNow] = useState(() => Date.now())
  // A running timer that has reached zero reads as stopped.
  const timers = useMemo(
    () => Object.fromEntries(Object.entries(started).map(([id, t]) => [id, t.endsAt !== undefined && t.endsAt <= now ? { left: 0 } : t])) as Record<string, Timer>,
    [started, now],
  )
  const running = Object.values(timers).some((t) => t.endsAt !== undefined)
  const done = useRef(onDone)
  useLayoutEffect(() => {
    done.current = onDone
  })

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [running])

  // A running timer that reaches zero is announced, once.
  const announced = useRef<Record<string, number>>({})
  useEffect(() => {
    for (const step of steps) {
      const t = started[step.id]
      if (t?.endsAt !== undefined && t.endsAt <= now && announced.current[step.id] !== t.endsAt) {
        announced.current[step.id] = t.endsAt
        done.current(step)
      }
    }
  }, [now, started, steps])

  const leftOf = (id: string) => {
    const t = timers[id]
    if (!t) return 0
    return t.endsAt === undefined ? t.left : Math.max(0, Math.ceil((t.endsAt - now) / 1000))
  }
  const toggle = (step: ProcedureStep) => {
    const t = timers[step.id]
    if (!t || !step.timer) return
    setNow(Date.now())
    setTimers((all) => ({
      ...all,
      [step.id]:
        t.endsAt !== undefined ? { left: leftOf(step.id) } : t.left === 0 ? { left: step.timer! } : { left: t.left, endsAt: Date.now() + t.left * 1000 },
    }))
  }
  return { leftOf, toggle, isRunning: (id: string) => timers[id]?.endsAt !== undefined }
}

const clock = (seconds: number, locale: string) => {
  const two = numberFormat(locale, { minimumIntegerDigits: 2 })
  return `${numberFormat(locale).format(Math.floor(seconds / 60))}:${two.format(seconds % 60)}`
}

interface StepsProps {
  steps: ProcedureStep[]
  copy: ProcedureCopy
  SectionTitle: 'h2' | 'h3'
  titleId: string
  announce: (text: string) => void
}

/** The steps, numbered; a step with a timer carries a pill with a small ring that empties as it counts down. */
function Steps({ steps, copy, SectionTitle, titleId, announce }: StepsProps) {
  const cue = useSoundCue()
  const { leftOf, toggle, isRunning } = useTimers(steps, (step) => {
    cue('success')
    announce(copy.timerDone(step.timerName ?? copy.step(steps.indexOf(step) + 1)))
  })

  return (
    <section aria-labelledby={titleId} className="flex min-w-0 flex-col gap-4">
      <Eyebrow render={<SectionTitle id={titleId} />}>{copy.steps}</Eyebrow>
      <ol className="flex flex-col">
        {steps.map((step, i) => {
          const left = leftOf(step.id)
          const running = isRunning(step.id)
          const finished = !!step.timer && left === 0
          const name = step.timerName ?? copy.step(i + 1)
          const time = clock(left, copy.locale)
          return (
            <li key={step.id} className="flex gap-3.5 border-t border-line py-3 first:border-t-0 first:pt-0">
              <span aria-hidden className="w-5 shrink-0 pt-px font-mono text-ui-sm text-fg-muted tabular-nums">
                {numberFormat(copy.locale, { minimumIntegerDigits: 2 }).format(i + 1)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5">
                <p className="text-ui-lg text-pretty text-fg">
                  <span className="sr-only">{copy.step(i + 1)}: </span>
                  {step.text}
                </p>
                {step.timer && (
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={finished ? copy.resetTimer(name) : running ? copy.pauseTimer(name, time) : copy.startTimer(name, time)}
                    aria-pressed={running}
                    onClick={() => toggle(step)}
                    className={cn('gap-2 ps-1.5 font-mono tabular-nums', finished && 'text-success-text')}
                  >
                    <span aria-hidden className="grid place-items-center">
                      <ShareRing
                        size="xs"
                        legend={false}
                        // Dark until it's started; then the time left, lit (in the accent while it runs); full in the success tone once done.
                        segments={[{ id: 'left', label: name, value: finished ? 1 : running || left < step.timer ? left : 0, tone: finished ? 'success' : running ? 'accent' : 'neutral' }]}
                        max={finished ? 1 : step.timer}
                      />
                    </span>
                    <span className="min-w-[4.5ch] text-start">{finished ? copy.done : time}</span>
                    {finished ? <RotateCcwIcon size={13} /> : <PlayIcon size={13} active={running} />}
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export { Steps }
