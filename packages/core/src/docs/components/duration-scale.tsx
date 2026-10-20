import { useRef } from 'react'
import { motion } from 'motion/react'
import { durations, type DurationToken } from '../../lib/youj/tokens'
import { useYouj } from '../../lib/youj/provider'
import { Mono, Panel, ReducedNote, ReplayButton, Toolbar, useCycle, useReplay } from './kit'

/* The duration scale as a literal timeline: every bar fills in real time from
 * the same start, so bar length is duration. Next to it, a switch thumb
 * travels with that duration and the standard ease, so you feel each step. */

const USAGE: Record<DurationToken, string> = {
  instant: 'Hover tints, press states, focus rings',
  fast: 'Icon flips, tooltips, small toggles',
  base: 'The default: menus, popovers, small moves',
  slow: 'Panels, sheets, larger layout moves',
  deliberate: 'Hero moments and page choreography',
}

const tokens = Object.keys(durations) as DurationToken[]
const max = Math.max(...Object.values(durations))

export function DurationScale() {
  const k = useYouj()
  const [key, replay] = useReplay()
  const root = useRef<HTMLDivElement>(null)
  const cycle = useCycle(k.ms('deliberate') * 3.5, root)
  const on = k.reduced || cycle % 2 === 0

  return (
    <div ref={root} className="flex flex-col gap-4">
      <Toolbar>
        <ReplayButton onClick={replay} />
        <ReducedNote />
        {k.timeScale !== 1 && (
          <Mono className="text-fg-muted">
            speed ×{1 / k.timeScale} · values below are scaled
          </Mono>
        )}
      </Toolbar>
      <Panel className="divide-y divide-line">
        {tokens.map((t) => (
          <div key={t} className="grid grid-cols-[132px_1fr_52px] items-center gap-4 px-4 py-3 sm:grid-cols-[168px_64px_1fr_52px]">
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold tracking-tight text-fg">{t}</span>
              <Mono className="whitespace-nowrap text-[10.5px] text-fg-muted">--yj-duration-{t}</Mono>
            </div>
            <Mono className="hidden text-[13px] text-fg sm:block">{Math.round(k.ms(t))}ms</Mono>
            <div className="flex flex-col gap-1.5">
              <div className="relative h-2 overflow-hidden rounded-full bg-well">
                <motion.div
                  key={key}
                  aria-hidden
                  className="absolute inset-y-0 left-0 origin-left rounded-full bg-accent"
                  style={{ width: `${(durations[t] / max) * 100}%` }}
                  initial={{ scaleX: k.reduced ? 1 : 0 }}
                  animate={{ scaleX: 1 }}
                  transition={k.reduced ? { duration: 0 } : { ...k.tween(t, 'linear'), delay: k.duration('fast') }}
                />
              </div>
              <span className="text-[12.5px] text-fg-muted">{USAGE[t]}</span>
            </div>
            <div aria-hidden className="relative h-5 w-10 justify-self-end rounded-full border border-line bg-well p-[3px]">
              <motion.div
                className="size-3 rounded-full bg-fg"
                animate={{ x: on ? 20 : 0 }}
                transition={k.reduced ? { duration: 0 } : k.tween(t, 'standard')}
              />
            </div>
          </div>
        ))}
      </Panel>
    </div>
  )
}
